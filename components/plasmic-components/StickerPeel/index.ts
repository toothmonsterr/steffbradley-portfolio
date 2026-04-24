import { StickerPeel } from './StickerPeel';

export { StickerPeel };

export const StickerPeelMeta = {
  name: 'StickerPeel',
  displayName: 'Sticker Peel',
  description:
    'Wraps its children with a corner "peel" flap that lifts on hover (or sits permanently lifted) to reveal a gradient-shaded sticker back. Drop any content into the slot.',
  props: {
    children:       { type: 'slot',    description: 'Content rendered inside the sticker' },
    corner: {
      type: 'choice',
      options: ['top-right', 'top-left', 'bottom-right', 'bottom-left'],
      defaultValueHint: 'top-right',
      description: 'Which corner peels up',
    },
    peelSize:       { type: 'number',  defaultValueHint: 40,          description: 'Rest peel size in px' },
    hoverPeelSize:  { type: 'number',  defaultValueHint: 80,          description: 'Peel size on hover (or permanently, if trigger=always)' },
    backColor:      { type: 'color',   defaultValueHint: '#ffffff',   description: 'Color of the peel-back face (showing through the lifted flap)' },
    backdropColor:  { type: 'color',   defaultValueHint: 'transparent', description: 'Color visible inside the peeled-away region (behind the flap)' },
    shadowColor:    { type: 'color',   defaultValueHint: 'rgba(0,0,0,0.25)', description: 'Drop-shadow color cast by the peel flap' },
    shadowBlur:     { type: 'number',  defaultValueHint: 10,          description: 'Drop-shadow blur radius in px' },
    tilt:           { type: 'number',  defaultValueHint: 25,          description: '3D lift angle in degrees. 0 = flat. Try 15–45 for a believable curl.' },
    perspective:    { type: 'number',  defaultValueHint: 800,         description: '3D perspective depth in px. Lower = more dramatic foreshortening.' },
    trigger: {
      type: 'choice',
      options: ['hover', 'always', 'none'],
      defaultValueHint: 'hover',
      description: 'hover: peel grows on hover. always: permanently at hoverPeelSize. none: static at peelSize.',
    },
    easeDuration:   { type: 'number',  defaultValueHint: 0.4,         description: 'Transition duration in seconds' },
  },
  importPath: '@/components/plasmic-components/StickerPeel',
};
