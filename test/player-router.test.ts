import test from 'node:test';
import assert from 'node:assert/strict';
import { buildYtDlpArgs } from '../lib/player/router';

test('buildYtDlpArgs uses ffmpeg downloader and serial fragments for VOD', () => {
  const args = buildYtDlpArgs({
    videoId: 'abc',
    status: 'none',
    watchUrl: 'https://www.youtube.com/watch?v=abc',
    thumbnailUrl: null,
    title: 'vod',
  });

  assert.deepEqual(args.slice(0, 2), ['-f', 'bv*+ba/best']);
  assert.ok(args.includes('--downloader'));
  assert.ok(args.includes('default:ffmpeg'));
  assert.ok(args.includes('m3u8:ffmpeg'));
  assert.ok(args.includes('--concurrent-fragments'));
  assert.ok(args.includes('1'));
  assert.ok(args.includes('--hls-use-mpegts'));
});

test('buildYtDlpArgs keeps best selector for live', () => {
  const args = buildYtDlpArgs({
    videoId: 'live1',
    status: 'live',
    watchUrl: 'https://www.youtube.com/watch?v=live1',
    thumbnailUrl: null,
    title: 'live',
    actualStart: new Date(),
    actualEnd: null,
  });

  assert.deepEqual(args.slice(0, 2), ['-f', 'best']);
});
