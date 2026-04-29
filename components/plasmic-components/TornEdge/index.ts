import { TornEdge } from './TornEdge';

export { TornEdge };

export const TornEdgeMeta = {
  name: 'TornEdge',
  displayName: 'Torn Edge',
  description:
    'Full-width SVG section divider with a procedurally torn paper edge. ' +
    'Set color to match the section above, backgroundColor to match the section below.',
  props: {
    roughness: { type: 'number', defaultValueHint: 20, description: 'Max vertical variation of the tear in px' },
    stepSize:  { type: 'number', defaultValueHint: 12, description: 'Horizontal distance between tear points — smaller = finer, more jagged' },
    height:    { type: 'number', defaultValueHint: 60, description: 'Total component height in px' },
    direction: {
      type: 'choice',
      options: ['down', 'up'],
      defaultValueHint: 'down',
      description: 'down: paper body fills the top, tear at the bottom. up: paper body fills the bottom, tear at the top.',
    },
    color: {
      type: 'color',
      defaultValueHint: '#FFFFFF',
      description: 'Paper fill color — match the section above (direction: down) or below (direction: up)',
    },
    backgroundColor: {
      type: 'color',
      defaultValueHint: 'transparent',
      description: 'Fill on the opposite side of the tear — match the adjacent section\'s background',
    },
    shadowColor: {
      type: 'color',
      defaultValueHint: '#000000',
      description: 'Shadow color',
    },
    shadowOpacity: {
      type: 'number',
      defaultValueHint: 0.25,
      description: 'Shadow opacity (0–1)',
    },
    shadowBlur: {
      type: 'number',
      defaultValueHint: 8,
      description: 'Shadow blur radius in px',
    },
    shadowX: {
      type: 'number',
      defaultValueHint: 0,
      description: 'Shadow horizontal offset in px',
    },
    shadowY: {
      type: 'number',
      defaultValueHint: 4,
      description: 'Shadow vertical offset in px — positive = down, negative = up',
    },
  },
  importPath: '@/components/plasmic-components/TornEdge',
};
