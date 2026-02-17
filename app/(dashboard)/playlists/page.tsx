'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Copy, ExternalLink } from 'lucide-react';

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success('Link copiado para a área de transferência!');
};

const appendSuffix = (base: string, suffix: 'direct' | 'proxy') => {
  // Sempre retorna padrão playlist_<tipo>_<suffix>.m3u
  return `playlist_${base}_${suffix}.m3u`;
};

export default function PlaylistsPage() {
  const [baseUrl, setBaseUrl] = useState('');
  // Usar nomes fixos padronizados
  const playlistLive = 'live';
  const playlistUpcoming = 'upcoming';
  const playlistVod = 'vod';
  const epgFile = 'epg.xml';
  const [generateDirect, setGenerateDirect] = useState(true);
  const [generateProxy, setGenerateProxy] = useState(true);

  useEffect(() => {
    const fetchConfigs = async () => {
      const res = await fetch('/api/config/public');
      if (res.ok) {
        const data = await res.json();
        const resolvedUrl = data.TUBEWRANGLERR_URL || window.location.origin;
        setBaseUrl(resolvedUrl);
        // Nomes fixos, não sobrescreve
        setGenerateDirect((data.PLAYLIST_GENERATE_DIRECT || 'true').toString().toLowerCase() === 'true');
        setGenerateProxy((data.PLAYLIST_GENERATE_PROXY || 'true').toString().toLowerCase() === 'true');
      } else {
        setBaseUrl(window.location.origin);
      }
    };

    fetchConfigs();
  }, []);

  const renderLinkCard = (title: string, url: string) => (
    <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
      <h3 className="text-lg font-semibold leading-none tracking-tight mb-3">{title}</h3>
      <div className="flex items-center gap-2 bg-muted p-3 rounded-md">
        <input readOnly value={url} className="flex-1 bg-transparent p-1 text-sm outline-none font-mono" />
        <button onClick={() => copyToClipboard(url)} className="p-2 text-muted-foreground hover:text-primary transition-colors" title="Copiar Link">
          <Copy className="h-4 w-4" />
        </button>
        <a href={url} target="_blank" rel="noopener noreferrer" className="p-2 text-muted-foreground hover:text-primary transition-colors" title="Abrir em Nova Aba">
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Playlists e EPG</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {generateProxy && renderLinkCard('Live (Proxy)', `${baseUrl}/api/playlist_${playlistLive}_proxy.m3u`)}
        {generateDirect && renderLinkCard('Live (Direct)', `${baseUrl}/api/playlist_${playlistLive}_direct.m3u`)}
        {generateProxy && renderLinkCard('Upcoming (Proxy)', `${baseUrl}/api/playlist_${playlistUpcoming}_proxy.m3u`)}
        {generateProxy && renderLinkCard('VOD (Proxy)', `${baseUrl}/api/playlist_${playlistVod}_proxy.m3u`)}
        {generateDirect && renderLinkCard('VOD (Direct)', `${baseUrl}/api/playlist_${playlistVod}_direct.m3u`)}
        {renderLinkCard('Guia de Programação (EPG)', `${baseUrl}/api/epg.xml`)}
      </div>

      <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
        <p>
          <strong>Atenção:</strong> A URL base <strong>({baseUrl})</strong> é detectada automaticamente. Configure <code>TUBEWRANGLERR_URL</code> se você usar proxy reverso.
        </p>
      </div>
    </div>
  );
}
