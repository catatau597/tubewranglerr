import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getConfigs() {
  return await prisma.config.findMany({
    orderBy: { category: 'asc' }
  });
}

export default async function SettingsPage() {
  const configs = await getConfigs();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Configurações do Sistema</h1>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Salvar
        </button>
      </div>

      <div className="grid gap-6">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="text-lg font-semibold leading-none tracking-tight mb-4">Parâmetros de Execução</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Aqui você pode ajustar o comportamento do agendador e limites da API.
          </p>
          
          <div className="space-y-4">
            {configs.length === 0 ? (
              <p className="text-sm text-yellow-600">Nenhuma configuração encontrada no banco de dados. Execute o seed se necessário.</p>
            ) : (
              configs.map((config) => (
                <div key={config.key} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {config.key}
                    </label>
                    <p className="text-[0.8rem] text-muted-foreground mt-1">
                      {config.description || 'Sem descrição'}
                    </p>
                  </div>
                  <div>
                    <input
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      defaultValue={config.value}
                    />
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
