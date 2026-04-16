import { StickerPeel } from './StickerPeel';

export { StickerPeel };

export const StickerPeelMeta = {
  name: 'StickerPeel',
  displayName: 'Sticker Peel',
  description:
    'Wraps content in a vinyl-sticker effect. On hover/focus, the chosen corner curls up to reveal a paper-colored underside, with a soft drop shadow.',
  props: {
    children:        { type: 'slot', description: 'Sticker content' },
    peelCorner:      {
      type: 'choice',
      options: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      defaultValueHint: 'top-right',
      description: 'Which corner curls up on hover',
    },
    peelAmount:      { type: 'number', defaultValueHint: 0.3, description: 'How far the corner lifts (0–1)' },
    rotation:        { type: 'number', defaultValueHint: -2, description: 'Base rotation of the whole sticker (deg)' },
    shadowColor:     { type: 'string', defaultValueHint: 'rgba(32,27,42,0.25)', description: 'Drop-shadow color' },
    backgroundColor: { type: 'color', defaultValueHint: '#EADBC2', description: 'Paper-back color revealed under the peel' },
  },
  importPath: '@/components/plasmic-components/StickerPeel',
};
