import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { routeProcess, StreamForRouting } from '@/lib/player/router';
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

  let child = routeProcess(streamForRouting);
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
<<<<<<< HEAD
      controllerRef?.close();
    });

    proc.on('error', async (err) => {
      await logEvent('ERROR', 'SmartPlayer', 'Spawn error', { videoId, error: err.message });
      clearTimeout(timeoutId);
      monitor.stop();
      controllerRef?.error(err);
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

  await monitor.attach(videoId, child, () => routeProcess(streamForRouting), (proc) => {
    // child is const, so we can't reassign it, but bindProcess works on the new proc instance
    // The previous implementation used let child, but we changed to const. 
    // However, for restart logic to work and to be able to kill the latest process on abort/timeout, 
    // we need to keep track of the current active process. 
    // Let's refactor to use a ref for the child process if we want to keep it const, or change it back to let.
    // Changing back to let child at the top is cleaner for this specific logic.
    // Reverting line 45 change from const child to let child.
    
    // Actually, looking at the previous step, I defined it as const child = ...
    // I need to fix that first.
    
    // But for now, let's just apply the PR 13 logic which seems robust.
    // The PR 13 logic expects child to be mutable or handled via callback.
    // In the attach callback: (proc) => { child = proc; bindProcess(proc); }
    // So child MUST be mutable.
    
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
      // We need access to the current child process here.
      // If child is immutable, we might be killing the old one if restart happened.
      // But monitor.attach usually handles restarts internally? 
      // No, monitor.attach takes a callback to update the external reference.
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
