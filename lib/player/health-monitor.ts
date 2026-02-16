import type { ChildProcessWithoutNullStreams } from 'child_process';
import { logEvent } from '@/lib/observability';

export interface HealthMonitorOptions {
  monitorInterval?: number;
  maxRestarts?: number;
  baseBackoffMs?: number;
}

export class PlayerHealthMonitor {
  private readonly monitorInterval: number;
  private readonly maxRestarts: number;
  private readonly baseBackoffMs: number;
  private restarts = 0;
  private monitorTimer: NodeJS.Timeout | null = null;
  private stopped = false;
  private restarting = false;

  constructor(options: HealthMonitorOptions = {}) {
    this.monitorInterval = options.monitorInterval ?? 5000;
    this.maxRestarts = options.maxRestarts ?? 3;
    this.baseBackoffMs = options.baseBackoffMs ?? 750;
  }

  async attach(
    streamId: string,
    initialProcess: ChildProcessWithoutNullStreams,
    processFactory: () => ChildProcessWithoutNullStreams,
    onProcess: (process: ChildProcessWithoutNullStreams) => void,
  ) {
    let current = initialProcess;

    const bind = (proc: ChildProcessWithoutNullStreams) => {
      proc.on('exit', (code) => {
        if (!this.stopped && code && code !== 0) {
          void restart();
        }
      });
      proc.on('error', () => {
        if (!this.stopped) void restart();
      });
    };

    const restart = async () => {
      if (this.stopped || this.restarts >= this.maxRestarts || this.restarting) return;
      this.restarting = true;
      this.restarts += 1;

      const backoff = this.baseBackoffMs * 2 ** (this.restarts - 1);
      await logEvent('WARN', 'SmartPlayer', 'Process unhealthy, restarting', {
        streamId,
        attempt: this.restarts,
        backoff,
      });

      await new Promise((r) => setTimeout(r, backoff));
      if (this.stopped) {
        this.restarting = false;
        return;
      }

      if (!current.killed) {
        current.kill('SIGTERM');
      }

      current = processFactory();
      onProcess(current);
      bind(current);
      this.restarting = false;
    };

    onProcess(current);
    bind(current);

    this.monitorTimer = setInterval(async () => {
      if (this.stopped) return;
      if (current.killed) {
        await restart();
      }
    }, this.monitorInterval);
  }

  stop() {
    this.stopped = true;
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = null;
    }
  }
}
