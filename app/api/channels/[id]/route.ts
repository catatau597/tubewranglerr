import prisma from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'O campo "isActive" é obrigatório.' }, { status: 400 });
    }

    const updatedChannel = await prisma.channel.update({
      where: { id: params.id },
      data: { isActive },
    });

    return NextResponse.json(updatedChannel);
  } catch (error) {
    console.error('Erro ao atualizar canal:', error);
    return NextResponse.json({ error: 'Erro ao atualizar canal' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID do canal obrigatório' }, { status: 400 });
    }

    await prisma.channel.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar canal:', error);
    return NextResponse.json({ error: 'Erro ao remover canal' }, { status: 500 });
  }
}
