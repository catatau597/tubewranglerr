import Link from 'next/link';
import prisma from '@/lib/db';
import ConfigList from '../ConfigList';

export const dynamic = 'force-dynamic';

async function getConfigs() {
  return await prisma.config.findMany({ where: { category: 'Arquivos de Saída' } });
}

export default async function OutputSettingsPage() {
  const configs = await getConfigs();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Arquivos de Saída</h1>
      </div>

      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        A configuração avançada de <strong>formato de título</strong> está disponível em{' '}
        <Link href="/settings/title-format" className="font-medium text-primary hover:underline">
          /settings/title-format
        </Link>
        .
      </div>

      <div className="grid gap-6">
        <ConfigList initialConfigs={configs} />
      </div>
    </div>
  );
}
