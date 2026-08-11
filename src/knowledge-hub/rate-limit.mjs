import { KnowledgeHubError } from './errors.mjs';

export function createFixedWindowRateLimiter({ limit = 120, windowMs = 60_000, clock = () => Date.now() } = {}) {
  if (!Number.isInteger(limit) || limit < 1) throw new TypeError('limit must be positive integer');
  if (!Number.isInteger(windowMs) || windowMs < 1000) throw new TypeError('windowMs must be >= 1000');
  const windows = new Map();
  return Object.freeze({
    consume(key) {
      const now = Number(clock());
      const current = windows.get(key);
      const entry = !current || now >= current.resetAt ? { count: 0, resetAt: now + windowMs } : current;
      entry.count += 1;
      windows.set(key, entry);
      if (entry.count > limit) {
        const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
        throw new KnowledgeHubError('HUB_RATE_LIMITED', 'Rate limit exceeded', { status: 429, details: { retry_after_seconds: retryAfterSeconds } });
      }
      return { remaining: Math.max(0, limit - entry.count), reset_at_ms: entry.resetAt };
    },
    reset() { windows.clear(); }
  });
}
