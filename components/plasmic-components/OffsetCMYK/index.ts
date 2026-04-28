import { OffsetCMYK } from './OffsetCMYK';

export { OffsetCMYK };

export const OffsetCMYKMeta = {
  name: 'OffsetCMYK',
  displayName: 'Offset CMYK',
  description:
    'Wraps any children — text, images, composed elements — and renders four offset ink plates (C/M/Y/K) of them. Drop a NextImage inside the slot for image-based separations. Note: separation is RGB-driven, so plain dark or monochrome content tends to land mostly on the K plate; works best with rich color content.',
  props: {
    children: { type: 'slot', description: 'Content to separate into CMYK plates' },

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

    channelContrast: { type: 'number', defaultValueHint: 1.4, description: 'Channel contrast. Higher = richer inks.' },

    interaction: {
      type: 'choice',
      options: ['hover', 'always', 'inverse', 'click'],
      defaultValueHint: 'hover',
    },
    jitter:       { type: 'number', defaultValueHint: 1.2, description: 'Sub-pixel wobble magnitude (px)' },
    easeDuration: { type: 'number', defaultValueHint: 0.6, description: 'Ease-in / ease-out duration for hover (s)' },
    texture: {
      type: 'choice',
      options: ['none', 'halftone', 'noise'],
      defaultValueHint: 'none',
    },
    textureStep:    { type: 'number', defaultValueHint: 4 },
    textureContrast: { type: 'number', defaultValueHint: 60 },
    textureHoverContrast: { type: 'number' },
    textureHoverEnabled: { type: 'boolean', defaultValueHint: true },
    textureProximityRadius: { type: 'number', defaultValueHint: 150 },
    textureHoverFeather: { type: 'number', defaultValueHint: 0.5 },
  },
  importPath: '@/components/plasmic-components/OffsetCMYK',
};
