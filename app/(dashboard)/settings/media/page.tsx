import prisma from '@/lib/db';
import ConfigList from '../ConfigList';

export const dynamic = 'force-dynamic';

async function getConfigs() {
  // Busca apenas configs da categoria 'Mídia & Placeholders'
  return await prisma.config.findMany({ where: { category: 'Mídia & Placeholders' } });
}

export default async function MediaSettingsPage() {
  const configs = await getConfigs();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Mídia & Placeholders</h1>
      </div>
      <div className="grid gap-6">
        <ConfigList initialConfigs={configs} />
      </div>
    </div>
  );
}
