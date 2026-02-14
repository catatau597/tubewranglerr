import prisma from '@/lib/db';
import { Badge } from 'lucide-react';
import Image from 'next/image';

async function getStats() {
  const channelCount = await prisma.channel.count({ where: { isActive: true } });
  const liveCount = await prisma.stream.count({ where: { status: 'live' } });
  const upcomingCount = await prisma.stream.count({ where: { status: 'upcoming' } });
  
  // Get latest streams
  const latestStreams = await prisma.stream.findMany({
    take: 10,
    orderBy: { lastSeen: 'desc' },
    include: { channel: true }
  });

  return { channelCount, liveCount, upcomingCount, latestStreams };
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Canais Monitorados</h3>
          </div>
          <div className="text-2xl font-bold">{stats.channelCount}</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-red-500">Live Agora</h3>
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.liveCount}</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-blue-500">Agendados</h3>
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.upcomingCount}</div>
        </div>
      </div>

      {/* Latest Streams List */}
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="font-semibold leading-none tracking-tight">Últimos Streams Detectados</h3>
        </div>
        <div className="p-6 pt-0">
          <div className="space-y-4">
            {stats.latestStreams.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum stream encontrado ainda.</p>
            ) : (
              stats.latestStreams.map((stream) => (
                <div key={stream.videoId} className="flex items-center border-b pb-4 last:border-0 last:pb-0">
                  <div className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded-md border">
                    {stream.thumbnailUrl ? (
                      <Image
                        src={stream.thumbnailUrl}
                        alt={stream.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-200" />
                    )}
                  </div>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none line-clamp-1">{stream.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {stream.channel.title} •{' '}
                      <span className={
                        stream.status === 'live' ? 'text-red-500 font-bold' : 
                        stream.status === 'upcoming' ? 'text-blue-500' : 'text-gray-500'
                      }>
                        {stream.status.toUpperCase()}
                      </span>
                    </p>
                  </div>
                  <div className="ml-auto font-medium text-xs text-muted-foreground">
                    {stream.scheduledStart ? new Date(stream.scheduledStart).toLocaleString() : ''}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
