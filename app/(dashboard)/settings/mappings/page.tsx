import prisma from '@/lib/db';
import ConfigList from '../ConfigList';

export const dynamic = 'force-dynamic';

async function getMappingConfigs() {
  return await prisma.config.findMany({ where: { category: 'Mapeamentos' } });
}

export default async function SettingsMappingsPage() {
  const configs = await getMappingConfigs();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Mapeamentos</h1>
      </div>

      <div className="grid gap-6">
        <ConfigList initialConfigs={configs} />
      </div>
    </div>
  );
}
