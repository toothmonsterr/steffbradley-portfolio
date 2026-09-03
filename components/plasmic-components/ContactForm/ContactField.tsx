import React, { useCallback, useEffect, useRef } from 'react';
import { DataProvider, useSelector } from '@plasmicapp/react-web/lib/host';
import { BaseTextField } from '@plasmicpkgs/react-aria/skinny/registerTextField';
import type { Field } from '@/lib/contact/validation';
import { useContactStore } from './store';

export interface ContactFieldProps {
  /** Which field the slotted input edits */
  field?: Field;
  /**
   * Your field UI — an Aria Text Field holding a Label and an Input. It picks
   * up the value, invalid and disabled state through Aria's context, so
   * nothing inside needs binding.
   */
  children?: React.ReactNode;
  /** Mark the field required in the browser (the server validates regardless) */
  required?: boolean;
  /** Hide the built-in error message — use when you render errors yourself */
  hideError?: boolean;
  /** Error content — bind text inside it to $ctx.contactField.error */
  errorContent?: React.ReactNode;
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

/**
 * Binds one field of a ContactForm to whatever you compose inside it.
 *
 * It renders no input or label of its own: an Aria Text Field in the slot
 * publishes value, invalid and disabled state to its own Label and Input
 * through React Aria's context, so the design lives entirely in Studio and
 * only the wiring lives here.
 */
export const ContactField = React.memo(function ContactField({
  field = 'name',
  children,
  required = false,
  hideError = false,
  errorContent,
  autoComplete,
  className,
}: ContactFieldProps) {
  // The form publishes its id through DataProvider; slot content reads it here
  // and pulls the live state out of the module store.
  const formId = useSelector('contactFormId') as string | undefined;
  const entry = useContactStore(formId);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const registerInput = entry?.actions.registerInput;

  // Register the DOM node so the form can focus this field when it fails
  // validation. The element belongs to the slotted Aria Input, so it is found
  // from the wrapper rather than through a ref we own.
  useEffect(() => {
    if (!registerInput) return;
    const node =
      wrapperRef.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        'input, textarea',
      ) ?? null;
    registerInput(field, node);
    return () => registerInput(field, null);
  }, [registerInput, field, children]);

  const handleBlur = useCallback(() => {
    entry?.actions.blurField(field);
  }, [entry, field]);

  // Aria's TextField hands back the string value, not a change event.
  const handleChange = useCallback(
    (next: string) => {
      entry?.actions.setField(field, next);
    },
    [entry, field],
  );

  // Outside a ContactForm (or on the Studio canvas before one is placed) there
  // is no state to bind to. Render the slot inertly so the design is still
  // visible and editable rather than collapsing to nothing.
  if (!entry) {
    return <div className={className}>{children}</div>;
  }

  const { values, errors, domId, status } = entry.state;
  const error = errors[field];
  const errorId = `${domId}-${field}-error`;
  // Exposed to errorContent so a text element can bind to $ctx.contactField.error
  const fieldCtx = { field, error: error ?? '', hasError: Boolean(error) };

  return (
    <div className={className} ref={wrapperRef}>
      <BaseTextField
        name={field}
        value={values[field]}
        onChange={handleChange}
        onBlur={handleBlur}
        isRequired={required}
        isDisabled={status === 'submitting'}
        isInvalid={Boolean(error)}
        autoComplete={[autoComplete ?? AUTOCOMPLETE[field]]}
      >
        {children}
      </BaseTextField>

      {/* The error node is always present so its id is a stable target; it
          simply holds no text when the field is valid. */}
      {!hideError ? (
        <span id={errorId} data-has-error={error ? 'true' : 'false'}>
          {errorContent ? (
            <DataProvider name="contactField" data={fieldCtx}>
              {errorContent}
            </DataProvider>
          ) : (
            error ?? ''
          )}
        </span>
      ) : null}
    </div>
  );
});
