import { HalftoneMask } from './HalftoneMask';

export { HalftoneMask };

export const HalftoneMaskMeta = {
  name: 'HalftoneMask',
  displayName: 'Halftone Mask',
  description:
    'Wraps any content (text, images, composed elements) in a halftone dot screen filter. Drop a NextImage inside the slot for image-based halftones, or any other content for typographic effects.',
  props: {
    children:      { type: 'slot', description: 'Content to halftone — text, images, etc.' },
    color:         { type: 'color',  defaultValueHint: '#000000', description: 'Ink color' },
    step:          { type: 'number', defaultValueHint: 4,   description: 'Cell size in px — smaller = finer dot screen' },
    contrast:      { type: 'number', defaultValueHint: 60,  description: 'Dot size as % of cell (0–100)' },
    imageContrast: { type: 'number', defaultValueHint: 1.3, description: 'Luminance contrast — higher = richer ink in dark areas. Negative inverts.' },
    angleIndex: {
      type: 'choice',
      options: [
        { value: 0, label: '15°' },
        { value: 1, label: '30°' },
        { value: 2, label: '45°' },
        { value: 3, label: '60°' },
      ],
      defaultValueHint: 0,
      description: 'Screen angle — standard print angles 15/30/45/60°',
    },
    hoverContrast: { type: 'number', description: 'Dot size (%) to animate toward on hover. Leave blank to disable.' },
    easeDuration:  { type: 'number', defaultValueHint: 0.4, description: 'Ease duration in seconds for the hover dot-size transition' },
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
  importPath: '@/components/plasmic-components/HalftoneMask',
};
