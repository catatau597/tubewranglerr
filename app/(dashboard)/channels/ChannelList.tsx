'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Youtube, RefreshCw, Snowflake, Sun, Play, Pause } from 'lucide-react';

interface Channel {
  id: string;
  title: string | null;
  handle: string | null;
  isActive: boolean;
  liveCount: number;
  upcomingCount: number;
  vodCount: number;
}

export default function ChannelList({ initialChannels }: { initialChannels: Channel[] }) {
  const router = useRouter();
  const [channels, setChannels] = useState(initialChannels);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newChannel, setNewChannel] = useState('');
  const [isSchedulerPaused, setIsSchedulerPaused] = useState(false);
  const [globalSyncLoading, setGlobalSyncLoading] = useState(false);

  useEffect(() => {
    fetch('/api/scheduler/toggle')
      .then(res => res.json())
      .then(data => setIsSchedulerPaused(data.isPaused));
  }, []);

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannel.trim()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handleOrId: newChannel }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro desconhecido ao adicionar canal.');
      }
      
      toast.success(`Canal "${data.title}" adicionado com sucesso!`);
      setShowForm(false);
      setNewChannel('');
      router.refresh(); 
      // O router.refresh() deve ser suficiente para atualizar a lista
      // Adicionando o novo canal ao estado local para uma UI mais rápida
      setChannels(prev => [...prev, data]);

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este canal?')) return;

    try {
      const res = await fetch(`/api/channels/${id}`, { method: 'DELETE' });
       if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao remover canal.');
      }
      
      toast.success('Canal removido com sucesso.');
      setChannels(channels.filter(c => c.id !== id));
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };
  
  const handleToggleActive = async (id: string, currentState: boolean) => {
    // Optimistic UI update
    const originalChannels = [...channels];
    setChannels(channels.map(c => c.id === id ? { ...c, isActive: !currentState } : c));

    try {
      const res = await fetch(`/api/channels/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentState }),
      });

      if (!res.ok) {
        throw new Error('Falha ao atualizar o status do canal.');
      }
      
      const data = await res.json();
      toast.success(`Canal "${data.title}" foi ${data.isActive ? 'ativado' : 'congelado'}.`);
      router.refresh(); // Revalida os dados do servidor

    } catch (error: any) {
      // Revert on error
      setChannels(originalChannels);
      toast.error(error.message);
    }
  };

  const handleRefresh = async (id: string) => {
    const promise = fetch(`/api/channels/${id}/sync`, { method: 'POST' });
    
    toast.promise(promise, {
      loading: 'Sincronizando canal...',
      success: (data: any) => { // 'data' aqui é a Response, não o JSON direto
        return data.json().then((json: any) => {
          router.refresh(); // Atualiza a contagem de eventos
          return `Sincronização concluída! ${json.newStreams || 0} novos, ${json.updatedStreams || 0} atualizados.`;
        });
      },
      error: 'Falha ao sincronizar o canal.',
    });
  };

  const handleRunGlobalSync = () => {
    setGlobalSyncLoading(true);
    const promise = fetch('/api/cron/run', { method: 'POST' });
    toast.promise(promise, {
      loading: 'Iniciando sincronização global...',
      success: (data) => {
        router.refresh();
        return 'Sincronização global concluída!';
      },
      error: 'Falha na sincronização global.',
      finally: () => setGlobalSyncLoading(false),
    });
  };
  
  const handleToggleScheduler = () => {
    const promise = fetch('/api/scheduler/toggle', { method: 'POST' });
    toast.promise(promise, {
      loading: isSchedulerPaused ? 'Retomando...' : 'Pausando...',
      success: (data: any) => data.json().then((json: any) => {
        setIsSchedulerPaused(json.isPaused);
        return json.message;
      }),
      error: 'Falha ao alterar estado.',
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Gerenciar Canais</h1>
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={handleRunGlobalSync}
            disabled={globalSyncLoading}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {globalSyncLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sincronizar Tudo
          </button>
           <button 
            onClick={handleToggleScheduler}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white ${isSchedulerPaused ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
          >
            {isSchedulerPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {isSchedulerPaused ? 'Retomar' : 'Pausar'} Agendador
          </button>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            <Plus className="h-4 w-4" />
            Adicionar Canal
          </button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-md border bg-card p-4 shadow-sm animate-in slide-in-from-top-2">
          <form onSubmit={handleAddChannel} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">ID do Canal ou @Handle do YouTube</label>
              <input
                required
                placeholder="Ex: @cazetv ou UC_1z... (será validado online)"
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={newChannel}
                onChange={(e) => setNewChannel(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
            </button>
          </form>
        </div>
      )}

      <div className="rounded-md border bg-card">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[40%]">Canal</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">ID / Handle</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Eventos</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {channels.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Nenhum canal cadastrado. Adicione um para começar.
                  </td>
                </tr>
              ) : (
                channels.map((channel) => (
                  <tr key={channel.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle font-medium">
                      <div className="flex items-center gap-3">
                        <Youtube className="h-5 w-5 text-red-600 flex-shrink-0" />
                        <span className="font-semibold">{channel.title || 'Carregando...'}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle font-mono text-xs">
                      <div className="text-muted-foreground">{channel.handle || 'N/A'}</div>
                      <div>{channel.id}</div>
                    </td>
                    <td className="p-4 align-middle text-xs">
                      <div className='flex flex-wrap gap-x-2 gap-y-1 items-center text-muted-foreground'>
                        <div title="Ao Vivo"><span className='font-bold text-green-500'>{channel.liveCount}</span> Live</div>
                        <div title="Agendados"><span className='font-bold text-yellow-500'>{channel.upcomingCount}</span> Upcoming</div>
                        <div title="Gravados"><span className='font-bold text-gray-400'>{channel.vodCount}</span> VOD</div>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${channel.isActive ? 'border-transparent bg-green-500/10 text-green-500' : 'border-transparent bg-blue-500/10 text-blue-500'}`}>
                        {channel.isActive ? 'Ativo' : 'Congelado'}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-right">
                       <div className='flex justify-end gap-2'>
                         <button onClick={() => handleRefresh(channel.id)} className="text-muted-foreground hover:text-primary transition-colors p-1" title="Forçar Sincronização"><RefreshCw className="h-4 w-4" /></button>
                         <button onClick={() => handleToggleActive(channel.id, channel.isActive)} className="text-muted-foreground hover:text-blue-500 transition-colors p-1" title={channel.isActive ? 'Congelar Canal' : 'Ativar Canal'}>{channel.isActive ? <Snowflake className="h-4 w-4" /> : <Sun className="h-4 w-4" />}</button>
                         <button onClick={() => handleDelete(channel.id)} className="text-muted-foreground hover:text-red-500 transition-colors p-1" title="Remover Canal"><Trash2 className="h-4 w-4" /></button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
