import { google } from 'googleapis';
import prisma from '@/lib/db';
import { getConfig, getListConfig, getIntConfig, getBoolConfig } from '@/lib/config';
import { addHours, isAfter, isBefore } from 'date-fns';

const youtube = google.youtube('v3');

async function getApiKey() {
  const apiKey = await getConfig('YOUTUBE_API_KEY');
  if (!apiKey) throw new Error('YOUTUBE_API_KEY not found in configuration');
  return apiKey;
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

  for (const handle of handles) {
    const existing = await prisma.channel.findFirst({ where: { handle } });
    if (existing) {
      resolvedIds.add(existing.id);
      continue;
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

        // Logic to determine status
        let finalStatus = liveStatus;
        if (liveStatus === 'live' && actualStart && !actualEnd) {
             finalStatus = 'live';
        } else if (liveStatus === 'upcoming') {
             finalStatus = 'upcoming';
        } else {
             finalStatus = 'none'; // VOD or Ended
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
}
