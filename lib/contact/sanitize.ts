// ---------------------------------------------------------------------------
// Input sanitisation helpers for the contact pipeline.
// ---------------------------------------------------------------------------

/**
 * True if the string contains CR, LF, NUL or any other C0/C1 control character.
 *
 * Any of these in a value that ends up near a mail header is a header-injection
 * attempt — a newline lets an attacker splice in `Bcc:` and turn the form into a
 * mail relay. We REJECT rather than strip: a legitimate name, email or subject
 * never contains a control character, so stripping would only serve to let a
 * crafted payload through in mangled form.
 *
 * Tabs fall in the C0 range and are equally unwanted in these single-line fields.
 */
export function hasControlChars(value: string): boolean {
  return /[\u0000-\u001f\u007f-\u009f]/.test(value);
}

/**
 * Escape the five HTML-significant characters.
 *
 * The notification email is sent as plain text precisely so this is not needed,
 * but it is here for any future HTML body: unescaped user content in an email
 * that comes from the site's own verified domain is a ready-made phishing lure,
 * because the recipient's mail client shows it as authenticated.
 */
export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
  );
}

/** Trim, collapse whitespace runs, and hard-truncate to a maximum length. */
export function normalise(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

/**
 * Normalise a multi-line field: trim, cap consecutive blank lines, truncate.
 * Unlike `normalise` this preserves the author's own line breaks.
 */
export function normaliseMultiline(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\r\n?/g, '\n')      // normalise line endings
    .replace(/\n{3,}/g, '\n\n')   // collapse runs of blank lines
    .replace(/[ \t]+$/gm, '')     // strip trailing spaces per line
    .trim()
    .slice(0, maxLength);
}
