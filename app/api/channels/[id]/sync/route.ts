import { NextResponse } from 'next/server';
import { syncStreamsForChannel } from '@/lib/services/youtube';
import { assertAdminToken, assertRateLimit, toHttpErrorStatus } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertAdminToken(request);
    assertRateLimit('channels-sync', 40, 60_000);

    const { id: channelId } = await params;

    if (!channelId) {
      return NextResponse.json({ success: false, error: 'ID do canal obrigatório.' }, { status: 400 });
    }

    const result = await syncStreamsForChannel(channelId);

    return NextResponse.json({
      success: true,
      message: 'Sincronização do canal concluída com sucesso.',
      newStreams: result.newCount,
      updatedStreams: result.updatedCount,
    });
  } catch (error) {
    console.error('Erro ao sincronizar canal:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao sincronizar canal.' },
      { status: toHttpErrorStatus(error) }
    );
  }
}
