import prisma from '@/lib/db';

export async function getConfig(key: string, defaultValue: string = ''): Promise<string> {
  const config = await prisma.config.findUnique({
    where: { key },
  });
  return config?.value ?? defaultValue;
}

export async function getListConfig(key: string): Promise<string[]> {
  const val = await getConfig(key);
  return val.split(',').map(s => s.trim()).filter(Boolean);
}

export async function getIntConfig(key: string, defaultValue: number = 0): Promise<number> {
  const val = await getConfig(key);
  const num = parseInt(val, 10);
  return isNaN(num) ? defaultValue : num;
}

export async function getBoolConfig(key: string, defaultValue: boolean = false): Promise<boolean> {
  const val = await getConfig(key);
  if (!val) return defaultValue;
  return val.toLowerCase() === 'true';
}

export async function setConfig(key: string, value: string) {
  await prisma.config.update({
    where: { key },
    data: { value },
  });
}
