import { RevealOnScroll } from './RevealOnScroll';

export { RevealOnScroll };

export const RevealOnScrollMeta = {
  name: 'RevealOnScroll',
  displayName: 'Reveal on Scroll',
  description:
    'Wraps slot content and transitions it from blurry, desaturated, and grainy to its normal clean state as it scrolls into view.',
  props: {
    children: {
      type: 'slot',
      defaultValue: [{ type: 'text', value: 'Drop content here' }],
    },
    blurAmount: {
      type: 'number',
      defaultValueHint: 12,
      description: 'Max blur in px — organic, noise-displaced (not a clean Gaussian)',
    },
    displaceAmount: {
      type: 'number',
      defaultValueHint: 30,
      description: 'Max displacement scale — controls how noisy/wavy the blur looks',
    },
    noiseIntensity: {
      type: 'number',
      defaultValueHint: 0.5,
      description: 'Max grain overlay opacity at the start of the reveal (0–1)',
    },
    endRatio: {
      type: 'number',
      defaultValueHint: 0.35,
      description: 'Viewport fraction (0–1) where reveal completes — 0.1 = fast, 0.7 = slow long reveal',
    },
    grainSize: {
      type: 'number',
      defaultValueHint: 1.2,
      description: 'Noise grain size — larger = chunkier grain',
    },
    noiseColor: {
      type: 'color',
      defaultValueHint: '#201B2A',
      description: 'Grain overlay color',
    },
    trigger: {
      type: 'choice',
      options: ['scroll', 'always'],
      defaultValueHint: 'scroll',
      description:
        'scroll: reveal as element scrolls into view. always: fully revealed — use in Plasmic Studio to preview content.',
    },
  },
  importPath: '@/components/plasmic-components/RevealOnScroll',
};
