'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';

interface ConfigItem {
  key: string;
  value: string;
  type: string;
  category: string;
  description: string | null;
}

export default function ConfigList({ initialConfigs }: { initialConfigs: ConfigItem[] }) {
  const router = useRouter();
  const [configs, setConfigs] = useState(initialConfigs);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSave = async (key: string, value: string) => {
    setLoading(key);
    setMessage(null);

    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });

      if (!res.ok) throw new Error('Falha ao salvar');

      setMessage({ text: 'Configuração salva com sucesso!', type: 'success' });
      router.refresh();
    } catch (error) {
      setMessage({ text: 'Erro ao salvar configuração.', type: 'error' });
    } finally {
      setLoading(null);
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const renderInput = (config: ConfigItem) => {
    switch (config.type) {
      case 'bool':
        return (
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            defaultValue={config.value}
            onChange={(e) => handleSave(config.key, e.target.value)}
            disabled={loading === config.key}
          >
            <option value="true">Ativado (True)</option>
            <option value="false">Desativado (False)</option>
          </select>
        );
      case 'int':
        return (
          <div className="flex gap-2">
            <input
              type="number"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              defaultValue={config.value}
              onBlur={(e) => {
                if (e.target.value !== config.value) handleSave(config.key, e.target.value);
              }}
              disabled={loading === config.key}
            />
          </div>
        );
      default:
        return (
          <div className="flex gap-2">
            <input
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              defaultValue={config.value}
              onBlur={(e) => {
                if (e.target.value !== config.value) handleSave(config.key, e.target.value);
              }}
              disabled={loading === config.key}
            />
          </div>
        );
    }
  };

  // Group configs by category
  const groupedConfigs = configs.reduce((acc, config) => {
    const cat = config.category || 'Geral';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(config);
    return acc;
  }, {} as Record<string, ConfigItem[]>);

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {Object.entries(groupedConfigs).map(([category, items]) => (
        <div key={category} className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="text-lg font-semibold leading-none tracking-tight mb-4">
            Categoria {category}
          </h3>
          
          <div className="space-y-4">
            {items.map((config) => (
              <div key={config.key} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center border-b pb-4 last:border-0 last:pb-0">
                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {config.key}
                  </label>
                  <p className="text-[0.8rem] text-muted-foreground mt-1">
                    {config.description || 'Sem descrição'}
                  </p>
                </div>
                <div className="relative">
                  {renderInput(config)}
                  {loading === config.key && (
                    <div className="absolute right-2 top-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
