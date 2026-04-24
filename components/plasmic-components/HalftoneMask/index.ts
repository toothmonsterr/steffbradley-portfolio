import { HalftoneMask } from './HalftoneMask';

export { HalftoneMask };

export const HalftoneMaskMeta = {
  name: 'HalftoneMask',
  displayName: 'Halftone Mask',
  description:
    'Renders children through a halftone dot screen SVG filter. The dots are clipped to the child\'s alpha so transparent areas stay transparent. Use as a standalone ink-texture effect on any content.',
  props: {
    src:           { type: 'imageUrl',                        description: 'Source image — dark areas receive more ink' },
    width:         { type: 'number', defaultValueHint: 800,   description: 'Intrinsic image width (px) — improves Next.js optimization and layout stability' },
    height:        { type: 'number', defaultValueHint: 600,   description: 'Intrinsic image height (px) — improves Next.js optimization and layout stability' },
    priority:      { type: 'boolean', defaultValueHint: false, description: 'Mark as high-priority (above-the-fold) to disable lazy loading' },
    quality:       { type: 'number', description: 'Image quality 1–100 (default 75)' },
    color:         { type: 'color',  defaultValueHint: '#000000', description: 'Ink color' },
    step:          { type: 'number', defaultValueHint: 4,     description: 'Cell size in px — smaller = finer dot screen' },
    contrast:      { type: 'number', defaultValueHint: 60,    description: 'Dot size as % of cell (0–100)' },
    imageContrast: { type: 'number', defaultValueHint: 1.3,   description: 'Luminance contrast — higher = richer ink in dark areas. Negative values invert: light areas receive ink instead (use for light subjects on dark backgrounds).' },
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
    hoverContrast: { type: 'number', description: 'Dot size (%) to animate toward on hover. Leave blank to disable hover animation.' },
    easeDuration:  { type: 'number', defaultValueHint: 0.4, description: 'Ease duration in seconds for the hover dot-size transition' },
    blendMode: {
      type: 'choice',
      options: ['normal', 'multiply', 'darken', 'screen', 'overlay', 'soft-light'],
      defaultValueHint: 'normal',
      description: 'CSS mix-blend-mode applied to the filtered layer',
    },
  },
  importPath: '@/components/plasmic-components/HalftoneMask',
};
