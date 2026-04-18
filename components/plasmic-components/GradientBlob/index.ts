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
    hardEdges:          { type: 'boolean', defaultValueHint: false, description: 'Threshold the blurred composite alpha — crisp metaball silhouette instead of soft gradient' },
    hardEdgesContrast:  { type: 'number',  defaultValueHint: 18, description: 'Sharpness of the hard edge (only used when hardEdges is on). Higher = harder cut.' },
  },
  importPath: '@/components/plasmic-components/GradientBlob',
};
