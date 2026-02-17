import prisma from '@/lib/db';
import ConfigList from './ConfigList';
import CookiesUpload from './CookiesUpload';
import UserAgentSection from './UserAgentSection';

export const dynamic = 'force-dynamic';

async function getConfigs() {
  // Busca todas as configurações para a página principal
  return await prisma.config.findMany();
}

export default async function SettingsPage() {
  const configs = await getConfigs();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Todas as Configurações</h1>
      </div>
      <CookiesUpload />
      <UserAgentSection />
      <div className="grid gap-6">
        <ConfigList initialConfigs={configs} />
      </div>
    </div>
  );
}
