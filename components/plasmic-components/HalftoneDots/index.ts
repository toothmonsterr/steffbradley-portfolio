import { HalftoneDots } from './HalftoneDots';

export { HalftoneDots };

export const HalftoneDotsMeta = {
  name: 'HalftoneDots',
  displayName: 'Halftone Dots',
  description:
    'Two rotated dot-screens layered together — classic CMYK-style halftone print. Upload an SVG to mask the dots to any shape.',
  props: {
    dotColorA:   { type: 'color', defaultValueHint: '#FF6A50', description: 'First ink color' },
    dotColorB:   { type: 'color', defaultValueHint: '#DDEA44', description: 'Second ink color' },
    layerAAngle: { type: 'number', defaultValueHint: 15, description: 'Rotation of layer A (deg) — classic CMYK uses 15°' },
    layerBAngle: { type: 'number', defaultValueHint: 75, description: 'Rotation of layer B (deg) — classic CMYK uses 75°' },
    step:        { type: 'number', defaultValueHint: 8, description: 'Grid cell size in px — smaller = denser' },
    dotSize:     { type: 'number', defaultValueHint: 40, description: 'Dot radius as % of cell (0–100)' },
    maxOpacity:  { type: 'number', defaultValueHint: 1, description: 'Max layer opacity (0–1)' },
    blendMode: {
      type: 'choice',
      options: ['normal', 'multiply', 'darken', 'overlay', 'screen', 'soft-light', 'color-burn'],
      defaultValueHint: 'multiply',
      description: 'Blend between the two ink layers',
    },
    isolateBlend: {
      type: 'boolean',
      defaultValueHint: false,
      description: 'Reset blend context: when on, the blend mode only affects the two ink layers inside this component. When off (default), the halftone blends with whatever is behind on the page.',
    },
    cursor: {
      type: 'choice',
      options: ['none', 'shift', 'pulse'],
      defaultValueHint: 'none',
      description: 'none: static. shift: layers misregister on hover. pulse: dots grow on hover.',
    },
    iconUrl: {
      type: 'imageUrl',
      description: 'Upload an SVG icon — the icon\'s shape becomes the dot silhouette',
    },
    iconSize: {
      type: 'string',
      defaultValueHint: '96px',
      description: 'Icon mask size as a CSS length (e.g. "96px", "40%")',
    },
    iconFollowsCursor: {
      type: 'boolean',
      defaultValueHint: false,
      description: 'Icon mask follows the cursor across the host (flashlight effect)',
    },
    trigger: {
      type: 'choice',
      options: ['hover', 'always', 'never'],
      defaultValueHint: 'hover',
      description: 'hover: fade in on hover of host. always: always on. never: hidden.',
    },
    easeDuration: {
      type: 'number',
      defaultValueHint: 0.45,
      description: 'Seconds for the shift/pulse ramp to ease in on hover and ease back out on leave',
    },
  },
  importPath: '@/components/plasmic-components/HalftoneDots',
};
