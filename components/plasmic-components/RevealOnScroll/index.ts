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
    scrollMode: {
      type: 'choice',
      options: ['element', 'page'],
      defaultValueHint: 'element',
      description: 'element: reveal driven by the element\'s own position scrolling into view. page: reveal driven by raw page scroll offset in px — use for fixed/sticky elements like a header nav.',
    },
    triggerPoint: {
      type: 'number',
      defaultValueHint: 20,
      description: 'element mode: how far element has entered viewport before reveal starts (0–100). page mode: page scroll offset in px where reveal begins (e.g. 80 = after scrolling 80px).',
    },
    revealDuration: {
      type: 'number',
      defaultValueHint: 0.5,
      description: 'element mode: scroll distance in viewport heights (0.1 = snappy, 1.5 = slow). page mode: px of scroll over which the reveal completes (e.g. 120 = completes over 120px).',
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
