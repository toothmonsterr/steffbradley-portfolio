import type { ContactValues } from './validation';

// ---------------------------------------------------------------------------
// Content heuristics.
//
// Scores a submission for spam signals. Deliberately FORGIVING: a false
// positive silently discards a real client enquiry, which costs far more than
// letting one spam email through. Nothing here fires on a plainly-written
// message, and no single soft signal is enough to reject on its own.
// ---------------------------------------------------------------------------

/** Reject at or above this score. Tuned so two soft signals are not enough. */
export const SPAM_THRESHOLD = 5;

const URL_RE = /\b(?:https?:\/\/|www\.)\S+/gi;

// Bare domains like "example.com/path" that skip the scheme.
const BARE_DOMAIN_RE = /\b[a-z0-9-]+\.(?:com|net|org|ru|cn|top|xyz|io|biz|info|shop|club)\b/gi;

// Non-global twins for `.test()`. A /g regex carries `lastIndex` between calls,
// so reusing the global ones for tests yields alternating true/false results.
const URL_TEST = new RegExp(URL_RE.source, 'i');
const BARE_DOMAIN_TEST = new RegExp(BARE_DOMAIN_RE.source, 'i');

// Phrases from the standard cold-outreach spam corpus. Matched as whole
// phrases, not single words, so ordinary sentences do not trip them.
const SPAM_PHRASES = [
  'seo services', 'search engine optimi', 'guest post', 'backlink',
  'link building', 'domain authority', 'increase your traffic',
  'first page of google', 'rank higher', 'web design services',
  'crypto', 'bitcoin', 'forex', 'binary option', 'investment opportunity',
  'make money online', 'work from home', 'nigerian', 'inheritance',
  'viagra', 'cialis', 'casino', 'loan offer', 'wire transfer',
  'bulk email', 'email list', 'leads database', 'we can help you rank',
];

function countMatches(value: string, re: RegExp): number {
  return (value.match(re) ?? []).length;
}

/** Ratio of Cyrillic/CJK/Arabic characters to total non-space characters. */
function nonLatinRatio(value: string): number {
  const stripped = value.replace(/\s/g, '');
  if (!stripped.length) return 0;
  const nonLatin = countMatches(
    stripped,
    /[\u0400-\u04ff\u4e00-\u9fff\u3040-\u30ff\u0600-\u06ff]/g,
  );
  return nonLatin / stripped.length;
}

export interface HeuristicResult {
  score: number;
  /** Signal names that fired — for server-side logging only, never returned. */
  signals: string[];
}

export function scoreSubmission(values: ContactValues): HeuristicResult {
  const signals: string[] = [];
  let score = 0;

  const { name, email, subject, message } = values;
  const haystack = `${subject} ${message}`.toLowerCase();

  const linkCount =
    countMatches(message, URL_RE) + countMatches(message, BARE_DOMAIN_RE);

  // A genuine first enquiry occasionally includes one link (their site).
  // Three or more is a pitch.
  if (linkCount >= 3) {
    score += 4;
    signals.push(`links:${linkCount}`);
  } else if (linkCount === 2) {
    score += 1;
    signals.push('links:2');
  }

  // A link in the name or subject line is near-certain spam — there is no
  // legitimate reason for a URL to appear in either.
  if (URL_TEST.test(name) || BARE_DOMAIN_TEST.test(name)) {
    score += 5;
    signals.push('link-in-name');
  }
  if (URL_TEST.test(subject) || BARE_DOMAIN_TEST.test(subject)) {
    score += 4;
    signals.push('link-in-subject');
  }

  // Non-latin script alone is perfectly legitimate — plenty of real people
  // write in Russian or Chinese. Combined with a link it is bulk spam.
  if (nonLatinRatio(message) > 0.6 && linkCount > 0) {
    score += 4;
    signals.push('non-latin+link');
  }

  const phraseHits = SPAM_PHRASES.filter((p) => haystack.includes(p));
  if (phraseHits.length) {
    score += phraseHits.length >= 2 ? 5 : 2;
    signals.push(`phrases:${phraseHits.join('|')}`);
  }

  // Shouting through the whole message, where it is long enough to be meaningful.
  const letters = message.replace(/[^a-z]/gi, '');
  if (letters.length > 40) {
    const upper = countMatches(message, /[A-Z]/g) / letters.length;
    if (upper > 0.7) {
      score += 2;
      signals.push('all-caps');
    }
  }

  // Filler submissions where the message is just the name echoed back, or the
  // same address pasted into every box.
  if (message.toLowerCase() === name.toLowerCase()) {
    score += 3;
    signals.push('message-equals-name');
  }
  if (message.toLowerCase().includes(email.toLowerCase()) && message.length < 60) {
    score += 2;
    signals.push('message-is-email');
  }

  return { score, signals };
}

export function isLikelySpam(values: ContactValues): HeuristicResult & { spam: boolean } {
  const result = scoreSubmission(values);
  return { ...result, spam: result.score >= SPAM_THRESHOLD };
}
