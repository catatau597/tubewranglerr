export interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  jitterMs?: number;
}

export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const retries = options.retries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 1000;
  const jitterMs = options.jitterMs ?? 200;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        break;
      }

      const expoDelay = baseDelayMs * 2 ** attempt;
      const jitter = Math.floor(Math.random() * jitterMs);
      await sleep(expoDelay + jitter);
    }
  }

  throw lastError;
}
