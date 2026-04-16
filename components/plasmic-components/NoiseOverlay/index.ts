import { NoiseOverlay } from './NoiseOverlay';

export { NoiseOverlay };

export const NoiseOverlayMeta = {
  name: 'NoiseOverlay',
  displayName: 'Noise Overlay',
  description:
    'Overlays SVG-filter noise grain on its children. Use for risograph/print texture. Set fullscreen to cover the viewport.',
  props: {
    children:   { type: 'slot', description: 'Content beneath the noise' },
    intensity:  { type: 'number', defaultValueHint: 0.25, description: 'Noise opacity (0–1)' },
    grainSize:  { type: 'number', defaultValueHint: 1.2,  description: 'Grain size in px. Larger = chunkier' },
    color:      { type: 'color',  defaultValueHint: '#201B2A', description: 'Grain color' },
    blendMode:  {
      type: 'choice',
      options: ['multiply', 'overlay', 'soft-light', 'darken', 'screen', 'normal'],
      defaultValueHint: 'multiply',
    },
    animate:    { type: 'boolean', defaultValueHint: false, description: 'Flicker the grain at ~12fps (film-gate)' },
    seed:       { type: 'number',  defaultValueHint: 0, description: 'Fixed seed for the grain. Change to shift pattern.' },
    fullscreen: { type: 'boolean', defaultValueHint: false, description: 'Fix the overlay to the viewport' },
    zIndex:     { type: 'number',  description: 'z-index for the overlay layer' },
  },
  importPath: '@/components/plasmic-components/NoiseOverlay',
};
