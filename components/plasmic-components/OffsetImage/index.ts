import { OffsetImage } from './OffsetImage';

export { OffsetImage };

export const OffsetImageMeta = {
  name: 'OffsetImage',
  displayName: 'Offset Image',
  description:
    'Two independent content slots overlaid with misregistration. Drop two different images (or any content) to create a two-plate offset effect. By default slots render in their natural colors; enable tintSlots to paint each slot with its own ink color.',
  props: {
    slotA:  { type: 'slot', description: 'First plate content (negatively offset)' },
    slotB:  { type: 'slot', description: 'Second plate content (positively offset)' },

    tintSlots: {
      type: 'boolean',
      defaultValueHint: false,
      description: 'Off (default): slots render in their natural colors. On: each slot is tinted with its ink color.',
    },
    colorA: { type: 'color', defaultValueHint: '#FF6A50', description: 'Tint for slot A (used when tintSlots is on)' },
    colorB: { type: 'color', defaultValueHint: '#DDEA44', description: 'Tint for slot B (used when tintSlots is on)' },
    mode: {
      type: 'choice',
      options: ['shape', 'image'],
      defaultValueHint: 'shape',
      description: 'Tint strategy (when tintSlots is on). shape: flood the slot silhouette. image: luminance separation.',
    },
    imageContrast: { type: 'number', defaultValueHint: 1.3, description: 'Contrast curve for image tint mode (higher = deeper blacks)' },

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
  },
  importPath: '@/components/plasmic-components/OffsetImage',
};
