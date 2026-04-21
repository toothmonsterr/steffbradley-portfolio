import { RevealOnScroll } from './RevealOnScroll';

export { RevealOnScroll };

export const RevealOnScrollMeta = {
  name: 'RevealOnScroll',
  displayName: 'Reveal on Scroll',
  description:
    'Wraps slot content and transitions it from blurry, desaturated, and organic to its normal clean state as it scrolls into view. Add a NoiseOverlay in the slot for grain texture.',
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
    warpSize: {
      type: 'number',
      defaultValueHint: 1,
      description: 'Size of the warp turbulence — larger = broader waves, smaller = tighter ripple',
    },
    startOpacity: {
      type: 'number',
      defaultValueHint: 0,
      description: 'Opacity at rest before the reveal begins (0–1)',
    },
    endRatio: {
      type: 'number',
      defaultValueHint: 0.35,
      description: 'Viewport fraction (0–1) where reveal completes — 0.1 = fast, 0.7 = slow long reveal',
    },
    playOnce: {
      type: 'boolean',
      defaultValueHint: false,
      description: 'When on, the reveal plays once and stays revealed if the user scrolls back up',
    },
    trigger: {
      type: 'choice',
      options: ['scroll', 'load', 'always'],
      defaultValueHint: 'scroll',
      description:
        'scroll: reveal as element scrolls into view. load: reveal once on mount. always: fully revealed — use in Plasmic Studio to preview content.',
    },
  },
  importPath: '@/components/plasmic-components/RevealOnScroll',
};
