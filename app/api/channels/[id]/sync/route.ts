import { NextResponse } from 'next/server';
import { syncStreamsForChannel } from '@/lib/services/youtube';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
      { status: 500 }
    );
  }
}
