// ---------------------------------------------------------------------------
// Shared validation rules — imported by BOTH the client component and the API
// route. The client copy exists only for fast inline feedback; the server
// re-runs every rule and is the actual gate. Never assume the client ran.
// ---------------------------------------------------------------------------

export type Field = 'name' | 'email' | 'subject' | 'message';

export interface ContactValues {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export type ContactErrors = Partial<Record<Field, string>>;

/** [min, max] character bounds per field. Subject is optional, hence min 0. */
export const LIMITS = {
  name:    [2, 80],
  email:   [5, 254],   // 254 is the practical maximum length of an email address
  subject: [0, 120],
  message: [20, 4000],
} as const;

// Deliberately stricter than RFC 5322. The full spec permits quoted local parts,
// comments and display names — all legal, all awkward to hand to a mail API
// safely. A portfolio contact form loses nothing by rejecting them.
export const EMAIL_RE =
  /^[^\s@,;:<>"'\\]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i;

/** Collapse runs of whitespace and trim — used for length checks so a message
 *  of 100 spaces does not pass the minimum. */
export function collapse(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export const EMPTY_VALUES: ContactValues = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

/**
 * Validate a submission. Returns an object with a message per invalid field;
 * an empty object means valid. Messages are user-facing.
 */
export function validate(values: Partial<ContactValues>): ContactErrors {
  const errors: ContactErrors = {};

  const name = collapse(values.name ?? '');
  if (name.length < LIMITS.name[0]) {
    errors.name = 'Please enter your name.';
  } else if (name.length > LIMITS.name[1]) {
    errors.name = `Please keep your name under ${LIMITS.name[1]} characters.`;
  }

  const email = (values.email ?? '').trim();
  if (!email) {
    errors.email = 'Please enter your email address.';
  } else if (email.length > LIMITS.email[1] || !EMAIL_RE.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  const subject = collapse(values.subject ?? '');
  if (subject.length > LIMITS.subject[1]) {
    errors.subject = `Please keep the subject under ${LIMITS.subject[1]} characters.`;
  }

  const message = collapse(values.message ?? '');
  if (message.length < LIMITS.message[0]) {
    errors.message = `Please write at least ${LIMITS.message[0]} characters so I know what you need.`;
  } else if (message.length > LIMITS.message[1]) {
    errors.message = `Please keep your message under ${LIMITS.message[1]} characters.`;
  }

  return errors;
}

/** Field order — drives which field receives focus after a failed submit. */
export const FIELD_ORDER: Field[] = ['name', 'email', 'subject', 'message'];
