import { ContactField } from './ContactField';

export { ContactField };

export const ContactFieldMeta = {
  name: 'ContactField',
  displayName: 'Contact Field',
  props: {
    label: { type: 'string', defaultValueHint: 'your name' },
    type: {
      type: 'choice',
      options: ['text', 'email', 'tel', 'textarea'],
      defaultValueHint: 'text',
    },
    placeholder: { type: 'string' },
    required: { type: 'boolean', defaultValueHint: false },
    name: { type: 'string' },
    error: { type: 'string', description: 'Validation error message to display' },
  },
  importPath: '@/components/plasmic-components/ContactField',
};
