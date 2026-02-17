import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { isGenuinelyLive, LiveEngine, routeProcess, StreamForRouting } from '@/lib/player/router';
import { canUseBinaryRoute, getRequiredBinary, getSmartPlayerMode } from '@/lib/player/capabilities';
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

  const mode = getSmartPlayerMode();
  const canUseBinary = canUseBinaryRoute(streamForRouting);
  const requiredBinary = getRequiredBinary(streamForRouting);

  if (mode === 'redirect' || (mode === 'auto' && !canUseBinary)) {
    await logEvent('WARN', 'SmartPlayer', 'Using redirect fallback', {
      videoId,
      status: stream.status,
      mode,
      requiredBinary,
    });

    return NextResponse.redirect(stream.watchUrl, {
      status: 302,
      headers: {
        'x-smart-player-mode': 'redirect',
      },
    });
  }

  if (mode === 'binary' && !canUseBinary) {
    await logEvent('ERROR', 'SmartPlayer', 'Required binary unavailable in binary mode', {
      videoId,
      status: stream.status,
      requiredBinary,
    });

    return NextResponse.json(
      { error: `Required binary not available: ${requiredBinary}` },
      { status: 503, headers: { 'x-smart-player-mode': 'binary-unavailable' } }
    );
  }

  const enableAnalytics = await getBoolConfig('PROXY_ENABLE_ANALYTICS', true);
  if (enableAnalytics) {
    await logEvent('INFO', 'SmartPlayer', 'Proxy access', { videoId, status: stream.status });
  }

  const liveEngineOrder: LiveEngine[] = ['streamlink', 'yt-dlp'];
  let liveEngineAttempt = 0;

  const createProcess = () => {
    if (isGenuinelyLive(streamForRouting)) {
      const engine = liveEngineOrder[Math.min(liveEngineAttempt, liveEngineOrder.length - 1)];
      liveEngineAttempt += 1;

      if (liveEngineAttempt > 1) {
        void logEvent('WARN', 'SmartPlayer', 'Falling back live engine', { videoId, engine });
      }

      return routeProcess(streamForRouting, { liveEngine: engine });
    }

    return routeProcess(streamForRouting);
  };

  let child = createProcess();
  const monitor = new PlayerHealthMonitor({ monitorInterval: 5000, maxRestarts: 3, baseBackoffMs: 750 });

  let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null;
  let streamClosed = false;

  const safeEnqueue = (chunk: Buffer) => {
    if (streamClosed || !controllerRef) return;
    try {
      controllerRef.enqueue(chunk);
    } catch {
      streamClosed = true;
      if (!child.killed) {
        child.kill('SIGTERM');
      }
      monitor.stop();
    }
  };

  const safeClose = () => {
    if (streamClosed || !controllerRef) return;
    try {
      controllerRef.close();
    } catch {
      // noop
    }
    streamClosed = true;
  };

  const safeError = (err: Error) => {
    if (streamClosed || !controllerRef) return;
    try {
      controllerRef.error(err);
    } catch {
      // noop
    }
    streamClosed = true;
  };

  const timeoutId = setTimeout(() => {
    if (!child.killed) child.kill('SIGKILL');
    monitor.stop();
  }, 1000 * 60 * 15);

  request.signal.addEventListener('abort', () => {
    if (!child.killed) child.kill('SIGTERM');
    clearTimeout(timeoutId);
    monitor.stop();
    streamClosed = true;
  });

  const bindProcess = (proc: typeof child) => {
    proc.stdout.on('data', (chunk: Buffer) => safeEnqueue(chunk));

    proc.stdout.on('end', () => {
      if (proc !== child) return;
      clearTimeout(timeoutId);
      monitor.stop();
      safeClose();
    });

    proc.on('error', async (err) => {
      if (proc !== child || streamClosed) return;
      await logEvent('ERROR', 'SmartPlayer', 'Spawn error', { videoId, error: err.message });
      clearTimeout(timeoutId);
      monitor.stop();
      safeError(err);
    });

    proc.stderr.on('data', (err) => {
      if (streamClosed) return;
      console.error(`[smart-player:${videoId}]`, err.toString());
    });
  };

  await monitor.attach(videoId, child, createProcess, (proc) => {
    child = proc;
    bindProcess(proc);
  });

  const streamData = new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller;
    },
    cancel() {
      streamClosed = true;
      clearTimeout(timeoutId);
      monitor.stop();
      if (!child.killed) child.kill('SIGTERM');
    },
  });

  return new NextResponse(streamData, {
    headers: {
      'Content-Type': 'video/mp2t',
      'Cache-Control': 'no-cache',
      'x-smart-player-mode': 'binary',
    },
  });
}
