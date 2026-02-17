import prisma from '@/lib/db';
import ConfigList from '../ConfigList';
import dynamic from 'next/dynamic';
const ApiSettingsClientBlocks = dynamic(() => import('./ApiSettingsClientBlocks'), { ssr: false });

export const forceDynamic = 'force-dynamic';

async function getConfigs() {
  // Busca apenas configs da categoria 'API & Canais'
  return await prisma.config.findMany({ where: { category: 'API & Canais' } });
}

export default async function ApiSettingsPage() {
  const configs = await getConfigs();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">API & Canais</h1>
      </div>
      <ApiSettingsClientBlocks />
      <div className="grid gap-6">
        <ConfigList initialConfigs={configs} />
      </div>
    </div>
  );
}
