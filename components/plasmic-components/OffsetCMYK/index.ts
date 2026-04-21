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
      options: ['hover', 'always', 'inverse', 'click'],
      defaultValueHint: 'hover',
    },
    jitter:       { type: 'number', defaultValueHint: 1.2, description: 'Sub-pixel wobble magnitude (px)' },
    easeDuration: { type: 'number', defaultValueHint: 0.6, description: 'Ease-in / ease-out duration for hover (s)' },
    texture: {
      type: 'choice',
      options: ['none', 'halftone', 'noise'],
      defaultValueHint: 'none',
      description: 'Ink texture: none = solid channel fill, halftone = dot screen at standard screen angles (15°/30°/45°/60°), noise = grain',
    },
    textureStep:    { type: 'number', defaultValueHint: 4,  description: 'Halftone cell size in px' },
    textureContrast: { type: 'number', defaultValueHint: 60, description: 'Texture contrast (0–100+): larger halftone dots / denser noise. Values above 100 let dots overlap for a heavy ink look.' },
    textureHoverContrast: { type: 'number', description: 'Halftone only. When set, dot size grows toward this value (%) as the cursor approaches. Leave blank to disable proximity effect.' },
    textureHoverEnabled: { type: 'boolean', defaultValueHint: true, description: 'Toggle the halftone hover proximity effect on or off.' },
    textureProximityRadius: { type: 'number', defaultValueHint: 150, description: 'Halftone hover: radius in px over which the dot-size effect ramps. Cursor inside this distance from the element edge triggers growth.' },
    textureHoverFeather: { type: 'number', defaultValueHint: 0.5, description: 'Halftone hover falloff curve. 0.5 = wide soft halo, 1 = linear, 2+ = tight concentrated spot at cursor.' },
  },
  importPath: '@/components/plasmic-components/OffsetCMYK',
};
