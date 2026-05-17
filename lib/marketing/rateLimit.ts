/**
 * In-memory fixed-window rate limiter for the marketing API.
 *
 * Marketing generation calls Claude, so the endpoint is rate-limited per
 * client to bound both abuse and cost. The window is held in process memory.
 *
 * LIMITATION: on a serverless platform each instance keeps its own counter,
 * so the effective limit scales with instance count. Moving this to a shared
 * store (Vercel KV / Upstash) is a foreman task — see `docs/factory/E2-
 * marketing.md` and v2-spec §8.
 */

const WINDOW_MS = 5 * 60_000;
const MAX_REQUESTS = 20;
/** Cap on tracked keys, so a flood of unique IPs cannot grow the map forever. */
const MAX_KEYS = 5_000;

const hits = new Map<string, number[]>();

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the caller may retry; 0 when `ok`. */
  retryAfter: number;
}

/** Record a request for `key` and report whether it is within the limit. */
export function rateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    hits.set(key, recent);
    return {
      ok: false,
      retryAfter: Math.ceil((WINDOW_MS - (now - recent[0])) / 1000),
    };
  }

  recent.push(now);
  hits.set(key, recent);

  // Opportunistic cleanup so idle keys do not accumulate.
  if (hits.size > MAX_KEYS) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    }
  }

  return { ok: true, retryAfter: 0 };
}

/** Derive a stable client key from request headers. */
export function clientKey(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
  return `marketing:${ip}`;
}
