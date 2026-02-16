import { NextResponse } from 'next/server';
import { syncChannels, syncStreams } from '@/lib/services/youtube';
import { assertAdminToken, assertRateLimit, toHttpErrorStatus } from '@/lib/security';

export const dynamic = 'force-dynamic';

// POST: Dispara a execução manual do cron de sincronização
export async function POST(req: Request) {
  try {
    assertAdminToken(req);
    assertRateLimit('cron-run', 10, 60_000);

    console.log("Iniciando sincronização manual de canais e streams...");

    // Executa as mesmas funções que o cron agendado
    await syncChannels();
    await syncStreams();

    console.log("Sincronização manual concluída com sucesso.");

    return NextResponse.json({ message: 'Sincronização global iniciada e concluída com sucesso.' });

  } catch (error) {
    console.error('Erro ao executar a sincronização manual:', error);
    return NextResponse.json({ error: 'Erro ao executar a sincronização global.' }, { status: toHttpErrorStatus(error) });
  }
}
