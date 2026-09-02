import { createHmac, timingSafeEqual } from 'crypto';

// ---------------------------------------------------------------------------
// Signed timestamp token.
//
// Issued when the form mounts, verified on submit. Two jobs:
//   1. Dwell time — a bot that POSTs the instant it finds the form fails the
//      minimum. Humans cannot fill four fields in under three seconds.
//   2. Replay window — a harvested token expires within the hour.
//
// It is HMAC-signed so it cannot be forged or back-dated: the client only ever
// holds an opaque string, and the secret never leaves the server.
// ---------------------------------------------------------------------------

const MIN_DWELL_MS = 3_000;             // 3 seconds
const MAX_AGE_MS   = 60 * 60 * 1_000;   // 1 hour

export type TokenFailure = 'malformed' | 'bad-signature' | 'too-fast' | 'expired';

export function issueToken(secret: string): string {
  const ts = Date.now().toString();
  const sig = createHmac('sha256', secret).update(ts).digest('base64url');
  return `${ts}.${sig}`;
}

/**
 * Verify a token. Returns null when valid, or the specific reason it failed.
 *
 * The caller must NOT surface the reason to the client — it is for server logs
 * only. Telling a bot which check it tripped is telling it how to pass.
 */
export function verifyToken(token: unknown, secret: string): TokenFailure | null {
  if (typeof token !== 'string' || !token) return 'malformed';

  const parts = token.split('.');
  if (parts.length !== 2) return 'malformed';

  const [ts, sig] = parts;
  if (!/^\d+$/.test(ts) || !sig) return 'malformed';

  const expected = createHmac('sha256', secret).update(ts).digest('base64url');

  // Constant-time compare. Length must match first — timingSafeEqual throws on
  // differing lengths, which would itself leak information via the exception.
  const given = Buffer.from(sig);
  const want = Buffer.from(expected);
  if (given.length !== want.length || !timingSafeEqual(given, want)) {
    return 'bad-signature';
  }

  const age = Date.now() - Number(ts);
  if (age < MIN_DWELL_MS) return 'too-fast';
  if (age > MAX_AGE_MS) return 'expired';

  return null;
}
