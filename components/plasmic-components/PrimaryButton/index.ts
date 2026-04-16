import { PrimaryButton } from './PrimaryButton';

export { PrimaryButton };

export const PrimaryButtonMeta = {
  name: 'PrimaryButton',
  displayName: 'Primary Button',
  props: {
    children: { type: 'slot', defaultValue: [{ type: 'text', value: 'hire me' }] },
    variant: {
      type: 'choice',
      options: ['primary', 'danger'],
      defaultValueHint: 'primary',
    },
    size: {
      type: 'choice',
      options: ['sm', 'md', 'lg'],
      defaultValueHint: 'md',
    },
    disabled: { type: 'boolean', defaultValueHint: false },
    href: { type: 'string', description: 'If set, renders as an <a> tag' },
    bgColor:   { type: 'color', description: 'Button background color' },
    textColor: { type: 'color', description: 'Button text color' },
    dotColorA: { type: 'color', description: 'Halftone dot color A (base → hover)' },
    dotColorB: { type: 'color', description: 'Halftone dot color B (blend target on hover)' },
  },
  importPath: '@/components/plasmic-components/PrimaryButton',
};
