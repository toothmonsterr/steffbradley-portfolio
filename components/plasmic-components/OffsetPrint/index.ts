import { OffsetPrint } from './OffsetPrint';

export { OffsetPrint };

export const OffsetPrintMeta = {
  name: 'OffsetPrint',
  displayName: 'Offset Print',
  description:
    'Print-misregistration effect. Children are duplicated into two color-tinted layers that drift apart at rest and "register" (snap into alignment) on hover, with organic sub-pixel jitter. Set overlapColor to paint the intersection of the two layers with a third color.',
  props: {
    children:     { type: 'slot', description: 'Content to duplicate into offset color layers' },
    colorA:       { type: 'color', defaultValueHint: '#FF6A50', description: 'Color for the first ink layer' },
    colorB:       { type: 'color', defaultValueHint: '#DDEA44', description: 'Color for the second ink layer' },
    overlapColor: { type: 'color', description: 'Optional color for the overlapping region (the "third color")' },
    offsetX:      { type: 'number', defaultValueHint: 4, description: 'Horizontal misregistration per layer in px' },
    offsetY:      { type: 'number', defaultValueHint: 3, description: 'Vertical misregistration per layer in px' },
    blendMode:    {
      type: 'choice',
      options: ['multiply', 'darken', 'screen', 'overlay'],
      defaultValueHint: 'multiply',
      description: 'How the two color layers blend with each other',
    },
    interaction:  {
      type: 'choice',
      options: ['hover', 'always', 'inverse'],
      defaultValueHint: 'hover',
      description: 'hover: misregistered at rest, snaps together on hover. always: permanently misregistered. inverse: aligned at rest, bumps apart on hover.',
    },
    jitter:       { type: 'number', defaultValueHint: 1.2, description: 'Sub-pixel wobble magnitude for organic hand-printed feel (px)' },
    showBase:     { type: 'boolean', defaultValueHint: false, description: 'Show the original un-tinted layer underneath' },
  },
  importPath: '@/components/plasmic-components/OffsetPrint',
};
