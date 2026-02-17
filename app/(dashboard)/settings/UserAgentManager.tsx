"use client";
import { useEffect, useState } from 'react';

export default function UserAgentManager({ onChange, activeId }: { onChange: (id: string) => void, activeId?: string }) {
  const [agents, setAgents] = useState<{ id: string, name: string, value: string }[]>([]);
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  async function fetchAgents() {
    const res = await fetch('/api/user-agent');
    setAgents(await res.json());
  }

  async function handleSave() {
    setLoading(true);
    if (editing) {
      await fetch(`/api/user-agent/${editing}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, value })
      });
    } else {
      await fetch('/api/user-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, value })
      });
    }
    setName(''); setValue(''); setEditing(null); setLoading(false);
    fetchAgents();
  }

  async function handleDelete(id: string) {
    setLoading(true);
    await fetch(`/api/user-agent/${id}`, { method: 'DELETE' });
    setLoading(false);
    fetchAgents();
  }

  function startEdit(agent: { id: string, name: string, value: string }) {
    setEditing(agent.id);
    setName(agent.name);
    setValue(agent.value);
  }

  return (
    <div className="flex flex-col gap-2 p-2 bg-gray-50 rounded-md border border-gray-200 max-w-2xl">
      <div className="flex gap-2 items-center">
        <input className="border rounded px-2 py-1 text-sm w-40" placeholder="Nome" value={name} onChange={e => setName(e.target.value)} />
        <input className="border rounded px-2 py-1 text-sm flex-1" placeholder="User-Agent" value={value} onChange={e => setValue(e.target.value)} />
        <button className="bg-blue-600 text-white rounded px-3 py-1 text-sm" onClick={handleSave} disabled={loading || !name || !value}>{editing ? 'Salvar' : 'Adicionar'}</button>
        {editing && <button className="text-xs text-gray-500 ml-2" onClick={() => { setEditing(null); setName(''); setValue(''); }}>Cancelar</button>}
      </div>
      <div className="flex gap-2 items-center mt-2">
        <select className="border rounded px-2 py-1 text-sm w-60" value={activeId || ''} onChange={e => onChange(e.target.value)}>
          <option value="">Selecione um user-agent...</option>
          {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <span className="text-xs text-gray-500">ou escolha um já cadastrado</span>
      </div>
      <div className="flex flex-col gap-1 mt-2">
        {agents.map(a => (
          <div key={a.id} className="flex gap-2 items-center text-xs bg-white border rounded px-2 py-1">
            <span className="font-bold">{a.name}</span>
            <span className="truncate flex-1">{a.value}</span>
            <button className="text-blue-600" onClick={() => startEdit(a)}>Editar</button>
            <button className="text-red-600" onClick={() => handleDelete(a.id)}>Excluir</button>
          </div>
        ))}
      </div>
    </div>
  );
}
