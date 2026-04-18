import { StickerPeel } from './StickerPeel';

export { StickerPeel };

export const StickerPeelMeta = {
  name: 'StickerPeel',
  displayName: 'Sticker Peel',
  description:
    'Wraps content in a vinyl-sticker effect. On hover/focus, the chosen corner curls up to reveal a paper-colored underside, with optional tape strip, glossy shine, and inner shadow.',
  props: {
    children:        { type: 'slot', description: 'Sticker content' },
    peelCorner: {
      type: 'choice',
      options: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      defaultValueHint: 'top-right',
      description: 'Which corner curls up on hover',
    },
    peelSize:        { type: 'string', defaultValueHint: '22%', description: 'Peel size as a CSS length (e.g. "40px", "22%"). Kept square for realistic fold geometry.' },
    rotation:        { type: 'number', defaultValueHint: -2, description: 'Resting rotation of the sticker (deg)' },
    shadowColor:     { type: 'string', defaultValueHint: 'rgba(32,27,42,0.25)', description: 'Drop-shadow color of the sticker' },
    backgroundColor: { type: 'color', defaultValueHint: '#EADBC2', description: 'Paper-back color revealed under the peel' },
    tape:            { type: 'boolean', defaultValueHint: false, description: 'Show a tape strip across the top edge' },
    tapeColor:       { type: 'string', defaultValueHint: 'rgba(255, 255, 255, 0.5)', description: 'Tape color' },
    tapeOpacity:     { type: 'number', defaultValueHint: 0.85, description: 'Tape opacity (0–1)' },
    tapeWidth:       { type: 'string', defaultValueHint: '40%', description: 'Width of the tape strip (CSS length)' },
    shine:           { type: 'boolean', defaultValueHint: true, description: 'Glossy highlight on the peeled-up backside' },
    peelShadow:      { type: 'number', defaultValueHint: 0.3, description: 'Depth of the shadow on the underside of the peel (0–1)' },
  },
  importPath: '@/components/plasmic-components/StickerPeel',
};
