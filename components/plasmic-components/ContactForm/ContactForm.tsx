import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { DataProvider } from '@plasmicapp/react-web/lib/host';
import {
  EMPTY_VALUES,
  FIELD_ORDER,
  validate,
  type ContactErrors,
  type ContactValues,
  type Field,
} from '@/lib/contact/validation';
import { removeStore, writeStore, type ContactStatus } from './store';
import styles from './ContactForm.module.css';

export interface ContactFormProps {
  /** Place your ContactField components, labels and layout here */
  children?: React.ReactNode;
  /** Shown in place of the form once a message has sent successfully */
  successContent?: React.ReactNode;
  /** Shown above the form when a submission fails for a non-field reason */
  errorContent?: React.ReactNode;
  /** Keep the form visible after a successful send instead of swapping in successContent */
  keepFormOnSuccess?: boolean;
  /** Endpoint the form posts to — leave as the default unless you have moved the route */
  endpoint?: string;
  className?: string;
}

interface ApiResponse {
  ok: boolean;
  errors?: ContactErrors;
  message?: string;
}

const GENERIC_ERROR = 'Something went wrong sending your message. Please try again shortly.';

export const ContactForm = React.memo(function ContactForm({
  children,
  successContent,
  errorContent,
  keepFormOnSuccess = false,
  endpoint = '/api/contact',
  className,
}: ContactFormProps) {
  const uid = useId();
  const domId = useMemo(() => `contact-${uid.replace(/:/g, '')}`, [uid]);

  const [values, setValues] = useState<ContactValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<ContactStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Fields blurred at least once. Errors only surface after a field has been
  // touched (or after a submit attempt), so the form does not scold someone
  // for a name they have not finished typing.
  const touched = useRef<Set<Field>>(new Set());
  const submitted = useRef(false);
  const inputs = useRef<Partial<Record<Field, HTMLElement | null>>>({});
  const token = useRef<string | null>(null);

  // Fetch the signed timestamp on mount. Its issue time is what proves the
  // form was open for a plausible interval before submission.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/contact/token')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { token?: string } | null) => {
        if (!cancelled && data?.token) token.current = data.token;
      })
      .catch(() => {
        // Non-fatal here — the submit surfaces the failure if it matters.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleErrors = useMemo(() => {
    if (submitted.current) return errors;
    const shown: ContactErrors = {};
    for (const field of FIELD_ORDER) {
      if (touched.current.has(field) && errors[field]) shown[field] = errors[field];
    }
    return shown;
  }, [errors]);

  const setField = useCallback((field: Field, value: string) => {
    setValues((prev) => {
      const next = { ...prev, [field]: value };
      // Re-validate as they type so a corrected field clears its error at once.
      setErrors(validate(next));
      return next;
    });
  }, []);

  const blurField = useCallback((field: Field) => {
    touched.current.add(field);
    // Touched state lives in a ref, so nudge React to recompute visibleErrors.
    setErrors((prev) => ({ ...prev }));
  }, []);

  const registerInput = useCallback((field: Field, el: HTMLElement | null) => {
    inputs.current[field] = el;
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (status === 'submitting') return;

      submitted.current = true;
      const found = validate(values);
      setErrors(found);

      if (Object.keys(found).length > 0) {
        setStatus('idle');
        setErrorMessage('');
        // Focus the first field with a problem, so keyboard and screen reader
        // users land directly on what needs fixing.
        const first = FIELD_ORDER.find((f) => found[f]);
        if (first) inputs.current[first]?.focus();
        return;
      }

      setStatus('submitting');
      setErrorMessage('');

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...values, company: '', token: token.current ?? '' }),
        });

        const data = (await res.json().catch(() => null)) as ApiResponse | null;

        if (res.ok && data?.ok) {
          setStatus('success');
          setValues(EMPTY_VALUES);
          setErrors({});
          touched.current.clear();
          submitted.current = false;
          return;
        }

        if (data?.errors && Object.keys(data.errors).length > 0) {
          setErrors(data.errors);
          setStatus('idle');
          const first = FIELD_ORDER.find((f) => data.errors?.[f]);
          if (first) inputs.current[first]?.focus();
          return;
        }

        setStatus('error');
        setErrorMessage(data?.message ?? GENERIC_ERROR);
      } catch {
        setStatus('error');
        setErrorMessage(GENERIC_ERROR);
      }
    },
    [endpoint, status, values],
  );

  // Publish to the module store on every render so ContactFields rendered in
  // Plasmic's separate slot root can read and write this state.
  writeStore(
    uid,
    { values, errors: visibleErrors, status, errorMessage, domId },
    { setField, blurField, registerInput },
  );

  useEffect(() => () => removeStore(uid), [uid]);

  const ctx = {
    status,
    values,
    errors: visibleErrors,
    errorMessage,
    isIdle: status === 'idle',
    isSubmitting: status === 'submitting',
    isSuccess: status === 'success',
    isError: status === 'error',
    hasErrors: Object.keys(visibleErrors).length > 0,
  };

  const showForm = !(status === 'success' && !keepFormOnSuccess);

  const statusText =
    status === 'submitting'
      ? 'Sending your message…'
      : status === 'success'
        ? 'Your message has been sent. Thank you.'
        : status === 'error'
          ? errorMessage || GENERIC_ERROR
          : '';

  return (
    <DataProvider name="contactFormId" data={uid}>
      <DataProvider name="contactForm" data={ctx}>
        {/* Announced on every state change, including when the visible change
            is purely stylistic. Always rendered so the region exists before
            the text arrives — screen readers ignore regions added mid-update. */}
        <div className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">
          {statusText}
        </div>

        {status === 'error' && errorContent}

        {showForm ? (
          <form
            className={[styles.form, className ?? ''].filter(Boolean).join(' ')}
            onSubmit={handleSubmit}
            noValidate
          >
            {/* Honeypot — hidden from people, irresistible to bots. */}
            <div className={styles.honeypot} aria-hidden="true">
              <label htmlFor={`${domId}-company`}>Company (leave this empty)</label>
              <input
                id={`${domId}-company`}
                name="company"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            {children}
          </form>
        ) : (
          <div className={className}>{successContent}</div>
        )}
      </DataProvider>
    </DataProvider>
  );
});
