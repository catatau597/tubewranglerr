import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { routeProcess, StreamForRouting } from '@/lib/player/router';
import { PlayerHealthMonitor } from '@/lib/player/health-monitor';
import { getBoolConfig } from '@/lib/config';
import { logEvent } from '@/lib/observability';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: videoId } = await params;

  const stream = await prisma.stream.findUnique({
    where: { videoId },
    select: {
      videoId: true,
      status: true,
      watchUrl: true,
      thumbnailUrl: true,
      title: true,
      actualStart: true,
      actualEnd: true,
      scheduledStart: true,
    },
  });

  if (!stream) {
    return new NextResponse('Stream not found', { status: 404 });
  }

  const streamForRouting: StreamForRouting = {
    videoId: stream.videoId,
    status: stream.status,
    watchUrl: stream.watchUrl,
    thumbnailUrl: stream.thumbnailUrl,
    title: stream.title,
    actualStart: stream.actualStart,
    actualEnd: stream.actualEnd,
    scheduledStart: stream.scheduledStart,
  };

  const enableAnalytics = await getBoolConfig('PROXY_ENABLE_ANALYTICS', true);
  if (enableAnalytics) {
    await logEvent('INFO', 'SmartPlayer', 'Proxy access', { videoId, status: stream.status });
  }

  let child = routeProcess(streamForRouting);
  const monitor = new PlayerHealthMonitor({ monitorInterval: 5000, maxRestarts: 3, baseBackoffMs: 750 });

  await monitor.attach(
    videoId,
    () => routeProcess(streamForRouting),
    (proc) => {
      child = proc;
    }
  );

  const timeoutId = setTimeout(() => {
    if (!child.killed) child.kill('SIGKILL');
    monitor.stop();
  }, 1000 * 60 * 15);

  request.signal.addEventListener('abort', () => {
    if (!child.killed) child.kill('SIGTERM');
    clearTimeout(timeoutId);
    monitor.stop();
  });

  const streamData = new ReadableStream({
    start(controller) {
      child.stdout.on('data', (chunk) => controller.enqueue(chunk));

      child.stdout.on('end', () => {
        clearTimeout(timeoutId);
        monitor.stop();
        controller.close();
      });

      child.on('error', async (err) => {
        await logEvent('ERROR', 'SmartPlayer', 'Spawn error', { videoId, error: err.message });
        clearTimeout(timeoutId);
        monitor.stop();
        controller.error(err);
      });

      child.stderr.on('data', (err) => {
        console.error(`[smart-player:${videoId}]`, err.toString());
      });
    },
    cancel() {
      clearTimeout(timeoutId);
      monitor.stop();
      if (!child.killed) child.kill('SIGTERM');
    },
  });

  return new NextResponse(streamData, {
    headers: {
      'Content-Type': 'video/mp2t',
      'Cache-Control': 'no-cache',
    },
  });
}
