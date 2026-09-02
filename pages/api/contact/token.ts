import type { NextApiRequest, NextApiResponse } from 'next';
import { issueToken } from '@/lib/contact/token';

// Issues the signed timestamp the contact form submits back. See lib/contact/token.ts.
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false });
  }

  const secret = process.env.CONTACT_TOKEN_SECRET;
  if (!secret) {
    console.error('[contact] CONTACT_TOKEN_SECRET is not set — form submissions will fail.');
    return res.status(500).json({ ok: false });
  }

  // The token embeds an issue time, so it must never be cached by a CDN or the
  // browser — a cached token would defeat the dwell check for every visitor.
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.status(200).json({ token: issueToken(secret) });
}
