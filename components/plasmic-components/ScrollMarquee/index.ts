import { ScrollMarquee } from './ScrollMarquee';

export { ScrollMarquee };

export const ScrollMarqueeMeta = {
  name: 'ScrollMarquee',
  displayName: 'Scroll Marquee',
  description: 'Infinite horizontal marquee. Drops any children into a seamlessly-looping track; media children auto-fit the marquee height.',
  props: {
    children:     { type: 'slot', description: 'Content to repeat. Images/SVGs/videos auto-size to height.' },
    speed:        { type: 'number', defaultValueHint: 80, description: 'Base speed in px/s at rest' },
    direction:    { type: 'choice', options: ['left', 'right'], defaultValueHint: 'left' },
    pauseOnHover: { type: 'boolean', defaultValueHint: true },
    gap:          { type: 'number', defaultValueHint: 0, description: 'Gap between items in px' },
    height:       { type: 'string', defaultValueHint: '126px', description: 'Marquee height (e.g. "126px", "8rem")' },
  },
  importPath: '@/components/plasmic-components/ScrollMarquee',
};
