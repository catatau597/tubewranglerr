import { google } from 'googleapis';
import prisma from '@/lib/db';
import { getConfig, getListConfig, getBoolConfig, getIntConfig } from '@/lib/config';
import { deriveFinalStatus, shouldSkipStreamUpsert } from '@/lib/services/youtube-policy';

const youtube = google.youtube('v3');

async function enforceRecordedPolicy() {
  const keepRecorded = await getBoolConfig('KEEP_RECORDED_STREAMS', true);
  const maxRecorded = await getIntConfig('MAX_RECORDED_PER_CHANNEL', 2);
  const retentionDays = await getIntConfig('RECORDED_RETENTION_DAYS', 2);

  if (!keepRecorded) {
    await prisma.stream.deleteMany({ where: { status: 'none' } });
    return;
  }

  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  await prisma.stream.deleteMany({
    where: {
      status: 'none',
      OR: [
        { actualEnd: { lt: cutoff } },
        { actualEnd: null, createdAt: { lt: cutoff } },
      ],
    },
  });

  const channels = await prisma.channel.findMany({ select: { id: true } });
  for (const channel of channels) {
    const recorded = await prisma.stream.findMany({
      where: { channelId: channel.id, status: 'none' },
      orderBy: [{ actualEnd: 'desc' }, { createdAt: 'desc' }],
      select: { videoId: true },
    });

    if (recorded.length > maxRecorded) {
      const toDelete = recorded.slice(maxRecorded).map((r) => r.videoId);
      await prisma.stream.deleteMany({ where: { videoId: { in: toDelete } } });
    }
  }
}


// Variável em memória para rastrear o índice da chave de API
let apiKeyIndex = 0;

async function getApiKey(): Promise<string> {
  const apiKeysConfig = await getConfig('YOUTUBE_API_KEY');
  if (!apiKeysConfig) throw new Error('YOUTUBE_API_KEY not found in configuration');

  const apiKeys = apiKeysConfig.split(',').filter(Boolean);
  if (apiKeys.length === 0) throw new Error('No valid YouTube API keys found.');
  
  // Lógica de Round-Robin
  const keyToUse = apiKeys[apiKeyIndex];
  apiKeyIndex = (apiKeyIndex + 1) % apiKeys.length;
  
  return keyToUse;
}

export async function syncChannels() {
  const apiKey = await getApiKey();
  const handles = await getListConfig('TARGET_CHANNEL_HANDLES');
  const manualIds = await getListConfig('TARGET_CHANNEL_IDS');
  const mappingStr = await getConfig('CHANNEL_NAME_MAPPINGS');

  // Mapeamento Nome -> Curto
  const nameMappings: Record<string, string> = {};
  if (mappingStr) {
    mappingStr.split(',').forEach(pair => {
      const [orig, short] = pair.split('|');
      if (orig && short) nameMappings[orig.trim()] = short.trim();
    });
  }

  // 1. Resolve Handles -> Channel IDs
  const resolvedIds = new Set<string>(manualIds);

  const resolveTtlHours = await getIntConfig('RESOLVE_HANDLES_TTL_HOURS', 24);

  for (const handle of handles) {
    const existing = await prisma.channel.findFirst({ where: { handle } });
    if (existing) {
      const lastSync = existing.lastSync ? existing.lastSync.getTime() : 0;
      const ttlMs = resolveTtlHours * 60 * 60 * 1000;
      if (Date.now() - lastSync <= ttlMs) {
        resolvedIds.add(existing.id);
        continue;
      }
    }

    try {
      const res = await youtube.search.list({
        key: apiKey,
        part: ['id', 'snippet'],
        q: handle,
        type: ['channel'],
        maxResults: 1
      });
      
      const item = res.data.items?.[0];
      if (item?.id?.channelId) {
        resolvedIds.add(item.id.channelId);
        await prisma.channel.upsert({
          where: { id: item.id.channelId },
          update: { handle },
          create: { id: item.id.channelId, handle, title: item.snippet?.channelTitle || handle, isActive: true }
        });
      }
    } catch (error) {
      console.error(`Error resolving handle ${handle}:`, error);
    }
  }

  // 2. Fetch Channel Details
  const allIds = Array.from(resolvedIds);
  for (let i = 0; i < allIds.length; i += 50) {
    const batch = allIds.slice(i, i + 50);
    try {
      const res = await youtube.channels.list({
        key: apiKey,
        part: ['snippet', 'contentDetails'],
        id: batch
      });

      for (const item of res.data.items || []) {
        if (!item.id || !item.snippet) continue;
        
        const title = item.snippet.title || 'Unknown';
        const customName = nameMappings[title] || null;
        
        await prisma.channel.upsert({
          where: { id: item.id },
          update: {
            title,
            customName,
            thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
            lastSync: new Date()
          },
          create: {
            id: item.id,
            title,
            customName,
            thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
            lastSync: new Date(),
            isActive: true
          }
        });
      }
    } catch (error) {
      console.error('Error fetching channel details:', error);
    }
  }
}

export async function syncStreams() {
  const apiKey = await getApiKey();
  const channels = await prisma.channel.findMany({ where: { isActive: true } });
  const initialSyncDays = await getIntConfig('INITIAL_SYNC_DAYS', 2);
  const keepRecordedStreams = await getBoolConfig('KEEP_RECORDED_STREAMS', true);
  const usePlaylistItems = await getBoolConfig('USE_PLAYLIST_ITEMS', true);
  const filterByCategory = await getBoolConfig('FILTER_BY_CATEGORY', false);
  const allowedCategories = filterByCategory ? await getListConfig('ALLOWED_CATEGORY_IDS') : [];
  
  const videoIds = new Set<string>();

  // 1. Find Video IDs
  for (const channel of channels) {
    try {
      if (usePlaylistItems) {
        // Fetch "uploads" playlist ID
        const chRes = await youtube.channels.list({
          key: apiKey,
          part: ['contentDetails'],
          id: [channel.id]
        });
        const uploadsPlaylist = chRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
        
        if (uploadsPlaylist) {
          const plRes = await youtube.playlistItems.list({
            key: apiKey,
            part: ['snippet', 'contentDetails'],
            playlistId: uploadsPlaylist,
            maxResults: 20 // Recent uploads only
          });
          
          plRes.data.items?.forEach(item => {
            const vid = item.contentDetails?.videoId;
            if (vid) videoIds.add(vid);
          });
        }
      } else {
        // Search.list (expensive but supports eventType filtering if needed)
        // Here we search for recent videos generally
        const searchRes = await youtube.search.list({
            key: apiKey,
            part: ['id'],
            channelId: channel.id,
            type: ['video'],
            order: 'date',
            maxResults: 10
        });
        searchRes.data.items?.forEach(item => {
             if (item.id?.videoId) videoIds.add(item.id.videoId);
        });
      }
    } catch (error) {
      console.error(`Error fetching streams for channel ${channel.id}:`, error);
    }
  }

  // 2. Fetch Video Details & Update DB
  const allVideoIds = Array.from(videoIds);
  for (let i = 0; i < allVideoIds.length; i += 50) {
    const batch = allVideoIds.slice(i, i + 50);
    try {
      const res = await youtube.videos.list({
        key: apiKey,
        part: ['snippet', 'liveStreamingDetails', 'contentDetails'],
        id: batch
      });

      for (const item of res.data.items || []) {
        if (!item.id || !item.snippet) continue;

        const liveStatus = item.snippet.liveBroadcastContent || 'none'; // live, upcoming, none
        const categoryId = item.snippet.categoryId;

        if (filterByCategory && categoryId && !allowedCategories.includes(categoryId)) {
          continue;
        }

        const scheduledStart = item.liveStreamingDetails?.scheduledStartTime ? new Date(item.liveStreamingDetails.scheduledStartTime) : null;
        const actualStart = item.liveStreamingDetails?.actualStartTime ? new Date(item.liveStreamingDetails.actualStartTime) : null;
        const actualEnd = item.liveStreamingDetails?.actualEndTime ? new Date(item.liveStreamingDetails.actualEndTime) : null;

        const finalStatus = deriveFinalStatus(liveStatus, actualStart, actualEnd);

        const channelLastSync = channels.find((c) => c.id === item.snippet.channelId)?.lastSync;
        const isFirstSyncForChannel = !channelLastSync;
        if (isFirstSyncForChannel && initialSyncDays > 0) {
          const publishedAt = item.snippet.publishedAt ? new Date(item.snippet.publishedAt) : null;
          const cutoff = new Date(Date.now() - initialSyncDays * 24 * 60 * 60 * 1000);
          if (publishedAt && publishedAt < cutoff) {
            continue;
          }
        }

        const existingStream = await prisma.stream.findUnique({ where: { videoId: item.id } });
        if (shouldSkipStreamUpsert(Boolean(existingStream), finalStatus, keepRecordedStreams)) {
          continue;
        }

        // Upsert Stream
        await prisma.stream.upsert({
          where: { videoId: item.id },
          update: {
            title: item.snippet.title || '',
            description: item.snippet.description || '',
            status: finalStatus,
            thumbnailUrl: item.snippet.thumbnails?.maxres?.url || item.snippet.thumbnails?.high?.url,
            watchUrl: `https://www.youtube.com/watch?v=${item.id}`,
            scheduledStart,
            actualStart,
            actualEnd,
            durationISO: item.contentDetails?.duration,
            categoryYoutube: categoryId,
            tags: JSON.stringify(item.snippet.tags || []),
            isAgeRestricted: item.contentDetails?.contentRating?.ytRating === 'ytAgeRestricted',
            lastSeen: new Date()
          },
          create: {
            videoId: item.id,
            channelId: item.snippet.channelId!,
            title: item.snippet.title || '',
            description: item.snippet.description || '',
            status: finalStatus,
            thumbnailUrl: item.snippet.thumbnails?.maxres?.url || item.snippet.thumbnails?.high?.url,
            watchUrl: `https://www.youtube.com/watch?v=${item.id}`,
            scheduledStart,
            actualStart,
            actualEnd,
            durationISO: item.contentDetails?.duration,
            categoryYoutube: categoryId,
            tags: JSON.stringify(item.snippet.tags || []),
            isAgeRestricted: item.contentDetails?.contentRating?.ytRating === 'ytAgeRestricted',
            lastSeen: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Error fetching video details:', error);
    }
  }

  await enforceRecordedPolicy();
}

export async function syncStreamsForChannel(channelId: string) {
  const apiKey = await getApiKey();
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });

  if (!channel || !channel.isActive) {
    console.warn(`Tentativa de sincronizar canal inativo ou inexistente: ${channelId}`);
    return { newCount: 0, updatedCount: 0 };
  }
  
  const usePlaylistItems = await getBoolConfig('USE_PLAYLIST_ITEMS', true);
  const keepRecordedStreams = await getBoolConfig('KEEP_RECORDED_STREAMS', true);
  const filterByCategory = await getBoolConfig('FILTER_BY_CATEGORY', false);
  const allowedCategories = filterByCategory ? await getListConfig('ALLOWED_CATEGORY_IDS') : [];
  
  const videoIds = new Set<string>();

  // 1. Find Video IDs for the specific channel
  try {
    if (usePlaylistItems) {
      const chRes = await youtube.channels.list({
        key: apiKey,
        part: ['contentDetails'],
        id: [channel.id]
      });
      const uploadsPlaylist = chRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      
      if (uploadsPlaylist) {
        const plRes = await youtube.playlistItems.list({
          key: apiKey,
          part: ['contentDetails'],
          playlistId: uploadsPlaylist,
          maxResults: 25 // Um pouco mais generoso para sync individual
        });
        plRes.data.items?.forEach(item => item.contentDetails?.videoId && videoIds.add(item.contentDetails.videoId));
      }
    } else {
      const searchRes = await youtube.search.list({
          key: apiKey,
          part: ['id'],
          channelId: channel.id,
          type: ['video'],
          order: 'date',
          maxResults: 15
      });
      searchRes.data.items?.forEach(item => item.id?.videoId && videoIds.add(item.id.videoId));
    }
  } catch (error) {
    console.error(`Erro ao buscar streams para o canal ${channel.id}:`, error);
    throw error; // Propaga o erro para a API route
  }

  // 2. Fetch Video Details & Update DB
  let newCount = 0;
  let updatedCount = 0;
  const allVideoIds = Array.from(videoIds);
  
  for (let i = 0; i < allVideoIds.length; i += 50) {
    const batch = allVideoIds.slice(i, i + 50);
    if (batch.length === 0) continue;
    
    try {
      const res = await youtube.videos.list({
        key: apiKey,
        part: ['snippet', 'liveStreamingDetails', 'contentDetails'],
        id: batch
      });

      for (const item of res.data.items || []) {
        if (!item.id || !item.snippet) continue;
        
        const liveStatus = item.snippet.liveBroadcastContent || 'none'; // live, upcoming, none
        const categoryId = item.snippet.categoryId;
        if (filterByCategory && categoryId && !allowedCategories.includes(categoryId)) continue;

        const scheduledStart = item.liveStreamingDetails?.scheduledStartTime ? new Date(item.liveStreamingDetails.scheduledStartTime) : null;
        const actualStart = item.liveStreamingDetails?.actualStartTime ? new Date(item.liveStreamingDetails.actualStartTime) : null;
        const actualEnd = item.liveStreamingDetails?.actualEndTime ? new Date(item.liveStreamingDetails.actualEndTime) : null;

        const finalStatus = deriveFinalStatus(liveStatus, actualStart, actualEnd);

        const existingStream = await prisma.stream.findUnique({ where: { videoId: item.id } });
        if (shouldSkipStreamUpsert(Boolean(existingStream), finalStatus, keepRecordedStreams)) {
          continue;
        }

        if (existingStream) {
          updatedCount++;
        } else {
          newCount++;
        }

        await prisma.stream.upsert({
          where: { videoId: item.id },
          update: {
            title: item.snippet.title || '',
            description: item.snippet.description || '',
            status: finalStatus,
            thumbnailUrl: item.snippet.thumbnails?.maxres?.url || item.snippet.thumbnails?.high?.url,
            watchUrl: `https://www.youtube.com/watch?v=${item.id}`,
            scheduledStart, actualStart, actualEnd,
            durationISO: item.contentDetails?.duration,
            categoryYoutube: categoryId,
            tags: JSON.stringify(item.snippet.tags || []),
            isAgeRestricted: item.contentDetails?.contentRating?.ytRating === 'ytAgeRestricted',
            lastSeen: new Date()
          },
          create: {
            videoId: item.id,
            channelId: item.snippet.channelId!,
            title: item.snippet.title || '',
            description: item.snippet.description || '',
            status: finalStatus,
            thumbnailUrl: item.snippet.thumbnails?.maxres?.url || item.snippet.thumbnails?.high?.url,
            watchUrl: `https://www.youtube.com/watch?v=${item.id}`,
            scheduledStart, actualStart, actualEnd,
            durationISO: item.contentDetails?.duration,
            categoryYoutube: categoryId,
            tags: JSON.stringify(item.snippet.tags || []),
            isAgeRestricted: item.contentDetails?.contentRating?.ytRating === 'ytAgeRestricted',
            lastSeen: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes dos vídeos:', error);
      // Continua para o próximo batch em caso de erro
    }
  }
  
  await prisma.channel.update({
      where: { id: channelId },
      data: { lastSync: new Date() }
  });

  await enforceRecordedPolicy();

  return { newCount, updatedCount };
}

export async function resolveChannel(handleOrId: string): Promise<{ id: string; title: string; handle?: string; thumbnailUrl?: string; } | null> {
  const apiKey = await getApiKey();
  const isHandle = handleOrId.startsWith('@');
  const query = isHandle ? handleOrId : handleOrId;

  try {
    let channelData = null;

    if (isHandle) {
      const res = await youtube.search.list({
        key: apiKey,
        part: ['id', 'snippet'],
        q: query,
        type: ['channel'],
        maxResults: 1
      });
      const item = res.data.items?.[0];
      if (item?.id?.channelId) {
        channelData = {
          id: item.id.channelId,
          title: item.snippet?.channelTitle || query,
          handle: handleOrId,
          thumbnailUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url
        };
      }
    } else {
      // Assuming it's an ID
      const res = await youtube.channels.list({
        key: apiKey,
        part: ['snippet'],
        id: [query]
      });
      const item = res.data.items?.[0];
      if (item?.id && item.snippet) {
        channelData = {
          id: item.id,
          title: item.snippet.title,
          thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url
        };
      }
    }

    return channelData;

  } catch (error) {
    console.error(`Error resolving channel ${handleOrId}:`, error);
    return null;
  }
}
