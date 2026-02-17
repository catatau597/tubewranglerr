import prisma from '@/lib/db';
import { NextResponse } from 'next/server';
import { resolveChannel } from '@/lib/services/youtube';
import { assertAdminToken, assertRateLimit, toHttpErrorStatus } from '@/lib/security';

export const dynamic = 'force-dynamic';

// GET: Retorna todos os canais com contagem de streams
export async function GET() {
  try {
    const channels = await prisma.channel.findMany({
      orderBy: { title: 'asc' },
      include: {
        _count: {
          select: {
            streams: {
              where: {
                status: { in: ['live', 'upcoming'] } // Contamos apenas live e upcoming por enquanto
              }
            }
          }
        },
        streams: { // Para contagens mais detalhadas
          select: {
            status: true
          }
        }
      }
    });

    // Processar os dados para ter contagens separadas
    const channelsWithCounts = channels.map(channel => {
      const liveCount = channel.streams.filter(s => s.status === 'live').length;
      const upcomingCount = channel.streams.filter(s => s.status === 'upcoming').length;
      const vodCount = channel.streams.filter(s => s.status === 'none').length; // 'none' para VOD
      
      // Remove a relação completa de streams para não enviar dados desnecessários
      const { streams, ...channelData } = channel;

      return {
        ...channelData,
        liveCount,
        upcomingCount,
        vodCount,
      };
    });

    return NextResponse.json(channelsWithCounts);
  } catch (error) {
    console.error('Erro ao buscar canais:', error);
    return NextResponse.json({ error: 'Erro ao buscar canais' }, { status: 500 });
  }
}


// POST: Adiciona um novo canal
export async function POST(req: Request) {
  try {
    assertAdminToken(req);
    assertRateLimit('channels-post', 20, 60_000);

    const body = await req.json();
    const { handleOrId } = body;

    if (!handleOrId) {
      return NextResponse.json({ error: 'ID ou Handle é obrigatório' }, { status: 400 });
    }

    const channelData = await resolveChannel(handleOrId);

    if (!channelData) {
      return NextResponse.json({ error: 'Canal não encontrado no YouTube.' }, { status: 404 });
    }

    const newChannel = await prisma.channel.create({
      data: {
        id: channelData.id,
        handle: channelData.handle || null,
        title: channelData.title,
        thumbnailUrl: channelData.thumbnailUrl,
        isActive: true,
        lastSync: new Date()
      }
    });

    return NextResponse.json(newChannel);
  } catch (error: any) {
    console.error('Erro ao criar canal:', error);
    if (error.code === 'P2002') { // Prisma unique constraint violation
      return NextResponse.json({ error: 'Este canal já foi adicionado.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Erro interno ao adicionar canal.' }, { status: toHttpErrorStatus(error) });
  }
}

// DELETE: Remove um canal (precisa passar ID na URL, mas Next.js 13+ App Router usa route handlers dinâmicos para isso)
// Para simplificar, vou aceitar DELETE com body json aqui ou criar rota [id]/route.ts
