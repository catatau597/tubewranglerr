import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

interface EventsPageProps {
  searchParams?: Promise<{
    page?: string;
    status?: string;
    channelId?: string;
  }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = (await searchParams) || {};
  const page = Math.max(1, Number(params.page || '1'));
  const status = params.status || 'all';
  const channelId = params.channelId || 'all';

  const where = {
    ...(status !== 'all' ? { status } : {}),
    ...(channelId !== 'all' ? { channelId } : {}),
  };

  const [streams, total, channels] = await Promise.all([
    prisma.stream.findMany({
      where,
      include: { channel: true },
      orderBy: [
        { scheduledStart: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.stream.count({ where }),
    prisma.channel.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildHref = (newPage: number) => {
    const qp = new URLSearchParams();
    qp.set('page', String(newPage));
    if (status !== 'all') qp.set('status', status);
    if (channelId !== 'all') qp.set('channelId', channelId);
    return `/events?${qp.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Eventos</h1>
        <div className="text-sm text-muted-foreground">{total} eventos</div>
      </div>

      <form className="flex gap-3 flex-wrap" action="/events" method="get">
        <select name="status" defaultValue={status} className="h-9 rounded-md border px-3 text-sm">
          <option value="all">Todos os status</option>
          <option value="live">Live</option>
          <option value="upcoming">Upcoming</option>
          <option value="none">VOD/Ended</option>
        </select>

        <select name="channelId" defaultValue={channelId} className="h-9 rounded-md border px-3 text-sm">
          <option value="all">Todos os canais</option>
          {channels.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>

        <button type="submit" className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Filtrar</button>
      </form>

      <div className="rounded-md border bg-card overflow-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="text-left p-3">Canal</th>
              <th className="text-left p-3">Evento</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Início</th>
              <th className="text-left p-3">Link</th>
            </tr>
          </thead>
          <tbody>
            {streams.length === 0 ? (
              <tr>
                <td className="p-4 text-muted-foreground" colSpan={5}>Nenhum evento encontrado para os filtros atuais.</td>
              </tr>
            ) : streams.map((stream) => (
              <tr key={stream.videoId} className="border-b last:border-b-0">
                <td className="p-3">{stream.channel.title}</td>
                <td className="p-3">{stream.title}</td>
                <td className="p-3">{stream.status}</td>
                <td className="p-3">{(stream.actualStart || stream.scheduledStart || stream.createdAt).toLocaleString('pt-BR')}</td>
                <td className="p-3">
                  <a href={stream.watchUrl} className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">YouTube</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <a
          href={buildHref(Math.max(1, page - 1))}
          className={`rounded-md border px-3 py-1 text-sm ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
        >
          Anterior
        </a>
        <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
        <a
          href={buildHref(Math.min(totalPages, page + 1))}
          className={`rounded-md border px-3 py-1 text-sm ${page >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
        >
          Próxima
        </a>
      </div>
    </div>
  );
}
