import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';


export async function PUT(request: NextRequest, { params }: { params: { id?: string } }) {
  const { name, value } = await request.json();
  const id = params?.id;
  if (!id) return NextResponse.json({ error: 'ID do user agent não fornecido.' }, { status: 400 });
  if (!name || !value) return NextResponse.json({ error: 'Nome e valor obrigatórios.' }, { status: 400 });
  try {
    const agent = await prisma.userAgent.update({ where: { id }, data: { name, value } });
    return NextResponse.json(agent);
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao atualizar user agent.' }, { status: 500 });
  }
}


export async function DELETE(request: NextRequest, { params }: { params: { id?: string } }) {
  const id = params?.id;
  if (!id) return NextResponse.json({ error: 'ID do user agent não fornecido.' }, { status: 400 });
  try {
    await prisma.userAgent.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao excluir user agent.' }, { status: 500 });
  }
}
