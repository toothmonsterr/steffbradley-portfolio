import { ScrollMarquee } from './ScrollMarquee';

export { ScrollMarquee };

export const ScrollMarqueeMeta = {
  name: 'ScrollMarquee',
  displayName: 'Scroll Marquee',
  props: {
    speed:        { type: 'number', defaultValueHint: 80, description: 'Base speed in px/s at rest' },
    direction:    { type: 'choice', options: ['left', 'right'], defaultValueHint: 'left' },
    pauseOnHover: { type: 'boolean', defaultValueHint: true },
    gap:          { type: 'number', defaultValueHint: 48, description: 'Gap between repeated items in px' },
  },
  importPath: '@/components/plasmic-components/ScrollMarquee',
};
