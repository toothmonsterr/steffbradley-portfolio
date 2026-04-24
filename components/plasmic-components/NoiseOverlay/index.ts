import { NoiseOverlay } from './NoiseOverlay';

export { NoiseOverlay };

export const NoiseOverlayMeta = {
  name: 'NoiseOverlay',
  displayName: 'Noise Overlay',
  description:
    'SVG-filter grain that fills its hosting element. Use for risograph/print texture.',
  props: {
    intensity:  { type: 'number', defaultValueHint: 0.25, description: 'Noise opacity (0–1)' },
    grainSize:  { type: 'number', defaultValueHint: 1.2,  description: 'Grain size in px. Larger = chunkier' },
    color:      { type: 'color',  defaultValueHint: '#201B2A', description: 'Grain color' },
    blendMode:  {
      type: 'choice',
      options: ['multiply', 'overlay', 'soft-light', 'darken', 'screen', 'normal'],
      defaultValueHint: 'multiply',
    },
    isolateBlend: {
      type: 'boolean',
      defaultValueHint: false,
      description: 'Reset blend context: when on, the blend mode only affects content inside this component. When off (default), the grain blends with whatever is behind on the page.',
    },
    animate: {
      type: 'choice',
      options: ['never', 'hover', 'always'],
      defaultValueHint: 'never',
      description: 'When the grain flickers. never: static. hover: only while the host is hovered. always: continuous.',
    },
    seed:       { type: 'number',  defaultValueHint: 0, description: 'Fixed seed for the grain. Change to shift pattern.' },
  },
  importPath: '@/components/plasmic-components/NoiseOverlay',
};
