import prisma from '@/lib/db';

export async function getAllUserAgents() {
  return prisma.userAgent.findMany({ orderBy: { name: 'asc' } });
}

export async function getUserAgentById(id: string) {
  return prisma.userAgent.findUnique({ where: { id } });
}

export async function setActiveUserAgent(id: string) {
  await prisma.config.upsert({
    where: { key: 'ACTIVE_USER_AGENT_ID' },
    update: { value: id },
    create: {
      key: 'ACTIVE_USER_AGENT_ID',
      value: id,
      type: 'string',
      category: 'Streaming',
      description: 'ID do user-agent ativo para streaming'
    }
  });
}

export async function getActiveUserAgent() {
  const config = await prisma.config.findUnique({ where: { key: 'ACTIVE_USER_AGENT_ID' } });
  if (!config) return null;
  return getUserAgentById(config.value);
}
