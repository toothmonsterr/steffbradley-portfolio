# Contact form

A hand-written form component set registered for Plasmic Studio, plus a hardened
API route. The page itself is designed in Studio.

## Pieces

| Path | Role |
| --- | --- |
| `components/plasmic-components/ContactForm/` | Registered components: `ContactForm`, `ContactField`, `ContactSubmit` |
| `lib/contact/` | Validation, token signing, rate limiting, sanitisation, heuristics, origin check, email |
| `pages/api/contact.ts` | The submission endpoint |
| `pages/api/contact/token.ts` | Issues the signed timestamp |

## Wiring it up in Studio

1. Drop a **Contact Form** onto the page.
2. Inside it, add a **Contact Field** per field — set `field` to `name`, `email`,
   `subject`, `message`. Use `as: textarea` for the message.
3. Add a **Contact Submit Button**.
4. Fill the `successContent` slot with your thank-you state, and `errorContent`
   with a failure message (bind a text element to `$ctx.contactForm.errorMessage`).

`ContactForm` exposes `$ctx.contactForm`:

```
status        'idle' | 'submitting' | 'success' | 'error'
values        { name, email, subject, message }
errors        per-field messages, only for fields already touched
errorMessage  non-field failure text
isIdle / isSubmitting / isSuccess / isError / hasErrors
```

Style hooks: the error element carries `data-has-error="true"`, and the submit
button carries `data-is-submitting="true"`.

The components ship with no visual styling at all — that is deliberate, so
nothing fights your Studio design. Expect bare inputs until you style them.

## Anti-abuse layers

Run in this order in `pages/api/contact.ts`. Cheapest and least-leaky first.

| # | Layer | Behaviour on failure |
| --- | --- | --- |
| 1 | POST only | 405 |
| 2 | `Content-Type: application/json` + 16kb body cap | 400 generic |
| 3 | Origin/Referer match | 400 generic, real reason logged |
| 4 | Honeypot (`company` field) | **200 `{ok:true}`** — silent drop |
| 5 | Signed timestamp: min 3s dwell, max 1h age | Silent drop (except expiry, which asks the user to reload) |
| 6 | Rate limit: 3/hour per IP, 30/hour global | 429 + `Retry-After` |
| 7 | Server-side validation | 400 **with** field errors |
| 8 | Control-character rejection on header-bound fields | Silent drop |
| 9 | Content heuristics | Silent drop |
| 10 | Send via Resend | 500 generic |

**Only field-validation errors are ever returned.** Everything else is either a
generic message or a fake success. A bot that learns which layer it tripped
learns how to pass it, so the real reason is written to the server log only —
check the Vercel function logs, where lines are prefixed `[contact]`.

### Why each layer exists

- **Honeypot** — a hidden field positioned off-screen rather than
  `display:none`, because simpler bots skip the latter. Kept out of the tab
  order and the accessibility tree.
- **Signed timestamp** — HMAC-signed with `CONTACT_TOKEN_SECRET`, so dwell time
  cannot be back-dated. Stops instant-POST scripts and stale replays.
- **Rate limit** — the first entry of `x-forwarded-for` only; the rest of the
  chain is attacker-appendable. The global counter means a botnet rotating IPs
  still cannot flood the inbox or burn the Resend quota.
- **Control characters** — a CR/LF in a name or subject splices extra SMTP
  headers (`Bcc:`) into the outgoing mail. Rejected outright, never stripped.
- **Heuristics** — deliberately forgiving. A false positive silently loses a real
  client enquiry, which costs far more than one spam email. A single link and
  non-Latin script are both fine on their own.

### The phishing-specific rules

Three properties keep the form from becoming a tool for attacking other people:

1. **`to` is fixed from the environment**, never read from the request body. A
   user-supplied recipient is the definition of an open relay.
2. **`from` is always your own verified domain.** Putting the submitter's address
   there would be spoofing, would fail DMARC, and would wreck your sending
   reputation. Their address goes in `replyTo`, which is what makes Reply work.
3. **The email body is plain text.** No HTML means submitted content cannot
   render as a clickable lure inside a message that carries your domain's
   authentication.

Submitted content is also never echoed back into the page after sending.

## Setup

Copy `.env.example` to `.env.local` and fill it in. Then, in Resend:

1. Add and verify your sending domain.
2. Add the **SPF**, **DKIM** and **DMARC** records it gives you to your DNS.

Without those three records the notification mail lands in spam and your domain
can be spoofed by anyone. This is the one setup step that cannot be skipped.

`UPSTASH_REDIS_REST_URL` / `_TOKEN` are optional. Without them the rate limiter
falls back to in-process memory, which resets when a serverless instance goes
cold — the form still works, the limit is just best-effort. Logs show
`degraded=true` when the fallback served a request.

## Testing

Run `npm run dev` (**not** `--turbopack`; see the note in `next.config.ts`).

```bash
# Fetch a token, wait out the 3s dwell, then submit.
TOK=$(curl -s localhost:3000/api/contact/token | jq -r .token)
sleep 4

# Valid — expect 200 (or 500 if Resend is unconfigured, which proves it
# reached the send stage).
curl -i -X POST localhost:3000/api/contact \
  -H 'Content-Type: application/json' -H 'Origin: http://localhost:3000' \
  -d "{\"name\":\"Jane Cooper\",\"email\":\"jane@studio.com\",\"subject\":\"Hi\",
       \"message\":\"A message comfortably over the twenty character minimum.\",
       \"company\":\"\",\"token\":\"$TOK\"}"

# Honeypot filled     -> 200 {"ok":true}, no email, logged
# Header injection    -> 200 {"ok":true}, no email  ("name":"A\r\nBcc: victim@example.com")
# Bad origin          -> 400 generic
# 4 rapid submissions -> 4th is 429 with Retry-After
```

Set `x-forwarded-for` to vary the rate-limit bucket while testing. Appending to
the chain (`1.2.3.4, 8.8.8.8`) will not escape it — only the first entry counts.

Also check by hand: the received email's Reply goes to the submitter, and a
keyboard-only pass skips the honeypot and focuses the first invalid field.
