import { Resend } from 'resend';
import type { ContactValues } from './validation';

// ---------------------------------------------------------------------------
// Email delivery.
//
// The two rules that keep this form from becoming a phishing relay:
//
//   1. `to` is a FIXED address from the environment. It is never read from the
//      request body. A user-supplied recipient is the definition of an open
//      relay — it would let anyone send mail to anyone, authenticated by this
//      domain's SPF/DKIM.
//
//   2. `from` is always a domain the site owner controls. Putting the
//      submitter's address there would be spoofing, would fail DMARC, and
//      would destroy the domain's sending reputation. The submitter's address
//      goes in `replyTo` instead, which is what makes Reply work correctly.
// ---------------------------------------------------------------------------

export interface SendResult {
  ok: boolean;
  error?: string;
}

let client: Resend | null = null;

function getClient(apiKey: string): Resend {
  if (!client) client = new Resend(apiKey);
  return client;
}

export interface ContactEnv {
  apiKey: string;
  from: string;
  to: string;
}

/** Read and validate the delivery environment. Returns null when unconfigured. */
export function readEnv(): ContactEnv | null {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !from || !to) return null;
  return { apiKey, from, to };
}

export async function sendContactEmail(
  values: ContactValues,
  env: ContactEnv,
): Promise<SendResult> {
  const { name, email, subject, message } = values;

  // Subject is built from our own copy plus the (already control-char checked)
  // name, then hard-capped. A newline here would split the header.
  const line = subject
    ? `Portfolio enquiry: ${subject}`
    : `Portfolio enquiry from ${name}`;

  // Plain text only — no HTML body means there is no way for submitted content
  // to render as a clickable lure in mail that carries this domain's signature.
  const text = [
    `Name:    ${name}`,
    `Email:   ${email}`,
    subject ? `Subject: ${subject}` : null,
    '',
    '---',
    '',
    message,
    '',
    '---',
    'Sent from the contact form. Reply directly to respond to the sender.',
  ]
    .filter((l) => l !== null)
    .join('\n');

  try {
    const { error } = await getClient(env.apiKey).emails.send({
      from: env.from,
      to: [env.to],
      replyTo: email,
      subject: line.slice(0, 160),
      text,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown send failure' };
  }
}
