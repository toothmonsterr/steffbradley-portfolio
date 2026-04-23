import { TypographyShuffle } from './TypographyShuffle';

export { TypographyShuffle };

export const TypographyShuffleMeta = {
  name: 'TypographyShuffle',
  displayName: 'Typography Shuffle',
  description: 'Text that scrambles through random fonts, sizes, weights, and spacing before easing into its final style. Set the final appearance via the style panel.',
  props: {
    text: {
      type: 'string',
      defaultValue: 'Toothmonster',
      description: 'The text to display and animate',
    },
    tag: {
      type: 'choice',
      options: ['p', 'h1', 'h2', 'h3', 'h4', 'span', 'div'],
      defaultValueHint: 'p',
      description: 'HTML element to render',
    },
    granularity: {
      type: 'choice',
      options: ['character', 'word', 'line'],
      defaultValueHint: 'character',
      description: 'character: each letter shuffles independently. word: each word shuffles as a unit. line: whole string shuffles at once.',
    },
    trigger: {
      type: 'choice',
      options: ['scroll', 'load', 'always'],
      defaultValueHint: 'scroll',
      description: 'scroll: fires when element enters viewport. load: fires on mount. always: shows final style with no animation (use in Plasmic Studio).',
    },
    duration: {
      type: 'number',
      defaultValueHint: 1.2,
      description: 'Animation duration per unit in seconds. Larger = slower settle.',
    },
    stagger: {
      type: 'number',
      defaultValueHint: 0.04,
      description: 'Delay between each unit starting in seconds. 0 = all at once.',
    },
    shuffleFamily: {
      type: 'boolean',
      defaultValueHint: true,
      description: 'Randomise font-family during shuffle',
    },
    shuffleSize: {
      type: 'boolean',
      defaultValueHint: true,
      description: 'Randomise font-size during shuffle',
    },
    shuffleWeight: {
      type: 'boolean',
      defaultValueHint: true,
      description: 'Randomise font-weight during shuffle',
    },
    shuffleSpacing: {
      type: 'boolean',
      defaultValueHint: true,
      description: 'Randomise letter-spacing during shuffle',
    },
    playOnce: {
      type: 'boolean',
      defaultValueHint: true,
      description: 'When on, the shuffle plays once and stays settled if the user scrolls back up',
    },
  },
  importPath: '@/components/plasmic-components/TypographyShuffle',
};
