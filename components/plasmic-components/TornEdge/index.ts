import { TornEdge } from './TornEdge';

export { TornEdge };

export const TornEdgeMeta = {
  name: 'TornEdge',
  displayName: 'Torn Edge',
  description:
    'Full-width SVG section divider with a procedurally torn paper edge. Seeded so the tear profile is deterministic and SSR-safe. Style shadows via Plasmic\'s built-in shadow controls.',
  props: {
    seed:      { type: 'number', defaultValueHint: 1,  description: 'Seed for the tear profile — different integers give different tear shapes' },
    roughness: { type: 'number', defaultValueHint: 20, description: 'Max vertical variation of the tear in px' },
    stepSize:  { type: 'number', defaultValueHint: 12, description: 'Horizontal distance between tear points — smaller = finer, more jagged tear' },
    height:    { type: 'number', defaultValueHint: 60, description: 'Total component height in px' },
    direction: {
      type: 'choice',
      options: ['down', 'up'],
      defaultValueHint: 'down',
      description: 'down: paper body fills the top, tear is at the bottom. up: paper body fills the bottom, tear is at the top.',
    },
    color: { type: 'color', defaultValueHint: '#FFFFFF', description: 'Paper fill color' },
  },
  importPath: '@/components/plasmic-components/TornEdge',
};
