import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getConfig } from '@/lib/config';
import { TitleComponent } from '@/app/(dashboard)/settings/title-format/page';
// Não usar o tipo Stream do Prisma, pois não inclui o campo channel


interface TitleFormatConfig {
  components: TitleComponent[];
  useBrackets: boolean;
}

interface StreamWithChannel {
  videoId: string;
  channelId: string;
  channel: {
    id: string;
    title: string;
    thumbnailUrl?: string | null;
  };
  title: string;
  description?: string | null;
  status: string;
  thumbnailUrl?: string | null;
  watchUrl: string;
  scheduledStart?: Date | null;
  actualStart?: Date | null;
  actualEnd?: Date | null;
  durationISO?: string | null;
}

// Função auxiliar para gerar o título formatado
const generateDisplayTitle = (stream: StreamWithChannel, channelTitle: string, config: TitleFormatConfig): string => {
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
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  let streams: StreamWithChannel[] = [];
  
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
    const channel = stream.channel;
    const displayTitle = generateDisplayTitle(stream, channel.title, titleConfig);
    const proxyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/stream/${stream.videoId}`;
    m3uLines.push(`#EXTINF:-1 tvg-id="${channel.id}" tvg-name="${channel.title}" tvg-logo="${channel.thumbnailUrl || ''}" group-title="${channel.title}",${displayTitle}`);
    m3uLines.push(proxyUrl);
  }

  const m3uContent = m3uLines.join('\n');
  
  return new NextResponse(m3uContent, {
    headers: {
      'Content-Type': 'application/vnd.apple.mpegurl',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
