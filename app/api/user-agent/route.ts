import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  const agents = await prisma.userAgent.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(agents);
}

export async function POST(request: NextRequest) {
  const { name, value } = await request.json();
  if (!name || !value) return NextResponse.json({ error: 'Nome e valor obrigatórios.' }, { status: 400 });
  const agent = await prisma.userAgent.create({ data: { name, value } });
  return NextResponse.json(agent);
}
