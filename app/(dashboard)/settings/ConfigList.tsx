'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TagInput } from '@/components/ui/TagInput';

interface ConfigItem {
  key: string;
  value: string;
  type: string;
  category: string;
  description: string | null;
}

const TAG_KEYS = new Set([
  'YOUTUBE_API_KEY',
  'TITLE_FILTER_EXPRESSIONS',
  'ALLOWED_CATEGORY_IDS',
  'CATEGORY_MAPPINGS',
  'CHANNEL_NAME_MAPPINGS',
  'TARGET_CHANNEL_HANDLES',
  'TARGET_CHANNEL_IDS',
]);

const HIDDEN_KEYS = new Set(['TARGET_CHANNEL_HANDLES', 'TARGET_CHANNEL_IDS']);

export default function ConfigList({ initialConfigs }: { initialConfigs: ConfigItem[] }) {
  const router = useRouter();
  const [configs, setConfigs] = useState(initialConfigs);
  const [loading, setLoading] = useState<string | null>(null);

  const configMap = useMemo(() => new Map(configs.map((c) => [c.key, c.value])), [configs]);

  const handleSave = async (key: string, value: string | string[]) => {
    setLoading(key);

    const valueToSave = Array.isArray(value) ? value.join(',') : value;

    const promise = fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: valueToSave }),
    });

    toast.promise(promise, {
      loading: `Salvando ${key}...`,
      success: async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Falha ao salvar configuração.');
        }
        router.refresh();
        setConfigs((prev) => prev.map((c) => (c.key === key ? { ...c, value: valueToSave } : c)));
        return 'Configuração salva!';
      },
      error: (e) => (e instanceof Error ? e.message : 'Erro ao salvar configuração.'),
    });

    try {
      await promise;
    } finally {
      setLoading(null);
    }
  };

  const isVisibleByDependency = (config: ConfigItem) => {
    if (config.key === 'SCHEDULER_ACTIVE_START_HOUR' || config.key === 'SCHEDULER_ACTIVE_END_HOUR') {
      return (configMap.get('ENABLE_SCHEDULER_ACTIVE_HOURS') || '').toLowerCase() === 'true';
    }

    if (config.key === 'ALLOWED_CATEGORY_IDS') {
      return (configMap.get('FILTER_BY_CATEGORY') || '').toLowerCase() === 'true';
    }

    return true;
  };

  const renderInput = (config: ConfigItem) => {
    if (TAG_KEYS.has(config.key)) {
      return (
        <TagInput
          initialTags={config.value ? config.value.split(',').map((t) => t.trim()).filter(Boolean) : []}
          onTagsChange={(tags) => handleSave(config.key, tags)}
          disabled={loading === config.key}
        />
      );
    }

    switch (config.type) {
      case 'bool': {
        const current = (config.value || 'false').toLowerCase() === 'true';
        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave(config.key, (!current).toString())}
              disabled={loading === config.key}
              className={`rounded-md px-3 py-2 text-sm font-medium ${current ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'}`}
            >
              {current ? 'ATIVADO' : 'DESATIVADO'}
            </button>
          </div>
        );
      }
      case 'int':
        return (
          <input
            type="number"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            defaultValue={config.value}
            onBlur={(e) => {
              if (e.target.value !== config.value) handleSave(config.key, e.target.value);
            }}
            disabled={loading === config.key}
          />
        );
      default:
        return (
          <input
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            defaultValue={config.value}
            onBlur={(e) => {
              if (e.target.value !== config.value) handleSave(config.key, e.target.value);
            }}
            disabled={loading === config.key}
          />
        );
    }
  };

  const groupedConfigs = configs.reduce((acc, config) => {
    if (HIDDEN_KEYS.has(config.key) || !isVisibleByDependency(config)) {
      return acc;
    }

    const cat = config.category || 'Geral';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(config);
    return acc;
  }, {} as Record<string, ConfigItem[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedConfigs).map(([category, items]) => (
        <div key={category} className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="text-lg font-semibold leading-none tracking-tight mb-4">{category}</h3>

          <div className="space-y-4">
            {items.map((config) => (
              <div key={config.key} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start border-b pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium leading-none mb-1">{config.description || config.key}</p>
                  <code className="text-[0.75rem] text-muted-foreground bg-muted/50 px-1 py-0.5 rounded font-mono">{config.key}</code>
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
