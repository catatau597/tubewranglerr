import prisma from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Retorna todos os canais
export async function GET() {
  try {
    const channels = await prisma.channel.findMany({
      orderBy: { title: 'asc' }
    });
    return NextResponse.json(channels);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar canais' }, { status: 500 });
  }
}

// POST: Adiciona um novo canal
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, handle, title } = body;

    if (!id && !handle) {
      return NextResponse.json({ error: 'ID ou Handle é obrigatório' }, { status: 400 });
    }

    // Se o ID não for fornecido, usamos o handle como ID temporário até o sync resolver
    const channelId = id || handle;

    const newChannel = await prisma.channel.create({
      data: {
        id: channelId,
        handle: handle || null,
        title: title || handle || 'Novo Canal',
        isActive: true,
        lastSync: new Date()
      }
    });

    return NextResponse.json(newChannel);
  } catch (error) {
    console.error('Erro ao criar canal:', error);
    return NextResponse.json({ error: 'Erro ao adicionar canal. Verifique se já existe.' }, { status: 500 });
  }
}

// DELETE: Remove um canal (precisa passar ID na URL, mas Next.js 13+ App Router usa route handlers dinâmicos para isso)
// Para simplificar, vou aceitar DELETE com body json aqui ou criar rota [id]/route.ts
