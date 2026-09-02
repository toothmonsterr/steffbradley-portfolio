import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/contact/token';
import { checkRateLimit, clientIpFrom } from '@/lib/contact/ratelimit';
import { hasControlChars, normalise, normaliseMultiline } from '@/lib/contact/sanitize';
import { isLikelySpam } from '@/lib/contact/heuristics';
import { readEnv, sendContactEmail } from '@/lib/contact/email';
import { checkOrigin } from '@/lib/contact/origin';
import { LIMITS, validate, type ContactErrors, type ContactValues } from '@/lib/contact/validation';

// Cap the body well below anything a legitimate submission needs. The message
// limit is 4000 characters; 16kb leaves generous headroom for encoding.
export const config = {
  api: { bodyParser: { sizeLimit: '16kb' } },
};

interface ContactResponse {
  ok: boolean;
  errors?: ContactErrors;
  message?: string;
}

const GENERIC_ERROR = 'Something went wrong sending your message. Please try again shortly.';

/**
 * The response a bot gets. Identical to a real success, so a spam script
 * cannot tell whether it got through and has nothing to iterate against.
 */
function silentSuccess(res: NextApiResponse<ContactResponse>, reason: string, detail?: string) {
  console.warn(`[contact] dropped silently: ${reason}${detail ? ` — ${detail}` : ''}`);
  return res.status(200).json({ ok: true });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ContactResponse>,
) {
  // --- 1. Method -----------------------------------------------------------
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Method not allowed.' });
  }

  // --- 2. Content type -----------------------------------------------------
  // Requiring JSON means a cross-origin HTML form cannot POST here at all:
  // a plain <form> can only send urlencoded/multipart, and anything else
  // triggers a CORS preflight that we never answer.
  const contentType = req.headers['content-type'] ?? '';
  if (!contentType.includes('application/json')) {
    return res.status(400).json({ ok: false, message: GENERIC_ERROR });
  }

  const body = (req.body ?? {}) as Record<string, unknown>;

  // --- 3. Origin -----------------------------------------------------------
  const origin = checkOrigin(
    req.headers.origin,
    req.headers.referer,
    process.env.NEXT_PUBLIC_SITE_URL,
  );
  if (origin.verdict === 'mismatch') {
    console.warn(
      `[contact] rejected: origin mismatch — got "${origin.candidate}", ` +
        `expected host "${origin.expected}". ` +
        'If this is your own site, check that NEXT_PUBLIC_SITE_URL matches it.',
    );
    return res.status(400).json({ ok: false, message: GENERIC_ERROR });
  }
  // `absent` is allowed through — some browsers omit Origin on same-origin
  // POSTs — but it counts as a soft signal below.

  // --- 4. Honeypot ---------------------------------------------------------
  // A hidden field no human ever sees. Anything in it is automation.
  const honeypot = body.company;
  if (typeof honeypot === 'string' && honeypot.trim() !== '') {
    return silentSuccess(res, 'honeypot filled');
  }

  // --- 5. Signed timestamp -------------------------------------------------
  const secret = process.env.CONTACT_TOKEN_SECRET;
  if (!secret) {
    console.error('[contact] CONTACT_TOKEN_SECRET is not set — refusing to accept submissions.');
    return res.status(500).json({ ok: false, message: GENERIC_ERROR });
  }

  const tokenFailure = verifyToken(body.token, secret);
  if (tokenFailure) {
    // 'expired' is the one failure a real person hits — a form left open all
    // afternoon. Tell them to retry; everything else is silent.
    if (tokenFailure === 'expired') {
      return res.status(400).json({
        ok: false,
        message: 'This form expired. Please reload the page and try again.',
      });
    }
    return silentSuccess(res, `token ${tokenFailure}`);
  }

  // --- 6. Rate limit -------------------------------------------------------
  const ip = clientIpFrom(req.headers);
  const limit = await checkRateLimit(ip);
  if (!limit.ok) {
    console.warn(`[contact] rate limited: scope=${limit.scope} ip=${ip} degraded=${limit.degraded}`);
    res.setHeader('Retry-After', String(limit.retryAfterSeconds));
    return res.status(429).json({
      ok: false,
      message: 'Too many messages sent recently. Please try again a little later.',
    });
  }

  // --- 7. Normalise + validate --------------------------------------------
  // Single-line fields are whitespace-collapsed; the message keeps its breaks.
  const values: ContactValues = {
    name: normalise(body.name, LIMITS.name[1]),
    email: normalise(body.email, LIMITS.email[1]).toLowerCase(),
    subject: normalise(body.subject, LIMITS.subject[1]),
    message: normaliseMultiline(body.message, LIMITS.message[1]),
  };

  const errors = validate(values);
  if (Object.keys(errors).length > 0) {
    // Field errors are safe to return — the user needs them to fix the form.
    return res.status(400).json({ ok: false, errors });
  }

  // --- 8. Header injection -------------------------------------------------
  // Runs on every value that touches a mail header. `normalise` already
  // collapses whitespace, so this is belt-and-braces against anything exotic
  // that survived — and it is the check that stops `Bcc:` splicing.
  for (const field of ['name', 'email', 'subject'] as const) {
    if (hasControlChars(values[field])) {
      return silentSuccess(res, 'control characters in header field', field);
    }
  }

  // --- 9. Content heuristics -----------------------------------------------
  const spam = isLikelySpam(values);
  if (spam.spam) {
    return silentSuccess(res, `heuristics score=${spam.score}`, spam.signals.join(','));
  }
  if (origin.verdict === 'absent' && spam.score > 0) {
    return silentSuccess(res, 'no origin header plus spam signals', spam.signals.join(','));
  }

  // --- 10. Send ------------------------------------------------------------
  const env = readEnv();
  if (!env) {
    console.error('[contact] RESEND_API_KEY / CONTACT_FROM_EMAIL / CONTACT_TO_EMAIL not all set.');
    return res.status(500).json({ ok: false, message: GENERIC_ERROR });
  }

  const sent = await sendContactEmail(values, env);
  if (!sent.ok) {
    console.error(`[contact] send failed: ${sent.error}`);
    return res.status(500).json({ ok: false, message: GENERIC_ERROR });
  }

  return res.status(200).json({ ok: true });
}
