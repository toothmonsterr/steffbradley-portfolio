import { OffsetShape } from './OffsetShape';

export { OffsetShape };

export const OffsetShapeMeta = {
  name: 'OffsetShape',
  displayName: 'Offset Shape',
  description:
    'Shape-mask misregistration for buttons, text, and solid shapes. Duplicates the content into two ink layers (colorA / colorB) that flood its silhouette and drift apart. The intersection color is determined by the chosen blendMode. For photos, use Offset CMYK. For two independent image overlays, use Offset Image.',
  props: {
    children:     { type: 'slot', description: 'Content to duplicate into the two offset ink layers' },
    colorA:       { type: 'color', defaultValueHint: '#FF6A50', description: 'First ink color (negative-offset layer)' },
    colorB:       { type: 'color', defaultValueHint: '#DDEA44', description: 'Second ink color (positive-offset layer)' },
    offsetX:      { type: 'number', defaultValueHint: 4, description: 'Horizontal misregistration per layer in px' },
    offsetY:      { type: 'number', defaultValueHint: 3, description: 'Vertical misregistration per layer in px' },
    blendMode: {
      type: 'choice',
      options: ['multiply', 'darken', 'screen', 'overlay'],
      defaultValueHint: 'multiply',
      description: 'How the ink layers blend with each other',
    },
    interaction: {
      type: 'choice',
      options: ['hover', 'always', 'inverse'],
      defaultValueHint: 'hover',
      description: 'hover: misregistered at rest, eases into alignment on hover. always: permanently misregistered. inverse: aligned at rest, eases apart on hover.',
    },
    jitter:        { type: 'number', defaultValueHint: 1.2, description: 'Sub-pixel wobble magnitude for organic hand-printed feel (px)' },
    easeDuration:  { type: 'number', defaultValueHint: 0.6, description: 'Ease-in / ease-out duration for the hover transition (seconds)' },
    texture: {
      type: 'choice',
      options: ['none', 'halftone', 'noise'],
      defaultValueHint: 'none',
      description: 'Ink texture: none = solid fill, halftone = dot screen (layers at 15°/30°), noise = grain',
    },
    textureStep:    { type: 'number', defaultValueHint: 4,  description: 'Halftone cell size in px' },
    textureContrast: { type: 'number', defaultValueHint: 60, description: 'Texture contrast (0–100+): larger halftone dots / denser noise. Values above 100 let dots overlap for a heavy ink look.' },
    textureHoverContrast: { type: 'number', description: 'Halftone only. When set, dot size grows toward this value (%) as the cursor approaches. Leave blank to disable proximity effect.' },
    textureHoverEnabled: { type: 'boolean', defaultValueHint: true, description: 'Toggle the halftone hover proximity effect on or off.' },
    textureProximityRadius: { type: 'number', defaultValueHint: 150, description: 'Halftone hover: radius in px over which the dot-size effect ramps. Cursor inside this distance from the element edge triggers growth.' },
    textureHoverFeather: { type: 'number', defaultValueHint: 0.5, description: 'Halftone hover falloff curve. 0.5 = wide soft halo, 1 = linear, 2+ = tight concentrated spot at cursor.' },
  },
  importPath: '@/components/plasmic-components/OffsetShape',
};
