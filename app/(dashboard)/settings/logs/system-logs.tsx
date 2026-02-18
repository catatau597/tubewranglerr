import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function LogsPage() {
  const logs = await prisma.log.findMany({
    orderBy: { timestamp: 'desc' },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Logs do Sistema</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1 text-left">Data/Hora</th>
              <th className="px-2 py-1 text-left">Nível</th>
              <th className="px-2 py-1 text-left">Componente</th>
              <th className="px-2 py-1 text-left">Mensagem</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="border-b">
                <td className="px-2 py-1 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="px-2 py-1 font-bold text-xs" style={{ color: log.level === 'ERROR' ? '#dc2626' : log.level === 'WARN' ? '#f59e42' : '#2563eb' }}>{log.level}</td>
                <td className="px-2 py-1">{log.component}</td>
                <td className="px-2 py-1 font-mono break-all">{log.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
