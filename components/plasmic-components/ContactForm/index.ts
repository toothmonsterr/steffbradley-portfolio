export { ContactForm } from './ContactForm';
export type { ContactFormProps } from './ContactForm';

export { ContactField } from './ContactField';
export type { ContactFieldProps } from './ContactField';

export { ContactSubmit } from './ContactSubmit';
export type { ContactSubmitProps } from './ContactSubmit';

export type { ContactFormState, ContactStatus } from './store';

export const ContactFormMeta = {
  name: 'ContactForm',
  displayName: 'Contact Form',
  description:
    'Owns the contact form state, validation and submission. Drop ContactField components inside for each field, plus a ContactSubmit button. Exposes $ctx.contactForm with: status, values, errors, errorMessage, isIdle, isSubmitting, isSuccess, isError, hasErrors — bind text to these or add style variants on them. Includes a hidden anti-spam field automatically; do not remove it.',
  providesData: true,
  props: {
    children: {
      type: 'slot',
      description: 'Your form layout — place a ContactField for each of name, email, subject and message, plus a ContactSubmit button',
    },
    successContent: {
      type: 'slot',
      description: 'Replaces the form after a message sends successfully — design your thank-you state here',
    },
    errorContent: {
      type: 'slot',
      description: 'Shown above the form when sending fails. Bind a text element to $ctx.contactForm.errorMessage',
    },
    keepFormOnSuccess: {
      type: 'boolean',
      defaultValueHint: false,
      description: 'Keep the form on screen after a successful send instead of swapping in successContent',
    },
    endpoint: {
      type: 'string',
      defaultValueHint: '/api/contact',
      description: 'API route the form posts to — leave as the default unless the route has been moved',
    },
  },
  importPath: '@/components/plasmic-components/ContactForm',
};

export const ContactFieldMeta = {
  name: 'ContactField',
  displayName: 'Contact Field',
  description:
    'One input in a ContactForm. Must be placed inside a ContactForm. Set which field it edits, then style the label, input and error text. Errors appear only after the field is blurred or the form is submitted; the error element carries data-has-error="true" so you can target it with a style variant.',
  props: {
    field: {
      type: 'choice',
      options: ['name', 'email', 'subject', 'message'],
      defaultValueHint: 'name',
      description: 'Which field this input edits',
    },
    as: {
      type: 'choice',
      options: ['input', 'textarea'],
      defaultValueHint: 'input',
      description: 'Use textarea for the message field',
    },
    label: {
      type: 'string',
      description: 'Visible label text — always provide one unless you supply your own labelled element',
    },
    placeholder: {
      type: 'string',
      description: 'Placeholder text inside the input. Not a substitute for a label',
    },
    rows: {
      type: 'number',
      defaultValueHint: 6,
      description: 'Visible rows when using a textarea',
    },
    required: {
      type: 'boolean',
      defaultValueHint: false,
      description: 'Marks the field required in the browser. The server validates regardless of this setting',
    },
    hideLabel: {
      type: 'boolean',
      defaultValueHint: false,
      description: 'Hide the built-in label — only use this if you are labelling the input another way',
    },
    hideError: {
      type: 'boolean',
      defaultValueHint: false,
      description: 'Hide the built-in error text — use if you render errors yourself from $ctx.contactForm.errors',
    },
    autoComplete: {
      type: 'string',
      description: 'Override the browser autocomplete hint (defaults are set sensibly per field)',
    },
  },
  importPath: '@/components/plasmic-components/ContactForm',
};

export const ContactSubmitMeta = {
  name: 'ContactSubmit',
  displayName: 'Contact Submit Button',
  description:
    'Submit button for a ContactForm. Must be placed inside a ContactForm. Disables itself while sending and carries data-is-submitting="true" for a style variant. Leave the slot empty to use the label props, or add your own content and bind it to $ctx.contactForm.status.',
  props: {
    children: {
      type: 'slot',
      description: 'Button content. Leave empty to use the label props below',
    },
    label: {
      type: 'string',
      defaultValueHint: 'Send message',
      description: 'Fallback label when the slot is empty',
    },
    submittingLabel: {
      type: 'string',
      defaultValueHint: 'Sending…',
      description: 'Fallback label shown while sending',
    },
  },
  importPath: '@/components/plasmic-components/ContactForm',
};
