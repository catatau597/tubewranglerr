import prisma from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Retorna todas as configurações
export async function GET() {
  try {
    const configs = await prisma.config.findMany({
      orderBy: { category: 'asc' },
      where: {
        key: {
          notIn: ['TARGET_CHANNEL_HANDLES', 'TARGET_CHANNEL_IDS']
        }
      }
    });
    return NextResponse.json(configs);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json({ error: 'Erro interno ao buscar configurações' }, { status: 500 });
  }
}

// PUT: Atualiza uma configuração específica
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Campos key e value são obrigatórios' }, { status: 400 });
    }

    const updatedConfig = await prisma.config.update({
      where: { key },
      data: { value: String(value) }
    });

    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    return NextResponse.json({ error: 'Erro interno ao atualizar configuração' }, { status: 500 });
  }
}
