import { DotOverlay } from './DotOverlay';

export { DotOverlay };

export const DotOverlayMeta = {
  name: 'DotOverlay',
  displayName: 'Dot Overlay',
  description: 'Absolute-fill dot pattern layer. Drop inside any element — it hooks into the parent\'s hover state automatically.',
  props: {
    dotColorA: {
      type: 'color',
      description: 'Dot color at rest / start of hover ramp',
      defaultValueHint: '#FF6A50',
    },
    dotColorB: {
      type: 'color',
      description: 'Dot color at peak hover (blend target)',
      defaultValueHint: '#DDEA44',
    },
    dotSize: {
      type: 'string',
      description: 'Dot grid cell size — any CSS length (e.g. 0.6em, 10px)',
      defaultValueHint: '0.6em',
    },
    maxOpacity: {
      type: 'number',
      description: 'Opacity when fully visible (0–1)',
      defaultValueHint: 1,
    },
    trigger: {
      type: 'choice',
      options: ['hover', 'always', 'never'],
      description: 'hover = shows on parent hover | always = always on (good for editing) | never = hidden',
      defaultValueHint: 'hover',
    },
  },
  importPath: '@/components/plasmic-components/DotOverlay',
};
