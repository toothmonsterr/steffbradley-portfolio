import { CursorDots } from './CursorDots';

export { CursorDots };

export const CursorDotsMeta = {
  name: 'CursorDots',
  displayName: 'Cursor Dots',
  description:
    'True halftone ramp that follows the cursor. Drop inside any element — dots radiate from the cursor position, large at center and tapering to nothing at the spotlight edge. Parent needs position:relative and overflow:hidden.',
  props: {
    dotColorA: {
      type: 'color',
      description: 'Dot color at the cursor center',
      defaultValueHint: '#FF6A50',
    },
    dotColorB: {
      type: 'color',
      description: 'Dot color at the spotlight edge',
      defaultValueHint: '#DDEA44',
    },
    step: {
      type: 'number',
      description: 'Grid cell size in px — smaller = denser dots',
      defaultValueHint: 14,
    },
    spotlightRadius: {
      type: 'number',
      description: 'Radius in px over which dots radiate from the cursor',
      defaultValueHint: 140,
    },
    maxOpacity: {
      type: 'number',
      description: 'Max canvas opacity (0–1)',
      defaultValueHint: 1,
    },
    trigger: {
      type: 'choice',
      options: ['hover', 'always', 'never'],
      description:
        'hover = activates on parent hover | always = always visible (use while editing) | never = hidden',
      defaultValueHint: 'hover',
    },
  },
  importPath: '@/components/plasmic-components/CursorDots',
};
