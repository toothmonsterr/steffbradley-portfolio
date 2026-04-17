import { OffsetPrint } from './OffsetPrint';

export { OffsetPrint };

export const OffsetPrintMeta = {
  name: 'OffsetPrint',
  displayName: 'Offset Print',
  description:
    'Print-misregistration effect. Two color-tinted ink layers drift apart at rest and snap into alignment on hover. Use shape mode for buttons and solid shapes; image mode for photos and icons/SVGs.',
  props: {
    children:      { type: 'slot', description: 'Content to duplicate into offset ink layers' },
    colorA:        { type: 'color', defaultValueHint: '#FF6A50', description: 'First ink color' },
    colorB:        { type: 'color', defaultValueHint: '#DDEA44', description: 'Second ink color' },
    offsetX:       { type: 'number', defaultValueHint: 4, description: 'Horizontal misregistration per layer in px' },
    offsetY:       { type: 'number', defaultValueHint: 3, description: 'Vertical misregistration per layer in px' },
    blendMode: {
      type: 'choice',
      options: ['multiply', 'darken', 'screen', 'overlay'],
      defaultValueHint: 'multiply',
      description: 'How the ink layers blend with the backdrop',
    },
    interaction: {
      type: 'choice',
      options: ['hover', 'always', 'inverse'],
      defaultValueHint: 'hover',
      description: 'hover: misregistered at rest, snaps together on hover. always: permanently misregistered. inverse: aligned at rest, bumps apart on hover.',
    },
    jitter:   { type: 'number', defaultValueHint: 1.2, description: 'Sub-pixel wobble magnitude for organic feel (px)' },
    mode: {
      type: 'choice',
      options: ['shape', 'image'],
      defaultValueHint: 'shape',
      description: 'shape: floods the element silhouette — use for buttons and solid shapes. image: luminance separation — use for photos, icons, and SVGs.',
    },
    imageContrast:  { type: 'number', defaultValueHint: 1.3, description: 'image mode only — contrast of dark→ink mapping. Higher = deeper blacks.' },
    showOriginal:   { type: 'boolean', defaultValueHint: true, description: 'Show the original content on top of the ink layers. Default true for shape mode (keeps text readable), false for image mode. Disable for icons when you only want the ink copies.' },
  },
  importPath: '@/components/plasmic-components/OffsetPrint',
};
