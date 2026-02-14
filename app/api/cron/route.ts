import { NextResponse } from 'next/server';
import { syncChannels, syncStreams } from '@/lib/services/youtube';

export async function GET() {
  try {
    console.log('[Cron] Starting Sync...');
    
    // 1. Sync Channels (Resolve handles, update metadata)
    await syncChannels();
    console.log('[Cron] Channels Synced.');

    // 2. Sync Streams (Find live/upcoming)
    await syncStreams();
    console.log('[Cron] Streams Synced.');

    return NextResponse.json({ success: true, timestamp: new Date() });
  } catch (error: any) {
    console.error('[Cron] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
