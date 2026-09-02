// ---------------------------------------------------------------------------
// Origin checking.
//
// A cross-origin POST from an attacker's page should not reach the send stage.
// But this check is easy to misconfigure — a port difference, a stray `www.`,
// or a preview deployment on a different hostname will silently reject every
// genuine submission — so it compares hosts leniently and always says what it
// expected when it refuses.
// ---------------------------------------------------------------------------

export type OriginVerdict = 'ok' | 'mismatch' | 'absent';

export interface OriginCheck {
  verdict: OriginVerdict;
  /** What the request claimed. For logs only. */
  candidate?: string;
  /** What we compared against. For logs only. */
  expected?: string;
}

/** Strip a leading `www.` so apex and www forms of a domain are equivalent. */
function normaliseHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, '');
}

/**
 * Hosts allowed in addition to NEXT_PUBLIC_SITE_URL.
 *
 * localhost is always permitted: `next dev` serves on whatever port is free,
 * so pinning the dev port in env is a reliable way to lock yourself out of
 * your own form. An attacker cannot exploit this — a page served from an
 * attacker's domain cannot forge an Origin header of localhost.
 */
function isLocalhost(host: string): boolean {
  const name = host.split(':')[0];
  return name === 'localhost' || name === '127.0.0.1' || name === '[::1]' || name === '::1';
}

export function checkOrigin(
  origin: string | undefined,
  referer: string | undefined,
  siteUrl: string | undefined,
  extraAllowed: string[] = [],
): OriginCheck {
  // Some browsers omit Origin on same-origin POSTs. Treated as a soft signal
  // by the caller rather than a hard block.
  if (!origin && !referer) return { verdict: 'absent' };

  const candidate = origin ?? referer!;

  let candidateHost: string;
  try {
    candidateHost = new URL(candidate).host;
  } catch {
    return { verdict: 'mismatch', candidate };
  }

  if (isLocalhost(candidateHost)) return { verdict: 'ok', candidate };

  // Unconfigured: cannot judge, so do not block. Better a working form than a
  // silent outage — the other layers still apply.
  if (!siteUrl) return { verdict: 'ok', candidate };

  let expectedHost: string;
  try {
    expectedHost = new URL(siteUrl).host;
  } catch {
    return { verdict: 'ok', candidate };
  }

  const allowed = [expectedHost, ...extraAllowed].map(normaliseHost);
  const got = normaliseHost(candidateHost);

  // Compare hostname without port too, so a proxy that rewrites the port does
  // not break submissions on an otherwise correct domain.
  const gotName = got.split(':')[0];
  const matched = allowed.some((a) => a === got || a.split(':')[0] === gotName);

  return matched
    ? { verdict: 'ok', candidate }
    : { verdict: 'mismatch', candidate, expected: expectedHost };
}
