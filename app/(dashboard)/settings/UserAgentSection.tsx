
"use client";
import React from 'react';
import { useEffect, useState } from 'react';
import UserAgentManager from './UserAgentManager';

export default function UserAgentSection() {
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  useEffect(() => {
    fetch('/api/config').then(res => res.json()).then(configs => {
      const active = configs.find((c: any) => c.key === 'ACTIVE_USER_AGENT_ID');
      setActiveId(active?.value);
    });
  }, []);
  async function handleChange(id: string) {
    await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'ACTIVE_USER_AGENT_ID', value: id })
    });
    setActiveId(id);
  }
  return (
    <div className="my-4">
      <label className="font-semibold mb-2 block">User-Agent global</label>
      <UserAgentManager activeId={activeId} onChange={handleChange} />
    </div>
  );
}
