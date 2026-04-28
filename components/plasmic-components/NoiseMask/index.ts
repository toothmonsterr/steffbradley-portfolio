import { NoiseMask } from './NoiseMask';

export { NoiseMask };

export const NoiseMaskMeta = {
  name: 'NoiseMask',
  displayName: 'Noise Mask',
  description:
    'Wraps any content (text, images, composed elements) in a binary noise grain filter. Drop a NextImage inside the slot for image-based grain, or any other content for typographic effects.',
  props: {
    children:      { type: 'slot', description: 'Content to grain — text, images, etc.' },
    color:         { type: 'color',  defaultValueHint: '#000000', description: 'Ink color' },
    step:          { type: 'number', defaultValueHint: 4,     description: 'Grain coarseness — larger = chunkier grain' },
    contrast:      { type: 'number', defaultValueHint: 60,    description: 'Grain density (0–100)' },
    imageContrast: { type: 'number', defaultValueHint: 1.3,   description: 'Luminance contrast — higher = richer ink in dark areas. Negative inverts.' },
    seed:          { type: 'number', defaultValueHint: 1,     description: 'Noise seed — change for different grain patterns' },
    blendMode: {
      type: 'choice',
      options: ['normal', 'multiply', 'darken', 'screen', 'overlay', 'soft-light'],
      defaultValueHint: 'normal',
    },
    isolateBlend: {
      type: 'boolean',
      defaultValueHint: false,
      description: 'Reset blend context: when on, blend mode only affects content inside this component.',
    },
  },
  importPath: '@/components/plasmic-components/NoiseMask',
};
