import { getActiveUserAgent, setActiveUserAgent } from '@/lib/userAgent';
import UserAgentManager from './UserAgentManager';

export default async function UserAgentSection() {
  const active = await getActiveUserAgent();
  return (
    <div className="my-4">
      <label className="font-semibold mb-2 block">User-Agent global</label>
      <UserAgentManager activeId={active?.id} onChange={async (id) => { await setActiveUserAgent(id); }} />
    </div>
  );
}
