export type StreamStatus = 'live' | 'upcoming' | 'none';

export function deriveFinalStatus(
  liveStatus: string | null | undefined,
  actualStart: Date | null,
  actualEnd: Date | null
): StreamStatus {
  if (liveStatus === 'live' && actualStart && !actualEnd) {
    return 'live';
  }

  if (liveStatus === 'upcoming') {
    return 'upcoming';
  }

  return 'none';
}

export function shouldSkipStreamUpsert(
  hasExistingStream: boolean,
  finalStatus: StreamStatus,
  keepRecordedStreams: boolean
): boolean {
  return !hasExistingStream && finalStatus === 'none' && !keepRecordedStreams;
}
