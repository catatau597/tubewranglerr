import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getConfig } from '@/lib/config';
import { TitleComponent } from '@/app/(dashboard)/settings/title-format/page';
import { Stream } from '@prisma/client';

interface TitleFormatConfig {
  components: TitleComponent[];
  useBrackets: boolean;
}

// Função auxiliar para gerar o título formatado
const generateDisplayTitle = (stream: Stream, channelTitle: string, config: TitleFormatConfig): string => {
  const example: Record<string, string> = {
    status: stream.status === 'live' ? 'AO VIVO' : (stream.status === 'upcoming' ? 'AGENDADO' : 'GRAVADO'),
    channelName: channelTitle,
    eventName: stream.title,
    dateTime: stream.scheduledStart ? new Date(stream.scheduledStart).toLocaleString('pt-BR') : '',
    youtubePlaylist: 'N/A', // Esta informação não está disponível no nosso modelo de dados atual
  };

  const activeComponents = config.components.filter(c => c.enabled);
  if (activeComponents.length === 0) return stream.title;

  const titleParts = activeComponents.map(c => {
    const text = example[c.id];
    return config.useBrackets ? `[${text}]` : text;
  });

  return titleParts.join(' ');
};


export async function GET(
  req: Request,
  { params }: { params: { filename: string } }
) {
  const { filename } = params;
  let streams: Stream[] = [];
  
  // 1. Determina o tipo de playlist a partir do nome do arquivo
  if (filename.includes('live')) {
    streams = await prisma.stream.findMany({ where: { status: 'live' }, include: { channel: true } });
  } else if (filename.includes('upcoming')) {
    streams = await prisma.stream.findMany({ where: { status: 'upcoming' }, include: { channel: true } });
  } else if (filename.includes('vod')) {
    streams = await prisma.stream.findMany({ where: { status: 'none' }, include: { channel: true } });
  } else if (filename.endsWith('.xml')) {
    // Lógica do EPG virá aqui no futuro
    return new NextResponse('<tv></tv>', { headers: { 'Content-Type': 'application/xml' } });
  } else {
    return NextResponse.json({ error: 'Playlist não encontrada' }, { status: 404 });
  }

  // 2. Busca a configuração de formato de título
  const titleConfigStr = await getConfig('TITLE_FORMAT_CONFIG');
  const titleConfig: TitleFormatConfig = titleConfigStr 
    ? JSON.parse(titleConfigStr) 
    : { components: [], useBrackets: true }; // Default

  // 3. Gera o conteúdo do M3U
  const m3uLines = ['#EXTM3U'];
  for (const stream of streams) {
    const displayTitle = generateDisplayTitle(stream, stream.channel.title, titleConfig);
    const proxyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/stream/${stream.videoId}`;
    
    m3uLines.push(`#EXTINF:-1 tvg-id="${stream.channel.id}" tvg-name="${stream.channel.title}" tvg-logo="${stream.channel.thumbnailUrl || ''}" group-title="${stream.channel.title}",${displayTitle}`);
    m3uLines.push(proxyUrl);
  }

  const m3uContent = m3uLines.join('\\n');
  
  return new NextResponse(m3uContent, {
    headers: {
      'Content-Type': 'application/vnd.apple.mpegurl',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
