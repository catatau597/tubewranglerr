import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { name, value } = await request.json();
  if (!name || !value) return NextResponse.json({ error: 'Nome e valor obrigatórios.' }, { status: 400 });
  const agent = await prisma.userAgent.update({ where: { id: params.id }, data: { name, value } });
  return NextResponse.json(agent);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  await prisma.userAgent.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
