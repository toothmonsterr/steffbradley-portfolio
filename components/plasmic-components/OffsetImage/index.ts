import { OffsetImage } from './OffsetImage';

export { OffsetImage };

export const OffsetImageMeta = {
  name: 'OffsetImage',
  displayName: 'Offset Image',
  description:
    'Two independent image slots overlaid with misregistration. Each slot is tinted via luminance separation — dark areas absorb the ink color while light areas stay clear — ideal for photos and images. For solid shapes and text use Offset Shape instead.',
  props: {
    slotA:  { type: 'slot', description: 'First plate content (negatively offset)' },
    slotB:  { type: 'slot', description: 'Second plate content (positively offset)' },

    tintSlots:     { type: 'boolean', defaultValueHint: false, description: 'When on, each slot is tinted via luminance separation using colorA/colorB. When off, slots render in their natural colors.' },
    colorA:        { type: 'color', defaultValueHint: '#FF6A50', description: 'Ink color for slot A (used when tintSlots is on)' },
    colorB:        { type: 'color', defaultValueHint: '#DDEA44', description: 'Ink color for slot B (used when tintSlots is on)' },
    imageContrast: { type: 'number', defaultValueHint: 1.3, description: 'Contrast of the luminance tint — higher = richer ink, deeper shadows (used when tintSlots is on)' },

    offsetX:   { type: 'number', defaultValueHint: 4, description: 'Horizontal misregistration per layer (px)' },
    offsetY:   { type: 'number', defaultValueHint: 3, description: 'Vertical misregistration per layer (px)' },
    blendMode: {
      type: 'choice',
      options: ['normal', 'multiply', 'darken', 'screen', 'overlay'],
      defaultValueHint: 'multiply',
    },
    interaction: {
      type: 'choice',
      options: ['hover', 'always', 'inverse'],
      defaultValueHint: 'hover',
      description: 'hover: misregistered at rest, eases into alignment on hover. always: permanently misregistered. inverse: aligned at rest, eases apart on hover.',
    },
    jitter:        { type: 'number', defaultValueHint: 1.2, description: 'Sub-pixel wobble magnitude (px)' },
    easeDuration:  { type: 'number', defaultValueHint: 0.6, description: 'Ease-in / ease-out duration for the hover transition (seconds)' },
    texture: {
      type: 'choice',
      options: ['none', 'halftone', 'noise'],
      defaultValueHint: 'none',
      description: 'Ink texture: none = solid luminance tint, halftone = dot screen, noise = grain',
    },
    textureStep:    { type: 'number', defaultValueHint: 4,  description: 'Halftone cell size in px' },
    textureContrast: { type: 'number', defaultValueHint: 60, description: 'Texture contrast (0–100+): larger halftone dots / denser noise. Values above 100 let dots overlap for a heavy ink look.' },
    textureHoverContrast: { type: 'number', description: 'Halftone only. When set, dot size grows toward this value (%) as the cursor approaches. Leave blank to disable proximity effect. Requires tintSlots to be on.' },
    textureProximityRadius: { type: 'number', defaultValueHint: 150, description: 'Halftone hover: radius in px over which the dot-size effect ramps. Cursor inside this distance from the element edge triggers growth.' },
  },
  importPath: '@/components/plasmic-components/OffsetImage',
};
