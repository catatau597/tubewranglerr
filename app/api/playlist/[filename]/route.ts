import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getBoolConfig, getConfig } from '@/lib/config';
import { TitleComponent } from '@/app/(dashboard)/settings/title-format/page';
import { logEvent } from '@/lib/observability';

// Interfaces
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

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/,/g, '\\,');
}

function normalizeListValue(value: string, uppercase: boolean): string {
  return uppercase ? value.toUpperCase() : value;
}

function appendSuffix(filename: string, suffix: 'direct' | 'proxy') {
  // Sempre força .m3u
  if (filename.endsWith('.m3u')) {
    return filename.replace('.m3u', `_${suffix}.m3u`);
  }
  return `${filename}_${suffix}.m3u`;
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

  // Permitir apenas padrões playlist_<tipo>_<modo>.m3u e epg.xml
  const isPlaylist = /^playlist_(live|vod|upcoming)_(direct|proxy)\.m3u$/.test(filename);
  const isEpg = filename === 'epg.xml';
  if (!isPlaylist && !isEpg) {
    return NextResponse.json({ error: 'Recurso não encontrado' }, { status: 404 });
  }

  // Nomes fixos padronizados
  const liveFilename = 'playlist_live.m3u';
  const upcomingFilename = 'playlist_upcoming.m3u';
  const vodFilename = 'playlist_vod.m3u';
  const xmltvFilename = 'epg.xml';
  const [
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
    uppercaseGroupTitle,
    uppercaseDisplayTitle,
    tvgNameUseDisplayTitle,
    maxScheduleHours,
    maxUpcomingPerChannel,
    placeholderImageUrl,
  ] = await Promise.all([
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
    getBoolConfig('GROUP_TITLE_FORCE_UPPERCASE', false),
    getBoolConfig('DISPLAY_TITLE_FORCE_UPPERCASE', false),
    getBoolConfig('TVG_NAME_USE_DISPLAY_TITLE', false),
    getConfig('MAX_SCHEDULE_HOURS', '72'),
    getConfig('MAX_UPCOMING_PER_CHANNEL', '6'),
    getConfig('PLACEHOLDER_IMAGE_URL', ''),
  ];

  const categoryMappings = parseMappingConfig(categoryMappingsStr);
  const channelMappings = parseMappingConfig(channelMappingsStr);

  let mode: 'direct' | 'proxy' = 'proxy';
  if (filename.includes('_direct.')) mode = 'direct';

  // Só aceita .m3u
  let targetStatus: 'live' | 'upcoming' | 'none' | null = null;
  if (filename === 'playlist_live_direct.m3u' || filename === 'playlist_live_proxy.m3u') {
    targetStatus = 'live';
  } else if (filename === 'playlist_upcoming_proxy.m3u') {
    targetStatus = 'upcoming';
  } else if (filename === 'playlist_vod_direct.m3u' || filename === 'playlist_vod_proxy.m3u') {
    targetStatus = 'none';
  } else if (filename === 'epg.xml') {
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

  const isUpcomingPlaylist = targetStatus === 'upcoming';
  const upcomingHoursLimit = Number.parseInt(maxScheduleHours, 10) || 72;
  const upcomingPerChannelLimit = Number.parseInt(maxUpcomingPerChannel, 10) || 6;

  const filteredStreams = isUpcomingPlaylist
    ? (() => {
        const now = new Date();
        const futureLimit = new Date(now.getTime() + upcomingHoursLimit * 60 * 60 * 1000);
        const grouped = new Map<string, number>();

        return streams.filter((stream) => {
          if (!stream.scheduledStart) return false;
          if (stream.scheduledStart <= now || stream.scheduledStart > futureLimit) return false;

          const current = grouped.get(stream.channelId) ?? 0;
          if (current >= upcomingPerChannelLimit) return false;
          grouped.set(stream.channelId, current + 1);
          return true;
        });
      })()
    : streams;

  const titleConfig: TitleFormatConfig = titleConfigStr
    ? JSON.parse(titleConfigStr)
    : { components: [], useBrackets: true };

  const origin = new URL(req.url).origin;
  const appBaseUrl = configuredBaseUrl || origin;

  const m3uLines = ['#EXTM3U'];

  for (const stream of filteredStreams) {
    const mappedChannelName = channelMappings[stream.channel.title] || stream.channel.customName || stream.channel.title;
    const statusLabel = stream.status === 'live' ? 'LIVE 🔴' : stream.status === 'upcoming' ? 'AGENDADO' : 'GRAVADO';
    const rawGroupTitle = stream.categoryYoutube
      ? categoryMappings[stream.categoryYoutube] || mappedChannelName
      : mappedChannelName;
    const rawDisplayTitle = generateDisplayTitle(
      stream,
      mappedChannelName,
      titleConfig,
      statusLabel,
      prefixWithStatus,
      prefixWithChannel,
    );

    const groupTitle = normalizeListValue(rawGroupTitle, uppercaseGroupTitle);
    const displayTitle = normalizeListValue(rawDisplayTitle, uppercaseDisplayTitle);
    const tvgName = tvgNameUseDisplayTitle ? displayTitle : mappedChannelName;

    const outputUrl = mode === 'direct' ? stream.watchUrl : `${appBaseUrl}/api/stream/${stream.videoId}`;
    const tvgLogo = stream.thumbnailUrl || stream.channel.thumbnailUrl || placeholderImageUrl;

    await logEvent('DEBUG', 'Playlist', 'Processing stream', {
      filename,
      mode,
      videoId: stream.videoId,
      status: stream.status,
      groupTitle,
    });

    m3uLines.push(
      `#EXTINF:-1 tvg-id="${escapeAttribute(stream.channel.id)}" tvg-name="${escapeAttribute(tvgName)}" tvg-logo="${escapeAttribute(tvgLogo || '')}" group-title="${escapeAttribute(groupTitle)}",${escapeAttribute(displayTitle)}`,
    );
    m3uLines.push(outputUrl);
  }

  if (filteredStreams.length === 0 && useInvisiblePlaceholder) {
    m3uLines.push('#EXTINF:-1 tvg-id="placeholder" tvg-name="Placeholder" group-title="SYSTEM",SEM EVENTOS');
    m3uLines.push('#http://placeholder.local/stream');
  }

  const m3uContent = m3uLines.join('\n');

  // Força sempre .m3u e content-type correto
  const contentType = 'audio/x-mpegurl';
  const downloadFilename = filename.endsWith('.m3u') ? filename : `${filename}.m3u`;

  return new NextResponse(m3uContent, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${downloadFilename}"`,
    },
  });
}
