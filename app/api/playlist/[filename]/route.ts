import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getBoolConfig, getConfig } from '@/lib/config';
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
    customName?: string | null;
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
  categoryYoutube?: string | null;
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

function parseMappingConfig(value: string): Record<string, string> {
  const result: Record<string, string> = {};
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((entry) => {
      const [left, right] = entry.split('|').map((v) => v?.trim());
      if (left && right) result[left] = right;
    });
  return result;
}

function appendSuffix(filename: string, suffix: 'direct' | 'proxy') {
  if (filename.endsWith('.m3u8')) {
    return filename.replace('.m3u8', `_${suffix}.m3u8`);
  }
  return `${filename}_${suffix}`;
}

const generateDisplayTitle = (
  stream: StreamWithChannel,
  channelTitle: string,
  config: TitleFormatConfig,
  statusLabel: string,
  includeStatus: boolean,
  includeChannelName: boolean,
) => {
  const example: Record<string, string> = {
    status: statusLabel,
    channelName: channelTitle,
    eventName: stream.title,
    dateTime: stream.scheduledStart ? new Date(stream.scheduledStart).toLocaleString('pt-BR') : '',
    youtubePlaylist: 'N/A',
  };

  const activeComponents = config.components
    .filter((c) => c.enabled)
    .filter((c) => (c.id !== 'status' || includeStatus))
    .filter((c) => (c.id !== 'channelName' || includeChannelName));

  if (activeComponents.length === 0) return stream.title;

  const titleParts = activeComponents.map((c) => {
    const text = example[c.id] || c.label;
    return config.useBrackets ? `[${text}]` : text;
  });

  return titleParts.join(' ');
};

export async function GET(req: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;

  const [
    liveFilename,
    upcomingFilename,
    vodFilename,
    xmltvFilename,
    configuredBaseUrl,
    keepRecorded,
    useInvisiblePlaceholder,
    generateDirect,
    generateProxy,
    titleConfigStr,
    categoryMappingsStr,
    channelMappingsStr,
    prefixWithStatus,
    prefixWithChannel,
  ] = await Promise.all([
    getConfig('PLAYLIST_LIVE_FILENAME', 'playlist_live.m3u8'),
    getConfig('PLAYLIST_UPCOMING_FILENAME', 'playlist_upcoming.m3u8'),
    getConfig('PLAYLIST_VOD_FILENAME', 'playlist_vod.m3u8'),
    getConfig('XMLTV_FILENAME', 'youtube_epg.xml'),
    getConfig('TUBEWRANGLERR_URL', ''),
    getBoolConfig('KEEP_RECORDED_STREAMS', true),
    getBoolConfig('USE_INVISIBLE_PLACEHOLDER', false),
    getBoolConfig('PLAYLIST_GENERATE_DIRECT', true),
    getBoolConfig('PLAYLIST_GENERATE_PROXY', true),
    getConfig('TITLE_FORMAT_CONFIG'),
    getConfig('CATEGORY_MAPPINGS'),
    getConfig('CHANNEL_NAME_MAPPINGS'),
    getBoolConfig('PREFIX_TITLE_WITH_STATUS', true),
    getBoolConfig('PREFIX_TITLE_WITH_CHANNEL_NAME', true),
  ]);

  const categoryMappings = parseMappingConfig(categoryMappingsStr);
  const channelMappings = parseMappingConfig(channelMappingsStr);

  const mode: 'direct' | 'proxy' = filename.includes('_direct.') ? 'direct' : 'proxy';

  const liveDirectFilename = appendSuffix(liveFilename, 'direct');
  const liveProxyFilename = appendSuffix(liveFilename, 'proxy');
  const upcomingDirectFilename = appendSuffix(upcomingFilename, 'direct');
  const upcomingProxyFilename = appendSuffix(upcomingFilename, 'proxy');
  const vodDirectFilename = appendSuffix(vodFilename, 'direct');
  const vodProxyFilename = appendSuffix(vodFilename, 'proxy');

  let targetStatus: 'live' | 'upcoming' | 'none' | null = null;
  if (filename === liveFilename || filename === liveDirectFilename || filename === liveProxyFilename) {
    targetStatus = 'live';
  } else if (filename === upcomingFilename || filename === upcomingDirectFilename || filename === upcomingProxyFilename) {
    targetStatus = 'upcoming';
  } else if (filename === vodFilename || filename === vodDirectFilename || filename === vodProxyFilename) {
    targetStatus = 'none';
  } else if (filename === xmltvFilename) {
    const epgStreams = await prisma.stream.findMany({
      where: { status: { in: ['live', 'upcoming', 'none'] } },
      include: { channel: true },
      orderBy: { scheduledStart: 'asc' },
      take: 2000,
    });

    const channelLines = epgStreams.map((s) => {
      const mappedName = channelMappings[s.channel.title] || s.channel.customName || s.channel.title;
      return `<channel id="${xmlEscape(s.channel.id)}"><display-name>${xmlEscape(mappedName)}</display-name></channel>`;
    });
    const uniqueChannelLines = [...new Set(channelLines)];

    const programmeLines = epgStreams.map((stream) => {
      const start = stream.actualStart || stream.scheduledStart || stream.createdAt;
      const stop =
        stream.actualEnd ||
        (stream.actualStart ? new Date(stream.actualStart.getTime() + 2 * 60 * 60 * 1000) : null) ||
        (stream.scheduledStart ? new Date(stream.scheduledStart.getTime() + 2 * 60 * 60 * 1000) : null) ||
        new Date(start.getTime() + 2 * 60 * 60 * 1000);

      const title = xmlEscape(stream.title || 'Sem título');
      const desc = xmlEscape(stream.description || '');

      return `<programme channel="${xmlEscape(stream.channel.id)}" start="${formatXmltvDate(start)}" stop="${formatXmltvDate(stop)}"><title>${title}</title><desc>${desc}</desc></programme>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?><tv generator-info-name="TubeWranglerr">${uniqueChannelLines.join('')}${programmeLines.join('')}</tv>`;
    return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
  } else {
    return NextResponse.json({ error: 'Playlist não encontrada' }, { status: 404 });
  }

  if (targetStatus === 'none' && !keepRecorded) {
    return new NextResponse('#EXTM3U\n# KEEP_RECORDED_STREAMS=false\n', {
      headers: { 'Content-Type': 'application/vnd.apple.mpegurl' },
    });
  }

  if (mode === 'direct' && !generateDirect) {
    return NextResponse.json({ error: 'Playlist direta desativada' }, { status: 404 });
  }
  if (mode === 'proxy' && !generateProxy) {
    return NextResponse.json({ error: 'Playlist proxy desativada' }, { status: 404 });
  }

  const streams = await prisma.stream.findMany({
    where: { status: targetStatus },
    include: { channel: true },
    orderBy: [{ scheduledStart: 'asc' }, { createdAt: 'desc' }],
  });

  const titleConfig: TitleFormatConfig = titleConfigStr
    ? JSON.parse(titleConfigStr)
    : { components: [], useBrackets: true };

  const origin = new URL(req.url).origin;
  const appBaseUrl = configuredBaseUrl || origin;

  const m3uLines = ['#EXTM3U', '#EXT-X-VERSION:3', '#EXT-X-TARGETDURATION:10'];

  for (const stream of streams) {
    const mappedChannelName = channelMappings[stream.channel.title] || stream.channel.customName || stream.channel.title;
    const statusLabel = stream.status === 'live' ? 'LIVE 🔴' : stream.status === 'upcoming' ? 'AGENDADO' : 'GRAVADO';
    const groupTitle = stream.categoryYoutube ? categoryMappings[stream.categoryYoutube] || mappedChannelName : mappedChannelName;
    const displayTitle = generateDisplayTitle(
      stream,
      mappedChannelName,
      titleConfig,
      statusLabel,
      prefixWithStatus,
      prefixWithChannel,
    );

    const outputUrl = mode === 'direct' ? stream.watchUrl : `${appBaseUrl}/api/stream/${stream.videoId}`;

    m3uLines.push(
      `#EXTINF:-1 tvg-id="${stream.channel.id}" tvg-name="${mappedChannelName}" tvg-logo="${stream.channel.thumbnailUrl || ''}" group-title="${groupTitle}",${displayTitle}`,
    );
    m3uLines.push(outputUrl);
  }

  if (streams.length === 0 && useInvisiblePlaceholder) {
    m3uLines.push('#EXTINF:-1 tvg-id="placeholder" tvg-name="Placeholder" group-title="SYSTEM",SEM EVENTOS');
    m3uLines.push('#http://placeholder.local/stream');
  }

  const m3uContent = m3uLines.join('\n');

  return new NextResponse(m3uContent, {
    headers: {
      'Content-Type': 'application/vnd.apple.mpegurl',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
