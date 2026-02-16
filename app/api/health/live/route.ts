import { NextResponse } from 'next/server';
import { getRequestId, logEvent } from '@/lib/observability';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const requestId = getRequestId(req);
  await logEvent('INFO', 'Health', 'Liveness probe OK', { requestId });

  return NextResponse.json(
    {
      status: 'ok',
      probe: 'live',
      timestamp: new Date().toISOString(),
      requestId,
    },
    { headers: { 'x-request-id': requestId } }
  );
}
