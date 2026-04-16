import { StickyNav } from './StickyNav';

export { StickyNav };

export const StickyNavMeta = {
  name: 'StickyNav',
  displayName: 'Sticky Nav',
  props: {
    logo:            { type: 'slot', description: 'Logo or brand name element' },
    links:           { type: 'slot', description: 'Nav links and CTAs' },
    scrollThreshold: { type: 'number', defaultValueHint: 80, description: 'Scroll distance (px) before glass effect activates' },
    blurAmount:      { type: 'string', defaultValueHint: '16px', description: 'CSS blur amount for glass effect' },
  },
  importPath: '@/components/plasmic-components/StickyNav',
};
