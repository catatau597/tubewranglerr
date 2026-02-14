import prisma from '@/lib/db';
import ChannelList from './ChannelList';

export const dynamic = 'force-dynamic';

async function getChannels() {
  return await prisma.channel.findMany({
    orderBy: { title: 'asc' }
  });
}

export default async function ChannelsPage() {
  const channels = await getChannels();
  return <ChannelList initialChannels={channels} />;
}
