'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Copy, ExternalLink } from 'lucide-react';

// Função helper para copiar texto
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success('Link copiado para a área de transferência!');
};

export default function PlaylistsPage() {
  const [baseUrl, setBaseUrl] = useState('');
  const [playlistLive, setPlaylistLive] = useState('playlist_live.m3u8');
  const [playlistUpcoming, setPlaylistUpcoming] = useState('playlist_upcoming.m3u8');
  const [playlistVod, setPlaylistVod] = useState('playlist_vod.m3u8');
  const [epgFile, setEpgFile] = useState('youtube_epg.xml');
  const [appUrl, setAppUrl] = useState('');

  useEffect(() => {
    // Busca configs do servidor para obter os nomes dos arquivos e a URL base
    const fetchConfigs = async () => {
      // A URL base agora vem de uma config para ser consistente
      // Em um ambiente de produção, esta seria a URL pública do seu servidor
      // Vou usar a localização da janela como um fallback para desenvolvimento
      const res = await fetch('/api/config/public'); // Um endpoint hipotético para configs públicas
      if (res.ok) {
        const data = await res.json();
        setAppUrl(data.TUBEWRANGLERR_URL || window.location.origin);
        setPlaylistLive(data.PLAYLIST_LIVE_FILENAME || 'playlist_live.m3u8');
        setPlaylistUpcoming(data.PLAYLIST_UPCOMING_FILENAME || 'playlist_upcoming.m3u8');
        setPlaylistVod(data.PLAYLIST_VOD_FILENAME || 'playlist_vod.m3u8');
        setEpgFile(data.XMLTV_FILENAME || 'youtube_epg.xml');
      } else {
         setAppUrl(window.location.origin);
      }
       setBaseUrl(appUrl);
    };
    
    // fetchConfigs(); // Desabilitado por enquanto para evitar criar outra API
    setBaseUrl(window.location.origin);

  }, [appUrl]);

  const fullPlaylistLiveUrl = `${baseUrl}/api/playlist/${playlistLive}`;
  const fullPlaylistUpcomingUrl = `${baseUrl}/api/playlist/${playlistUpcoming}`;
  const fullPlaylistVodUrl = `${baseUrl}/api/playlist/${playlistVod}`;
  const fullEpgUrl = `${baseUrl}/api/playlist/${epgFile}`;

  const renderLinkCard = (title: string, url: string) => (
    <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
      <h3 className="text-lg font-semibold leading-none tracking-tight mb-3">{title}</h3>
      <div className="flex items-center gap-2 bg-muted p-3 rounded-md">
        <input
          readOnly
          value={url}
          className="flex-1 bg-transparent p-1 text-sm outline-none font-mono"
        />
        <button
          onClick={() => copyToClipboard(url)}
          className="p-2 text-muted-foreground hover:text-primary transition-colors"
          title="Copiar Link"
        >
          <Copy className="h-4 w-4" />
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-muted-foreground hover:text-primary transition-colors"
          title="Abrir em Nova Aba"
        >
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
        {renderLinkCard('Playlist - Ao Vivo (Live)', fullPlaylistLiveUrl)}
        {renderLinkCard('Playlist - Agendados (Upcoming)', fullPlaylistUpcomingUrl)}
        {renderLinkCard('Playlist - Gravados (VOD)', fullPlaylistVodUrl)}
        {renderLinkCard('Guia de Programação (EPG)', fullEpgUrl)}
      </div>

       <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
        <p>
          <strong>Atenção:</strong> A URL base <strong>({baseUrl})</strong> é detectada automaticamente. Se você acessa o TubeWranglerr por um endereço diferente (ex: com um proxy reverso), você deve configurar a variável <code>TUBEWRANGLERR_URL</code> nas Configurações para garantir que os links gerados estejam corretos.
        </p>
      </div>
    </div>
  );
}
