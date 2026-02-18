import fs from 'fs';
import path from 'path';
function pickCookiesFile(watchUrl: string): string | undefined {
  try {
    const cookiesDir = path.resolve(process.cwd(), 'app');
    const files = fs.readdirSync(cookiesDir).filter(f => f.endsWith('.txt'));
    const url = new URL(watchUrl);
    if (url.hostname.includes('youtube')) {
      if (files.includes('youtube.txt')) return path.join(cookiesDir, 'youtube.txt');
    }
    if (url.hostname.includes('dailymotion')) {
      if (files.includes('daylomotin.txt')) return path.join(cookiesDir, 'daylomotin.txt');
    }
    if (files.includes('cookies.txt')) return path.join(cookiesDir, 'cookies.txt');
    return undefined;
  } catch {
    return undefined;
  }
}
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';

export interface StreamForRouting {
  videoId: string;
  status: string;
  watchUrl: string;
  thumbnailUrl: string | null;
  title: string;
  actualStart?: Date | null;
  actualEnd?: Date | null;
  scheduledStart?: Date | null;
}

export function isGenuinelyLive(stream: StreamForRouting): boolean {
  return stream.status === 'live' && Boolean(stream.actualStart) && !stream.actualEnd;
}

export function escapeFfmpegText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'")
    .replace(/,/g, '\\,')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
}

function buildPlaceholderFilter(stream: StreamForRouting) {
  const now = new Date();
  const target = stream.scheduledStart ?? now;
  const dateLabel = target.toLocaleString('pt-BR');
  const title = escapeFfmpegText(stream.title || 'Sem programação ao vivo no momento');

  return [
    `[0:v]fps=25,scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,format=yuv420p,` +
      `drawtext=fontcolor=white:fontsize=34:box=1:boxcolor=0x00000099:boxborderw=10:x=(w-text_w)/2:y=h*0.70:text='${title}',` +
      `drawtext=fontcolor=yellow:fontsize=28:box=1:boxcolor=0x00000099:boxborderw=8:x=(w-text_w)/2:y=h*0.80:text='${escapeFfmpegText(dateLabel)}'[v]`,
  ].join('');
}

export function runFfmpegPlaceholder(stream: StreamForRouting, userAgent = 'TubeWranglerr/1.0'): ChildProcessWithoutNullStreams {
  const imageUrl = stream.thumbnailUrl || process.env.PLACEHOLDER_IMAGE_URL || 'https://placehold.co/1280x720/111827/ffffff?text=TubeWranglerr';
  const filterComplex = buildPlaceholderFilter(stream);

  const args = [
    '-loglevel', 'error',
    '-re',
    '-user_agent', userAgent,
    '-i', imageUrl,
    '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
    '-filter_complex', filterComplex,
    '-map', '[v]', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'ultrafast',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k',
    '-shortest',
    '-tune', 'stillimage',
    '-f', 'mpegts', 'pipe:1',
  ];

  return spawn('ffmpeg', args);
}

export function runStreamlink(stream: StreamForRouting, userAgent?: string, cookiesPath?: string): ChildProcessWithoutNullStreams {
  const args = ['--stdout', '--hls-live-restart'];
  if (userAgent) args.push('--http-header', `User-Agent=${userAgent}`);
  if (cookiesPath) args.push('--cookies', cookiesPath);
  args.push(stream.watchUrl, 'best');
  return spawn('streamlink', args);
}

export function buildYtDlpArgs(stream: StreamForRouting, userAgent?: string, cookiesPath?: string): string[] {
  const isLiveLike = isGenuinelyLive(stream);
  const args = [
    '-f', isLiveLike ? 'best' : 'bv*+ba/best',
    '--no-part',
    '--downloader', 'default:ffmpeg',
    '--downloader', 'm3u8:ffmpeg',
    '--concurrent-fragments', '1',
    '--hls-use-mpegts',
    '--downloader-args', 'ffmpeg_i:-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5',
    '-o', '-',
    stream.watchUrl,
  ];
  if (userAgent) args.push('--user-agent', userAgent);
  if (cookiesPath) args.push('--cookies', cookiesPath);
  return args;
}

export function runYtDlp(stream: StreamForRouting, userAgent?: string, cookiesPath?: string): ChildProcessWithoutNullStreams {
  return spawn('yt-dlp', buildYtDlpArgs(stream, userAgent, cookiesPath));
}

export type LiveEngine = 'streamlink' | 'yt-dlp';

export function routeProcess(
  stream: StreamForRouting,
  options?: { liveEngine?: LiveEngine, userAgent?: string, cookiesPath?: string }
): ChildProcessWithoutNullStreams {
  const userAgent = options?.userAgent;
  // Se cookiesPath não for passado explicitamente, tenta escolher automaticamente
  let cookiesPath = options?.cookiesPath;
  if (!cookiesPath) {
    cookiesPath = pickCookiesFile(stream.watchUrl);
  }
  if (isGenuinelyLive(stream)) {
    const engine = options?.liveEngine ?? 'streamlink';
    return engine === 'yt-dlp'
      ? runYtDlp(stream, userAgent, cookiesPath)
      : runStreamlink(stream, userAgent, cookiesPath);
  }
  if (stream.status === 'none' || stream.status === 'vod') {
    return runYtDlp(stream, userAgent, cookiesPath);
  }
  return runFfmpegPlaceholder(stream, userAgent);
}
