// lib/scheduler.ts
import cron from 'node-cron';
import { syncChannels, syncStreams } from '@/lib/services/youtube';
import { getIntConfig, getBoolConfig } from '@/lib/config';
import { withRetry } from '@/lib/retry';
import { logEvent } from '@/lib/observability';

let isRunning = false;
let isJobInProgress = false;

const schedulerMetrics = {
  initializedAt: null as string | null,
  lastRunAt: null as string | null,
  lastSuccessAt: null as string | null,
  lastErrorAt: null as string | null,
  lastErrorMessage: null as string | null,
  inProgress: false,
};

export function getSchedulerMetrics() {
  return {
    ...schedulerMetrics,
    isRunning,
    isJobInProgress,
  };
}

export async function startScheduler() {
  if (isRunning) return;
  isRunning = true;
  schedulerMetrics.initializedAt = new Date().toISOString();

  await logEvent('INFO', 'Scheduler', 'Initializing scheduler');

  const intervalHours = await getIntConfig('SCHEDULER_MAIN_INTERVAL_HOURS', 4);
  const cronExpression = `0 */${intervalHours} * * *`;

  await logEvent('INFO', 'Scheduler', 'Scheduling main sync', { cronExpression });

  const runSync = async () => {
    if (isJobInProgress) {
      await logEvent('WARN', 'Scheduler', 'Skipped cron execution because another run is in progress');
      return;
    }

    schedulerMetrics.lastRunAt = new Date().toISOString();

    const isPaused = await getBoolConfig('SCHEDULER_PAUSED', false);
    if (isPaused) {
      await logEvent('INFO', 'Scheduler', 'Sync is paused. Skipping execution.');
      return;
    }

    isJobInProgress = true;
    schedulerMetrics.inProgress = true;

    await logEvent('INFO', 'Scheduler', 'Running main sync');
    try {
      const retryAttempts = await getIntConfig('SCHEDULER_RETRY_ATTEMPTS', 2);
      const retryBaseDelayMs = await getIntConfig('SCHEDULER_RETRY_BASE_DELAY_MS', 1000);

      await withRetry(async () => {
        await syncChannels();
        await syncStreams();
      }, { retries: retryAttempts, baseDelayMs: retryBaseDelayMs, jitterMs: 250 });
      schedulerMetrics.lastSuccessAt = new Date().toISOString();
      schedulerMetrics.lastErrorAt = null;
      schedulerMetrics.lastErrorMessage = null;
      await logEvent('INFO', 'Scheduler', 'Main sync completed');
    } catch (error) {
      schedulerMetrics.lastErrorAt = new Date().toISOString();
      schedulerMetrics.lastErrorMessage = error instanceof Error ? error.message : String(error);
      await logEvent('ERROR', 'Scheduler', 'Sync failed', { error: schedulerMetrics.lastErrorMessage });
    } finally {
      isJobInProgress = false;
      schedulerMetrics.inProgress = false;
    }
  };

  cron.schedule(cronExpression, runSync);

  // Trigger immediate initial sync
  await logEvent('INFO', 'Scheduler', 'Triggering immediate initial sync');
  runSync().catch(err => console.error('Initial sync failed', err));
}      await logEvent('INFO', 'Scheduler', 'Main sync completed');
    } catch (error) {
      schedulerMetrics.lastErrorAt = new Date().toISOString();
      schedulerMetrics.lastErrorMessage = error instanceof Error ? error.message : String(error);
      await logEvent('ERROR', 'Scheduler', 'Sync failed', { error: schedulerMetrics.lastErrorMessage });
    } finally {
      isJobInProgress = false;
      schedulerMetrics.inProgress = false;
    }
  };

  cron.schedule(cronExpression, runSync);

  // Trigger immediate initial sync
  await logEvent('INFO', 'Scheduler', 'Triggering immediate initial sync');
  runSync().catch(err => console.error('Initial sync failed', err));
}
