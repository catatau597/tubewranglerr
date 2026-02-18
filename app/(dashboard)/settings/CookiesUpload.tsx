
"use client";
import React, { useState, useEffect } from 'react';
type CookieFile = { name: string };


export default function CookiesUpload() {
    const handleUpload = async () => {
      if (!files || files.length === 0) return;
      setLoading(true);
      setStatus('Enviando...');
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append('file', f, f.name));
      const res = await fetch('/api/config/cookies-upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setStatus('Cookies enviados com sucesso!');
        fetchCookieFiles();
      } else {
        setStatus('Falha ao enviar cookies.');
      }
      setLoading(false);
    };
  const [files, setFiles] = useState<FileList | null>(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [cookieFiles, setCookieFiles] = useState<CookieFile[]>([]);

  async function fetchCookieFiles() {
    try {
      const res = await fetch('/api/config/cookies-list');
      if (res.ok) {
        const data = await res.json();
        setCookieFiles((data.files || []).map((name: string) => ({ name })));
      }
    } catch {
      setCookieFiles([]);
    }
  }

  const handleDelete = async (name: string) => {
    setLoading(true);
    setStatus(`Excluindo ${name}...`);
    const res = await fetch(`/api/config/cookies-delete?file=${encodeURIComponent(name)}`, { method: 'DELETE' });
    if (res.ok) {
      setStatus(`${name} excluído.`);
      fetchCookieFiles();
    } else {
      setStatus(`Falha ao excluir ${name}.`);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-2 max-w-md">
      <label className="font-medium">Upload de arquivos de cookies (.txt)</label>
      <div className="flex gap-2 items-center">
        <label className="bg-gray-200 hover:bg-gray-300 rounded px-3 py-1 text-sm cursor-pointer">
          Escolher arquivos
          <input type="file" accept=".txt" multiple onChange={e => setFiles(e.target.files)} style={{ display: 'none' }} />
        </label>
        <button className="bg-blue-600 text-white rounded px-3 py-1 text-sm" onClick={handleUpload} disabled={!files || files.length === 0 || loading}>Enviar</button>
      </div>
      <span className="text-sm text-muted-foreground">{status}</span>
      <div className="mt-2">
        <span className="text-xs font-semibold">Arquivos de cookies encontrados:</span>
        <ul className="text-xs mt-1">
          {cookieFiles.length === 0 && <li className="text-muted-foreground">Nenhum arquivo encontrado</li>}
          {cookieFiles.map(f => (
            <li key={f.name} className="flex items-center gap-2">
              <span>{f.name}</span>
              <button className="bg-red-600 text-white rounded px-2 py-0.5 text-xs" onClick={() => handleDelete(f.name)} disabled={loading}>Excluir</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
