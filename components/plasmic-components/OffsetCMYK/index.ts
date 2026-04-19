import { OffsetCMYK } from './OffsetCMYK';

export { OffsetCMYK };

export const OffsetCMYKMeta = {
  name: 'OffsetCMYK',
  displayName: 'Offset CMYK',
  description:
    'Four-plate CMYK-style print separation. Upload one source image and the component auto-extracts its Cyan / Magenta / Yellow / Key channels, paints each with an ink color, and offsets them in a diamond pattern for classic print misregistration. Respects source alpha — transparent areas stay transparent on every plate.',
  props: {
    sourceImage: {
      type: 'imageUrl',
      description: 'Source image to separate into CMYK channels',
    },

    colorC: { type: 'color', defaultValueHint: '#00AEEF', description: 'Cyan ink color' },
    colorM: { type: 'color', defaultValueHint: '#EC008C', description: 'Magenta ink color' },
    colorY: { type: 'color', defaultValueHint: '#FFF200', description: 'Yellow ink color' },
    colorK: { type: 'color', defaultValueHint: '#000000', description: 'Key (black) ink color' },

    offsetX: { type: 'number', defaultValueHint: 4, description: 'Horizontal misregistration per plate (px)' },
    offsetY: { type: 'number', defaultValueHint: 3, description: 'Vertical misregistration per plate (px)' },

    blendMode: {
      type: 'choice',
      options: ['multiply', 'darken', 'screen', 'overlay'],
      defaultValueHint: 'multiply',
    },

    channelContrast: {
      type: 'number',
      defaultValueHint: 1.4,
      description: 'Channel contrast. Higher = richer inks, deeper shadows.',
    },

    interaction: {
      type: 'choice',
      options: ['hover', 'always', 'inverse'],
      defaultValueHint: 'hover',
    },
    jitter:       { type: 'number', defaultValueHint: 1.2, description: 'Sub-pixel wobble magnitude (px)' },
    easeDuration: { type: 'number', defaultValueHint: 0.6, description: 'Ease-in / ease-out duration for hover (s)' },
  },
  importPath: '@/components/plasmic-components/OffsetCMYK',
};
