import { GradientBlob } from './GradientBlob';

export { GradientBlob };

export const GradientBlobMeta = {
  name: 'GradientBlob',
  displayName: 'Gradient Blob',
  description:
    'Ambient field of blurred, slowly-drifting colored shapes. The loop is seamless. Fills its hosting element.',
  props: {
    color1:       { type: 'color', defaultValueHint: '#FF6A50', description: 'First blob color' },
    color2:       { type: 'color', defaultValueHint: '#DDEA44', description: 'Second blob color' },
    color3:       { type: 'color', defaultValueHint: '#CEBEE3', description: 'Third blob color' },
    color4:       { type: 'color', defaultValueHint: '#FFAB7B', description: 'Fourth blob color' },
    blobCount:    { type: 'number', defaultValueHint: 4, description: 'Number of blobs' },
    blurAmount:   { type: 'number', defaultValueHint: 60, description: 'Blur radius (px)' },
    loopDuration: { type: 'number', defaultValueHint: 20, description: 'Loop duration (s)' },
    speed:        { type: 'number', defaultValueHint: 1, description: 'Speed multiplier' },
    seed:         { type: 'number', defaultValueHint: 1, description: 'Random seed for layout' },
    maxOpacity:   { type: 'number', defaultValueHint: 1, description: 'Max layer opacity (0–1)' },
    blendMode: {
      type: 'choice',
      options: ['normal', 'multiply', 'darken', 'overlay', 'screen', 'soft-light', 'color-burn'],
      defaultValueHint: 'normal',
    },
    isolateBlend: {
      type: 'boolean',
      defaultValueHint: true,
      description: 'Reset blend context: when on, the blend mode only affects the blobs inside this component. When off, blobs blend with whatever is behind on the page.',
    },
    animate: {
      type: 'choice',
      options: ['never', 'hover', 'always'],
      defaultValueHint: 'always',
      description: 'When the blobs drift. never: static. hover: loops while the host is hovered; eases to a stop on leave. always: continuous loop.',
    },
    easeDuration: { type: 'number', defaultValueHint: 0.8, description: 'Seconds over which the loop eases in/out when animate="hover"' },
  },
  importPath: '@/components/plasmic-components/GradientBlob',
};
