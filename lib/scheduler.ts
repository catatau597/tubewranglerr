// lib/scheduler.ts
import cron from 'node-cron';
import { syncStreams } from '@/lib/services/youtube';
import { getIntConfig } from '@/lib/config';

let isRunning = false;

export async function startScheduler() {
  if (isRunning) return;
  isRunning = true;
  
  console.log('[Scheduler] Initializing...');

  // 1. Main Search (Default: every 4 hours)
  const intervalHours = await getIntConfig('SCHEDULER_MAIN_INTERVAL_HOURS', 4);
  const cronExpression = `0 */${intervalHours} * * *`;
  
  console.log(`[Scheduler] Scheduling main sync: "${cronExpression}"`);
  
  cron.schedule(cronExpression, async () => {
    console.log('[Scheduler] Running Main Sync...');
    try {
      await syncStreams(); // Use syncStreams directly
      console.log('[Scheduler] Main Sync completed.');
    } catch (error) {
      console.error('[Scheduler] Sync failed:', error);
    }
  });

  // Also run once immediately on startup? Maybe optional.
  // console.log('[Scheduler] Running initial sync...');
  // await syncStreams().catch(console.error);
}
