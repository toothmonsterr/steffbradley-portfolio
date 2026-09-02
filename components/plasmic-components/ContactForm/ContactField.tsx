import React, { useCallback, useEffect, useRef } from 'react';
import { useSelector } from '@plasmicapp/react-web/lib/host';
import type { Field } from '@/lib/contact/validation';
import { useContactStore } from './store';

export interface ContactFieldProps {
  /** Which field this input edits */
  field?: Field;
  /** Render a single-line input or a multi-line textarea */
  as?: 'input' | 'textarea';
  /** Visible label text — leave empty only if you supply your own labelled element */
  label?: string;
  /** Placeholder text shown inside the input */
  placeholder?: string;
  /** Rows for the textarea */
  rows?: number;
  /** Mark the field visually as required (the server validates regardless) */
  required?: boolean;
  /** Hide the built-in label — use when your design puts the label elsewhere */
  hideLabel?: boolean;
  /** Hide the built-in error message — use when you render errors yourself */
  hideError?: boolean;
  /** Autocomplete hint passed to the browser */
  autoComplete?: string;
  className?: string;
}

const AUTOCOMPLETE: Record<Field, string> = {
  name: 'name',
  email: 'email',
  subject: 'off',
  message: 'off',
};

const INPUT_TYPE: Record<Field, string> = {
  name: 'text',
  email: 'email',
  subject: 'text',
  message: 'text',
};

export const ContactField = React.memo(function ContactField({
  field = 'name',
  as = 'input',
  label,
  placeholder,
  rows = 6,
  required = false,
  hideLabel = false,
  hideError = false,
  autoComplete,
  className,
}: ContactFieldProps) {
  // The form publishes its id through DataProvider; slot content reads it here
  // and pulls the live state out of the module store.
  const formId = useSelector('contactFormId') as string | undefined;
  const entry = useContactStore(formId);
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const registerInput = entry?.actions.registerInput;

  // Register the DOM node so the form can focus this field when it fails
  // validation. Re-runs if the form remounts under a new id.
  useEffect(() => {
    if (!registerInput) return;
    registerInput(field, ref.current);
    return () => registerInput(field, null);
  }, [registerInput, field]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      entry?.actions.setField(field, e.target.value);
    },
    [entry, field],
  );

  const handleBlur = useCallback(() => {
    entry?.actions.blurField(field);
  }, [entry, field]);

  // Outside a ContactForm (or on the Studio canvas before one is placed) there
  // is no state to bind to. Render an inert preview so the component is still
  // visible and stylable rather than collapsing to nothing.
  if (!entry) {
    return (
      <div className={className}>
        {!hideLabel && label ? <label>{label}</label> : null}
        {as === 'textarea' ? (
          <textarea rows={rows} placeholder={placeholder} disabled />
        ) : (
          <input type="text" placeholder={placeholder} disabled />
        )}
      </div>
    );
  }

  const { values, errors, domId, status } = entry.state;
  const error = errors[field];
  const inputId = `${domId}-${field}`;
  const errorId = `${inputId}-error`;

  const shared = {
    id: inputId,
    name: field,
    value: values[field],
    onChange: handleChange,
    onBlur: handleBlur,
    placeholder,
    required,
    disabled: status === 'submitting',
    autoComplete: autoComplete ?? AUTOCOMPLETE[field],
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': error ? errorId : undefined,
  };

  return (
    <div className={className}>
      {!hideLabel && label ? <label htmlFor={inputId}>{label}</label> : null}

      {as === 'textarea' ? (
        <textarea
          {...shared}
          rows={rows}
          ref={ref as React.RefObject<HTMLTextAreaElement>}
        />
      ) : (
        <input
          {...shared}
          type={INPUT_TYPE[field]}
          ref={ref as React.RefObject<HTMLInputElement>}
        />
      )}

      {/* The error node is always present so aria-describedby has a stable
          target; it simply holds no text when the field is valid. */}
      {!hideError ? (
        <span id={errorId} data-has-error={error ? 'true' : 'false'}>
          {error ?? ''}
        </span>
      ) : null}
    </div>
  );
});
