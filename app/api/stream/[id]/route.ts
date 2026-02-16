import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { spawn } from 'child_process';
import { getStreamUrl } from '@/lib/player/router'; // To be implemented

// Dynamic Route Handler for Smart Player Proxy
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: videoId } = await params;
  
  // 1. Fetch Stream Status from DB
  const stream = await prisma.stream.findUnique({
    where: { videoId },
    select: { status: true, watchUrl: true, thumbnailUrl: true }
  });

  if (!stream) {
    return new NextResponse('Stream not found', { status: 404 });
  }

  // 2. Determine Source based on Status
  // Logic from smart_player.py ported here
  let processArgs: string[] = [];
  let command = '';

  if (stream.status === 'live') {
    command = 'streamlink';
    processArgs = ['--stdout', stream.watchUrl, 'best'];
  } else if (stream.status === 'none' || stream.status === 'vod') {
    command = 'yt-dlp';
    processArgs = ['-o', '-', stream.watchUrl];
  } else {
    // Upcoming/Placeholder logic (FFmpeg loop)
    command = 'ffmpeg';
    processArgs = [
      '-re', '-i', stream.thumbnailUrl || 'placeholder.jpg',
      '-f', 'mpegts', '-'
      // ... full ffmpeg args for looping image
    ];
  }

  // 3. Spawn Process and Pipe
  const child = spawn(command, processArgs);

  // Create a ReadableStream from the child process stdout
  const streamData = new ReadableStream({
    start(controller) {
      child.stdout.on('data', (chunk) => controller.enqueue(chunk));
      child.stdout.on('end', () => controller.close());
      child.stderr.on('data', (err) => console.error(`[${command}]`, err.toString()));
    },
    cancel() {
      child.kill();
    }
  });

  return new NextResponse(streamData, {
    headers: {
      'Content-Type': 'video/mp2t',
      'Cache-Control': 'no-cache'
    }
  });
}
