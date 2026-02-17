import { spawnSync } from 'child_process';
import type { StreamForRouting } from '@/lib/player/router';

export type SmartPlayerMode = 'auto' | 'binary' | 'redirect';

export interface BinaryCapabilities {
  ffmpeg: boolean;
  streamlink: boolean;
  ytDlp: boolean;
}

let cachedCapabilities: BinaryCapabilities | null = null;

function commandExists(command: string): boolean {
  const result = spawnSync('sh', ['-lc', `command -v ${command}`], { stdio: 'ignore' });
  return result.status === 0;
}

export function getBinaryCapabilities(forceRefresh = false): BinaryCapabilities {
  if (!forceRefresh && cachedCapabilities) {
    return cachedCapabilities;
  }

  cachedCapabilities = {
    ffmpeg: commandExists('ffmpeg'),
    streamlink: commandExists('streamlink'),
    ytDlp: commandExists('yt-dlp'),
  };

  return cachedCapabilities;
}

export function getSmartPlayerMode(): SmartPlayerMode {
  const mode = (process.env.SMART_PLAYER_MODE || 'auto').toLowerCase();
  if (mode === 'binary' || mode === 'redirect') {
    return mode;
  }
  return 'auto';
}

export function getRequiredBinary(stream: StreamForRouting): keyof BinaryCapabilities {
  if (stream.status === 'live' && Boolean(stream.actualStart) && !stream.actualEnd) {
    return 'ytDlp';
  }

  if (stream.status === 'none' || stream.status === 'vod') {
    return 'ytDlp';
  }

  return 'ffmpeg';
}

export function canUseBinaryRoute(stream: StreamForRouting): boolean {
  const required = getRequiredBinary(stream);
  const capabilities = getBinaryCapabilities();
  return capabilities[required];
}
