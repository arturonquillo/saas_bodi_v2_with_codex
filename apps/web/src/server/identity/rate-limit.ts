import { ApiError } from "../http/respond";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;
const MAX = 10;

export function assertRateLimit(key: string, max = MAX, windowMs = WINDOW_MS) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  current.count += 1;
  if (current.count > max) {
    throw new ApiError("rate_limit", "Muitas tentativas. Tente novamente em instantes.");
  }
}

export function resetRateLimitsForTests() {
  buckets.clear();
}
