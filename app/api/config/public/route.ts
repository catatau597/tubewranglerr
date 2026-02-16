import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

const PUBLIC_CONFIG_KEYS = [
  'TUBEWRANGLERR_URL',
  'PLAYLIST_LIVE_FILENAME',
  'PLAYLIST_UPCOMING_FILENAME',
  'PLAYLIST_VOD_FILENAME',
  'XMLTV_FILENAME',
] as const;

export async function GET() {
  try {
    const configs = await prisma.config.findMany({
      where: { key: { in: [...PUBLIC_CONFIG_KEYS] } },
    });

    const response = Object.fromEntries(configs.map((c) => [c.key, c.value]));
    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro ao buscar configurações públicas:', error);
    return NextResponse.json({ error: 'Erro ao buscar configurações públicas.' }, { status: 500 });
  }
}
