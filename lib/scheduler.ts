// lib/scheduler.ts
import cron from 'node-cron';
import { syncChannels, syncStreams } from '@/lib/services/youtube';
import { getIntConfig, getBoolConfig } from '@/lib/config';

let isRunning = false;

export async function startScheduler() {
  if (isRunning) return;
  isRunning = true;
  
  console.log('[Scheduler] Initializing...');

  const intervalHours = await getIntConfig('SCHEDULER_MAIN_INTERVAL_HOURS', 4);
  const cronExpression = `0 */${intervalHours} * * *`;
  
  console.log(`[Scheduler] Scheduling main sync: "${cronExpression}"`);
  
  cron.schedule(cronExpression, async () => {
    console.log('[Scheduler] Cron job triggered.');

    const isPaused = await getBoolConfig('SCHEDULER_PAUSED', false);
    if (isPaused) {
      console.log('[Scheduler] Sync is paused. Skipping execution.');
      return;
    }

    console.log('[Scheduler] Running Main Sync...');
    try {
      await syncChannels();
      await syncStreams();
      console.log('[Scheduler] Main Sync completed.');
    } catch (error) {
      console.error('[Scheduler] Sync failed:', error);
    }
  });
}
