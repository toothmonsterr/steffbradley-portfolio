import { NoiseMask } from './NoiseMask';

export { NoiseMask };

export const NoiseMaskMeta = {
  name: 'NoiseMask',
  displayName: 'Noise Mask',
  description:
    'Renders children through a binary noise grain SVG filter. The grain is clipped to the child\'s alpha so transparent areas stay transparent. Use as a standalone ink-texture effect on any content.',
  props: {
    src:           { type: 'imageUrl',                        description: 'Source image — dark areas receive more ink' },
    color:         { type: 'color',  defaultValueHint: '#000000', description: 'Ink color' },
    step:          { type: 'number', defaultValueHint: 4,     description: 'Grain coarseness — larger = chunkier grain' },
    contrast:      { type: 'number', defaultValueHint: 60,    description: 'Grain density (0–100) — higher = more pixels filled' },
    imageContrast: { type: 'number', defaultValueHint: 1.3,   description: 'Luminance contrast — higher = richer ink in dark areas. Negative values invert: light areas receive ink instead (use for light subjects on dark backgrounds).' },
    seed:          { type: 'number', defaultValueHint: 1,     description: 'Noise seed — different integers give different grain patterns' },
    blendMode: {
      type: 'choice',
      options: ['normal', 'multiply', 'darken', 'screen', 'overlay', 'soft-light'],
      defaultValueHint: 'normal',
      description: 'CSS mix-blend-mode applied to the filtered layer',
    },
  },
  importPath: '@/components/plasmic-components/NoiseMask',
};
