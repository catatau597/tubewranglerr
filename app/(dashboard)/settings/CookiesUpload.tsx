
'use client';
import { useState } from 'react';

export default function CookiesUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [hasCookies, setHasCookies] = useState(false);
  const [loading, setLoading] = useState(false);

  async function checkCookies() {
    try {
      const res = await fetch('/api/config/cookies-upload', { method: 'HEAD' });
      setHasCookies(res.ok);
    } catch {
      setHasCookies(false);
    }
  }
  // Checa existência ao montar
  React.useEffect(() => { checkCookies(); }, []);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('Enviando...');
    const formData = new FormData();
    formData.append('cookies', file);
    const res = await fetch('/api/config/cookies-upload', {
      method: 'POST',
      body: formData,
    });
    if (res.ok) {
      setStatus('Cookies enviados com sucesso!');
      setHasCookies(true);
    } else {
      setStatus('Falha ao enviar cookies.');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    setStatus('Excluindo...');
    const res = await fetch('/api/config/cookies-delete', { method: 'DELETE' });
    if (res.ok) {
      setStatus('Cookies excluídos.');
      setHasCookies(false);
    } else {
      setStatus('Falha ao excluir cookies.');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-2 max-w-md">
      <label className="font-medium">Upload cookies.txt</label>
      <div className="flex gap-2 items-center">
        <input type="file" accept=".txt" onChange={e => setFile(e.target.files?.[0] || null)} />
        <button className="bg-blue-600 text-white rounded px-3 py-1 text-sm" onClick={handleUpload} disabled={!file || loading}>Enviar</button>
        {hasCookies && (
          <button className="bg-red-600 text-white rounded px-3 py-1 text-sm" onClick={handleDelete} disabled={loading}>Excluir</button>
        )}
      </div>
      <span className="text-sm text-muted-foreground">{status}</span>
      {hasCookies && <span className="text-xs text-green-700">Cookies.txt carregado</span>}
    </div>
  );
}
