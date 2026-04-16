import { GradientBlob } from './GradientBlob';

export { GradientBlob };

export const GradientBlobMeta = {
  name: 'GradientBlob',
  displayName: 'Gradient Blob',
  description:
    'Ambient field of blurred, slowly-drifting colored shapes. The loop is seamless. Pairs well with NoiseOverlay (on by default) for a risograph feel.',
  props: {
    colorsText:     { type: 'string', description: 'Comma-separated list of colors (e.g. "#FF6A50, #DDEA44, #CEBEE3")', defaultValueHint: '#FF6A50, #DDEA44, #CEBEE3, #FFAB7B' },
    blobCount:      { type: 'number', defaultValueHint: 4, description: 'Number of blobs' },
    blurAmount:     { type: 'number', defaultValueHint: 80, description: 'Blur radius in px' },
    loopDuration:   { type: 'number', defaultValueHint: 20, description: 'Loop duration in seconds' },
    speed:          { type: 'number', defaultValueHint: 1, description: 'Speed multiplier' },
    width:          { type: 'string', defaultValueHint: '100%' },
    height:         { type: 'string', defaultValueHint: '400px' },
    noise:          { type: 'boolean', defaultValueHint: true, description: 'Overlay noise grain' },
    noiseIntensity: { type: 'number', defaultValueHint: 0.15, description: 'Noise opacity (0–1), only used when noise is on' },
    seed:           { type: 'number', defaultValueHint: 1, description: 'Random seed for blob positions — same seed = same layout' },
  },
  importPath: '@/components/plasmic-components/GradientBlob',
};
