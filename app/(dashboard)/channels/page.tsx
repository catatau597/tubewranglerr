import prisma from '@/lib/db';
import ChannelList from './ChannelList';

export const dynamic = 'force-dynamic';

async function getChannels() {
  const channels = await prisma.channel.findMany({
    orderBy: { title: 'asc' },
    include: {
      streams: {
        select: {
          status: true,
        },
      },
    },
  });

  // Processar os dados para ter contagens separadas
  return channels.map(channel => {
    const liveCount = channel.streams.filter(s => s.status === 'live').length;
    const upcomingCount = channel.streams.filter(s => s.status === 'upcoming').length;
    const vodCount = channel.streams.filter(s => s.status === 'none').length;
    
    const { streams, ...channelData } = channel;
    return { ...channelData, liveCount, upcomingCount, vodCount };
  });
}

export default async function ChannelsPage() {
  const channels = await getChannels();
  return <ChannelList initialChannels={channels} />;
}
