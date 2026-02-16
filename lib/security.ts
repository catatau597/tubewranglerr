const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function assertAdminToken(req: Request) {
  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected) return;

  const provided = req.headers.get('x-admin-token');
  if (provided !== expected) {
    const error = new Error('Unauthorized');
    (error as Error & { status?: number }).status = 401;
    throw error;
  }
}

export function assertRateLimit(key: string, maxRequests = 30, windowMs = 60_000) {
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || now > current.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (current.count >= maxRequests) {
    const error = new Error('Too Many Requests');
    (error as Error & { status?: number }).status = 429;
    throw error;
  }

  current.count += 1;
  rateLimitStore.set(key, current);
}

export function toHttpErrorStatus(error: unknown) {
  if (error && typeof error === 'object' && 'status' in error && typeof (error as { status?: unknown }).status === 'number') {
    return (error as { status: number }).status;
  }
  return 500;
}
