import { CursorShadow } from './CursorShadow';

export { CursorShadow };

export const CursorShadowMeta = {
  name: 'CursorShadow',
  displayName: 'Cursor Shadow',
  description:
    'Page-scoped halftone shadow that follows the cursor globally. Place once in a full-page wrapper or in _app.tsx. Dots vary in size — large at the cursor, tapering to nothing at the spotlight edge. Use mix-blend-mode: multiply for a shadow effect over light content.',
  props: {
    dotColor: {
      type: 'color',
      description: 'Shadow dot color — dark + multiply = halftone shadow',
      defaultValueHint: '#201B2A',
    },
    step: {
      type: 'number',
      description: 'Grid cell size in px — smaller = denser dots',
      defaultValueHint: 12,
    },
    spotlightRadius: {
      type: 'number',
      description: 'Radius in px over which dots radiate from the cursor',
      defaultValueHint: 180,
    },
    maxOpacity: {
      type: 'number',
      description: 'Max canvas opacity when active (0–1)',
      defaultValueHint: 0.65,
    },
    blendMode: {
      type: 'choice',
      options: ['multiply', 'darken', 'overlay', 'screen', 'normal'],
      description: 'CSS mix-blend-mode — multiply darkens underlying content',
      defaultValueHint: 'multiply',
    },
    zIndex: {
      type: 'number',
      description: 'z-index for the fixed overlay',
      defaultValueHint: 9999,
    },
  },
  importPath: '@/components/plasmic-components/CursorShadow',
};
