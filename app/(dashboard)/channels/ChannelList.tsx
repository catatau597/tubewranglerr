'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Trash2, Youtube } from 'lucide-react';

interface Channel {
  id: string;
  title: string | null;
  handle: string | null;
  isActive: boolean;
}

export default function ChannelList({ initialChannels }: { initialChannels: Channel[] }) {
  const router = useRouter();
  const [channels, setChannels] = useState(initialChannels);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ identifier: '' }); // Pode ser ID ou Handle

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Detecção simples: se começa com @ é handle, senão assumimos ID
      const isHandle = formData.identifier.startsWith('@');
      const payload = isHandle 
        ? { handle: formData.identifier } 
        : { id: formData.identifier };

      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao adicionar');

      router.refresh();
      setShowForm(false);
      setFormData({ identifier: '' });
      window.location.reload(); 
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este canal?')) return;

    try {
      await fetch(`/api/channels/${id}`, { method: 'DELETE' });
      setChannels(channels.filter(c => c.id !== id));
      router.refresh();
    } catch (error) {
      alert('Erro ao remover canal.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Gerenciar Canais</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          <Plus className="h-4 w-4" />
          Adicionar Canal
        </button>
      </div>

      {showForm && (
        <div className="rounded-md border bg-card p-4 shadow-sm animate-in slide-in-from-top-2">
          <form onSubmit={handleAddChannel} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">ID do Canal ou @Handle</label>
              <input
                required
                placeholder="Ex: @cazetv ou UC..."
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={formData.identifier}
                onChange={(e) => setFormData({ identifier: e.target.value })}
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
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Canal</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">ID / Handle</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {channels.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    Nenhum canal cadastrado. Adicione um canal para começar a monitorar.
                  </td>
                </tr>
              ) : (
                channels.map((channel) => (
                  <tr key={channel.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle font-medium">
                      <div className="flex items-center gap-2">
                        <Youtube className="h-5 w-5 text-red-600" />
                        {channel.title || 'Carregando...'}
                      </div>
                    </td>
                    <td className="p-4 align-middle font-mono text-xs">
                      <div>{channel.id}</div>
                      {channel.handle && <div className="text-muted-foreground">{channel.handle}</div>}
                    </td>
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${channel.isActive ? 'border-transparent bg-green-500/10 text-green-500' : 'border-transparent bg-gray-500/10 text-gray-500'}`}>
                        {channel.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <button 
                        onClick={() => handleDelete(channel.id)}
                        className="text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
