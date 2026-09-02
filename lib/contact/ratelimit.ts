// ---------------------------------------------------------------------------
// Fixed-window rate limiting.
//
// Two counters, both enforced:
//   • per-IP  — stops one actor hammering the form
//   • global  — stops a botnet rotating IPs from flooding the inbox or burning
//               the Resend quota
//
// Backed by Upstash Redis when configured. Serverless functions do not share
// memory and cold-start constantly, so an in-process counter cannot hold a
// window on its own — but it is a useful speed bump, so it is the fallback
// when Redis is absent (local dev, or a missing env var in production).
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets. Sent to the client as `Retry-After`. */
  retryAfterSeconds: number;
  /** Which counter tripped — for server logs only, never returned to a client. */
  scope?: 'ip' | 'global';
  /** True when the in-memory fallback served the request. */
  degraded?: boolean;
}

const WINDOW_SECONDS = 60 * 60; // 1 hour
const IP_LIMIT = 3;
const GLOBAL_LIMIT = 30;

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export const isRedisConfigured = Boolean(REDIS_URL && REDIS_TOKEN);

// --- in-memory fallback -----------------------------------------------------

interface Bucket {
  count: number;
  resetAt: number;
}

const memory = new Map<string, Bucket>();

function memoryIncrement(key: string, limit: number): { count: number; resetAt: number; ok: boolean } {
  const now = Date.now();
  const existing = memory.get(key);

  if (!existing || existing.resetAt <= now) {
    const fresh = { count: 1, resetAt: now + WINDOW_SECONDS * 1000 };
    memory.set(key, fresh);
    // Opportunistic sweep so the map cannot grow without bound on a warm lambda.
    if (memory.size > 5_000) {
      for (const [k, v] of memory) if (v.resetAt <= now) memory.delete(k);
    }
    return { count: 1, resetAt: fresh.resetAt, ok: true };
  }

  existing.count += 1;
  return { count: existing.count, resetAt: existing.resetAt, ok: existing.count <= limit };
}

// --- Upstash REST -----------------------------------------------------------

/**
 * INCR the key and set the TTL on first write, via Upstash's REST pipeline.
 * Using the REST API directly avoids adding a dependency and works on every
 * runtime. Returns null if the call fails, so the caller can fall back.
 */
async function redisIncrement(
  key: string,
): Promise<{ count: number; ttl: number } | null> {
  try {
    const res = await fetch(`${REDIS_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['TTL', key],
      ]),
      // Never let a slow limiter hold the request open.
      signal: AbortSignal.timeout(2_000),
    });

    if (!res.ok) return null;

    const payload = (await res.json()) as Array<{ result?: unknown; error?: string }>;
    const count = Number(payload?.[0]?.result);
    let ttl = Number(payload?.[1]?.result);
    if (!Number.isFinite(count)) return null;

    // TTL of -1 means the key exists with no expiry — i.e. we just created it
    // via INCR. Set the window now so it cannot live forever.
    if (ttl < 0) {
      await fetch(`${REDIS_URL}/expire/${encodeURIComponent(key)}/${WINDOW_SECONDS}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
        signal: AbortSignal.timeout(2_000),
      });
      ttl = WINDOW_SECONDS;
    }

    return { count, ttl };
  } catch {
    return null;
  }
}

async function checkOne(
  key: string,
  limit: number,
): Promise<{ ok: boolean; retryAfterSeconds: number; degraded: boolean }> {
  if (isRedisConfigured) {
    const result = await redisIncrement(key);
    if (result) {
      return {
        ok: result.count <= limit,
        retryAfterSeconds: Math.max(1, result.ttl),
        degraded: false,
      };
    }
    // Redis unreachable — fall through to memory rather than failing the
    // submission. Availability of a contact form beats a perfect window.
  }

  const mem = memoryIncrement(key, limit);
  return {
    ok: mem.ok,
    retryAfterSeconds: Math.max(1, Math.ceil((mem.resetAt - Date.now()) / 1000)),
    degraded: true,
  };
}

/**
 * Extract the client IP from proxy headers.
 *
 * Only the FIRST entry of `x-forwarded-for` is trusted: the header is a
 * comma-separated chain and anything after the first hop is attacker-appendable.
 */
export function clientIpFrom(headers: Record<string, string | string[] | undefined>): string {
  const raw = headers['x-forwarded-for'];
  const chain = Array.isArray(raw) ? raw[0] : raw;
  const first = chain?.split(',')[0]?.trim();
  if (first) return first;

  const real = headers['x-real-ip'];
  const realIp = Array.isArray(real) ? real[0] : real;
  return realIp?.trim() || 'unknown';
}

export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  // Bucket by the hour so keys expire naturally even if a TTL write is lost.
  const window = Math.floor(Date.now() / (WINDOW_SECONDS * 1000));

  const perIp = await checkOne(`contact:ip:${ip}:${window}`, IP_LIMIT);
  if (!perIp.ok) {
    return { ok: false, retryAfterSeconds: perIp.retryAfterSeconds, scope: 'ip', degraded: perIp.degraded };
  }

  const global = await checkOne(`contact:global:${window}`, GLOBAL_LIMIT);
  if (!global.ok) {
    return { ok: false, retryAfterSeconds: global.retryAfterSeconds, scope: 'global', degraded: global.degraded };
  }

  return { ok: true, retryAfterSeconds: 0, degraded: perIp.degraded || global.degraded };
}
