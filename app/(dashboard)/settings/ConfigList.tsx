'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { TagInput } from '@/components/ui/TagInput';

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

  const handleSave = async (key: string, value: string | string[]) => {
    setLoading(key);
    
    // Se for um array (do TagInput), transforma em string
    const valueToSave = Array.isArray(value) ? value.join(',') : value;

    const promise = fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: valueToSave }),
    });

    toast.promise(promise, {
        loading: `Salvando ${key}...`,
        success: () => {
            router.refresh();
            // Atualiza o estado local para refletir a mudança
            setConfigs(configs.map(c => c.key === key ? {...c, value: valueToSave} : c));
            return 'Configuração salva!';
        },
        error: 'Erro ao salvar configuração.'
    });

    try {
        await promise;
    } catch (e) {
        // o toast já trata o erro
    } finally {
        setLoading(null);
    }
  };

  const renderInput = (config: ConfigItem) => {
    if (config.key === 'YOUTUBE_API_KEY' || config.key === 'TITLE_FILTER_EXPRESSIONS' || config.key === 'ALLOWED_CATEGORY_IDS') {
      return (
        <TagInput
          initialTags={config.value ? config.value.split(',').filter(Boolean) : []}
          onTagsChange={(tags) => handleSave(config.key, tags)}
          disabled={loading === config.key}
        />
      );
    }
    
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

  // Não agrupar mais por categoria, pois cada página terá suas configs
  const filteredConfigs = configs.filter(
    (config) =>
      config.key !== 'TARGET_CHANNEL_HANDLES' &&
      config.key !== 'TARGET_CHANNEL_IDS'
  );

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
      <div className="space-y-4">
        {filteredConfigs.map((config) => (
          <div key={config.key} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start border-b pb-4 last:border-0 last:pb-0">
            <div>
              <p className="text-sm font-medium leading-none mb-1">
                {config.description || config.key}
              </p>
              <code className="text-[0.75rem] text-muted-foreground bg-muted/50 px-1 py-0.5 rounded font-mono">
                {config.key}
              </code>
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
  );
}