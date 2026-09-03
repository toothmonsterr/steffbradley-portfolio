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
  // Studio decides a code component is stylable by looking for this; without it
  // the design panel refuses width, padding and layout on the form.
  styleSections: true,
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
    'Binds one field of a ContactForm to the design you place inside it. Must be placed inside a ContactForm. Put an Aria Text Field in the slot, with a Label and an Input inside that — they pick up the value, invalid and disabled state automatically, so nothing inside needs binding. Errors appear only after the field is blurred or the form is submitted; the error element carries data-has-error="true" so you can target it with a style variant.',
  // Styling here targets the field's outer wrapper — the input and label are
  // styled on the Aria components you place in the slot.
  styleSections: true,
  props: {
    field: {
      type: 'choice',
      options: ['name', 'email', 'subject', 'message'],
      defaultValueHint: 'name',
      description: 'Which field the slotted input edits',
    },
    children: {
      type: 'slot',
      description:
        'Your field UI — an Aria Text Field containing a Label and an Input (or TextArea for the message). Do not bind value or onChange on them; this component supplies both',
    },
    required: {
      type: 'boolean',
      defaultValueHint: false,
      description: 'Marks the field required in the browser. The server validates regardless of this setting',
    },
    errorContent: {
      type: 'slot',
      description: 'Error content — style the error text yourself. Bind a text element to $ctx.contactField.error; $ctx.contactField.hasError is true while the message is showing',
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
  styleSections: true,
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
