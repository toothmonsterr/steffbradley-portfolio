import { SecondaryButton } from './SecondaryButton';

export { SecondaryButton };

export const SecondaryButtonMeta = {
  name: 'SecondaryButton',
  displayName: 'Secondary Button',
  props: {
    children: { type: 'slot', defaultValue: [{ type: 'text', value: 'learn more' }] },
    size: {
      type: 'choice',
      options: ['sm', 'md', 'lg'],
      defaultValueHint: 'md',
    },
    disabled: { type: 'boolean', defaultValueHint: false },
    href: { type: 'string', description: 'If set, renders as an <a> tag' },
  },
  importPath: '@/components/plasmic-components/SecondaryButton',
};
