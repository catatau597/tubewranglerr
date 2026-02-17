import { NextResponse } from 'next/server';
import { getBoolConfig, setConfig } from '@/lib/config';
import { assertAdminToken, assertRateLimit, toHttpErrorStatus } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    assertAdminToken(req);
    assertRateLimit('scheduler-toggle', 20, 60_000);
    // 1. Pega o estado atual
    const isCurrentlyPaused = await getBoolConfig('SCHEDULER_PAUSED', false);
    
    // 2. Inverte o estado
    const newPausedState = !isCurrentlyPaused;

    // 3. Salva o novo estado
    await setConfig('SCHEDULER_PAUSED', newPausedState.toString());

    return NextResponse.json({
      message: `Agendador ${newPausedState ? 'pausado' : 'retomado'} com sucesso.`,
      isPaused: newPausedState,
    });
  } catch (error) {
    console.error('Erro ao alternar o estado do agendador:', error);
    return NextResponse.json({ error: 'Erro ao alternar o estado do agendador.' }, { status: toHttpErrorStatus(error) });
  }
}

// GET para consultar o estado atual
export async function GET() {
    try {
        const isPaused = await getBoolConfig('SCHEDULER_PAUSED', false);
        return NextResponse.json({ isPaused });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao consultar o estado do agendador.' }, { status: 500 });
    }
}
