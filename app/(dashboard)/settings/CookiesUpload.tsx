import { useState } from 'react';

export default function CookiesUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');

  const handleUpload = async () => {
    if (!file) return;
    setStatus('Enviando...');
    const formData = new FormData();
    formData.append('cookies', file);
    const res = await fetch('/api/config/cookies-upload', {
      method: 'POST',
      body: formData,
    });
    if (res.ok) {
      setStatus('Cookies enviados com sucesso!');
    } else {
      setStatus('Falha ao enviar cookies.');
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="font-medium">Upload cookies.txt</label>
      <input type="file" accept=".txt" onChange={e => setFile(e.target.files?.[0] || null)} />
      <button className="bg-blue-600 text-white rounded px-3 py-1" onClick={handleUpload} disabled={!file}>Enviar</button>
      <span className="text-sm text-muted-foreground">{status}</span>
    </div>
  );
}
