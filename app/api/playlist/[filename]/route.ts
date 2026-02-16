import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getConfig } from '@/lib/config';
import { TitleComponent } from '@/app/(dashboard)/settings/title-format/page';

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
  createdAt: Date;
}


function xmlEscape(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatXmltvDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())} +0000`;
}

const generateDisplayTitle = (stream: StreamWithChannel, channelTitle: string, config: TitleFormatConfig): string => {
  const example: Record<string, string> = {
    status: stream.status === 'live' ? 'AO VIVO' : (stream.status === 'upcoming' ? 'AGENDADO' : 'GRAVADO'),
    channelName: channelTitle,
    eventName: stream.title,
    dateTime: stream.scheduledStart ? new Date(stream.scheduledStart).toLocaleString('pt-BR') : '',
    youtubePlaylist: 'N/A',
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

  const [liveFilename, upcomingFilename, vodFilename, xmltvFilename, configuredBaseUrl] = await Promise.all([
    getConfig('PLAYLIST_LIVE_FILENAME', 'playlist_live.m3u8'),
    getConfig('PLAYLIST_UPCOMING_FILENAME', 'playlist_upcoming.m3u8'),
    getConfig('PLAYLIST_VOD_FILENAME', 'playlist_vod.m3u8'),
    getConfig('XMLTV_FILENAME', 'youtube_epg.xml'),
    getConfig('TUBEWRANGLERR_URL', ''),
  ]);

  if (filename === liveFilename) {
    streams = await prisma.stream.findMany({ where: { status: 'live' }, include: { channel: true } });
  } else if (filename === upcomingFilename) {
    streams = await prisma.stream.findMany({ where: { status: 'upcoming' }, include: { channel: true } });
  } else if (filename === vodFilename) {
    streams = await prisma.stream.findMany({ where: { status: 'none' }, include: { channel: true } });
  } else if (filename === xmltvFilename) {
    const epgStreams = await prisma.stream.findMany({
      where: { status: { in: ['live', 'upcoming', 'none'] } },
      include: { channel: true },
      orderBy: { scheduledStart: 'asc' },
      take: 2000,
    });

    const channelLines = epgStreams
      .map((s) => `<channel id="${xmlEscape(s.channel.id)}"><display-name>${xmlEscape(s.channel.title)}</display-name></channel>`);

    const uniqueChannelLines = [...new Set(channelLines)];

    const programmeLines = epgStreams.map((stream) => {
      const start = stream.actualStart || stream.scheduledStart || stream.createdAt;
      const stop = stream.actualEnd
        || (stream.actualStart ? new Date(stream.actualStart.getTime() + 2 * 60 * 60 * 1000) : null)
        || (stream.scheduledStart ? new Date(stream.scheduledStart.getTime() + 2 * 60 * 60 * 1000) : null)
        || new Date(start.getTime() + 2 * 60 * 60 * 1000);

      const title = xmlEscape(stream.title || 'Sem título');
      const desc = xmlEscape(stream.description || '');

      return `<programme channel="${xmlEscape(stream.channel.id)}" start="${formatXmltvDate(start)}" stop="${formatXmltvDate(stop)}"><title>${title}</title><desc>${desc}</desc></programme>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?><tv generator-info-name="TubeWranglerr">${uniqueChannelLines.join('')}${programmeLines.join('')}</tv>`;

    return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
  } else {
    return NextResponse.json({ error: 'Playlist não encontrada' }, { status: 404 });
  }

  const titleConfigStr = await getConfig('TITLE_FORMAT_CONFIG');
  let titleConfig: TitleFormatConfig = {
    components: [
      { id: 'status', label: '[STATUS]', enabled: true },
      { id: 'channelName', label: '[NOME DO CANAL]', enabled: true },
      { id: 'eventName', label: '[NOME DO EVENTO]', enabled: true },
    ],
    useBrackets: true,
  };

  if (titleConfigStr) {
    try {
      const parsed = JSON.parse(titleConfigStr);
      if (parsed && Array.isArray(parsed.components)) {
        titleConfig = parsed;
      }
    } catch (e) {
      console.warn('Falha ao analisar TITLE_FORMAT_CONFIG, usando padrão:', e);
    }
  }

  const origin = new URL(req.url).origin;
  const appBaseUrl = configuredBaseUrl || origin;

  const m3uLines = ['#EXTM3U'];
  for (const stream of streams) {
    const channel = stream.channel;
    const displayTitle = generateDisplayTitle(stream, channel.title, titleConfig);
    const proxyUrl = `${appBaseUrl}/api/stream/${stream.videoId}`;
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
