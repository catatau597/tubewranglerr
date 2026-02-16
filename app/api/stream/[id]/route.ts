import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { spawn } from 'child_process';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: videoId } = await params;

  const stream = await prisma.stream.findUnique({
    where: { videoId },
    select: { status: true, watchUrl: true, thumbnailUrl: true },
  });

  if (!stream) {
    return new NextResponse('Stream not found', { status: 404 });
  }

  let processArgs: string[] = [];
  let command = '';

  if (stream.status === 'live') {
    command = 'streamlink';
    processArgs = ['--stdout', stream.watchUrl, 'best'];
  } else if (stream.status === 'none' || stream.status === 'vod') {
    command = 'yt-dlp';
    processArgs = ['-o', '-', stream.watchUrl];
  } else {
    command = 'ffmpeg';
    processArgs = ['-re', '-i', stream.thumbnailUrl || 'placeholder.jpg', '-f', 'mpegts', '-'];
  }

  const child = spawn(command, processArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

  const timeoutId = setTimeout(() => {
    if (!child.killed) child.kill('SIGKILL');
  }, 1000 * 60 * 10);

  request.signal.addEventListener('abort', () => {
    if (!child.killed) child.kill('SIGTERM');
    clearTimeout(timeoutId);
  });

  const streamData = new ReadableStream({
    start(controller) {
      child.stdout.on('data', (chunk) => controller.enqueue(chunk));

      child.stdout.on('end', () => {
        clearTimeout(timeoutId);
        controller.close();
      });

      child.on('error', (err) => {
        console.error(`[${command}] spawn error:`, err);
        clearTimeout(timeoutId);
        controller.error(err);
      });

      child.stderr.on('data', (err) => {
        console.error(`[${command}]`, err.toString());
      });

      child.on('exit', (code) => {
        if (code && code !== 0) {
          console.error(`[${command}] exited with code ${code}`);
        }
      });
    },
    cancel() {
      clearTimeout(timeoutId);
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
