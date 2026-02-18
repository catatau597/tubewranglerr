
"use client";
import React, { useState, useEffect } from 'react';
type CookieFile = { name: string };


export default function CookiesUpload() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [cookieFiles, setCookieFiles] = useState<CookieFile[]>([]);

  async function fetchCookieFiles() {
    // Lista arquivos .txt na pasta /app (simples, via API customizada futuramente)
    // Por enquanto, assume que só há cookies.txt, youtube.txt, daylomotin.txt, etc.
    // Simula listagem (em produção, idealmente um endpoint que lista arquivos)
    const possible = ['cookies.txt', 'youtube.txt', 'daylomotin.txt'];
    const found: CookieFile[] = [];
    for (const name of possible) {
      try {
        const res = await fetch(`/app/${name}`);
        if (res.ok) found.push({ name });
      } catch {}
    }
    setCookieFiles(found);
  }

  useEffect(() => { fetchCookieFiles(); }, []);

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
        <input type="file" accept=".txt" multiple onChange={e => setFiles(e.target.files)} />
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
