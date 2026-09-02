import React from 'react';
import { useSelector } from '@plasmicapp/react-web/lib/host';
import { useContactStore } from './store';

export interface ContactSubmitProps {
  /** Button content — usually a text element. Bind it to $ctx.contactForm.status for per-state copy. */
  children?: React.ReactNode;
  /** Fallback label used when no children are supplied */
  label?: string;
  /** Label shown while the message is being sent */
  submittingLabel?: string;
  className?: string;
}

/**
 * Submit button for a ContactForm.
 *
 * A real <button type="submit"> rather than a styled div, so Enter submits the
 * form from any field and assistive technology announces it correctly.
 */
export const ContactSubmit = React.memo(function ContactSubmit({
  children,
  label = 'Send message',
  submittingLabel = 'Sending…',
  className,
}: ContactSubmitProps) {
  const formId = useSelector('contactFormId') as string | undefined;
  const entry = useContactStore(formId);
  const isSubmitting = entry?.state.status === 'submitting';

  return (
    <button
      type="submit"
      className={className}
      disabled={isSubmitting}
      data-is-submitting={isSubmitting ? 'true' : 'false'}
      aria-busy={isSubmitting || undefined}
    >
      {children ?? (isSubmitting ? submittingLabel : label)}
    </button>
  );
});
