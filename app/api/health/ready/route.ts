import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getRequestId, logEvent } from '@/lib/observability';
import { getSchedulerMetrics } from '@/lib/scheduler';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const requestId = getRequestId(req);

  try {
    await prisma.$queryRaw`SELECT 1`;
    const metrics = getSchedulerMetrics();

    await logEvent('INFO', 'Health', 'Readiness probe OK', { requestId, metrics });

    return NextResponse.json(
      {
        status: 'ok',
        probe: 'ready',
        dependencies: {
          database: 'ok',
          scheduler: metrics,
        },
        timestamp: new Date().toISOString(),
        requestId,
      },
      { headers: { 'x-request-id': requestId } }
    );
  } catch (error) {
    await logEvent('ERROR', 'Health', 'Readiness probe failed', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        status: 'error',
        probe: 'ready',
        requestId,
      },
      { status: 503, headers: { 'x-request-id': requestId } }
    );
  }
}
