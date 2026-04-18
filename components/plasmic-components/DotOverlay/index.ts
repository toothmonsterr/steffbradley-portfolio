import { DotOverlay } from './DotOverlay';

export { DotOverlay };

export const DotOverlayMeta = {
  name: 'DotOverlay',
  displayName: 'Dot Overlay',
  description:
    'Hard-edged dot grid where each dot grows near the cursor and shrinks far from it. Colors lerp A (at cursor) → B (far away).',
  props: {
    dotColorA:     { type: 'color', defaultValueHint: '#FF6A50', description: 'Dot color at the cursor' },
    dotColorB:     { type: 'color', defaultValueHint: '#DDEA44', description: 'Dot color far from the cursor' },
    step:          { type: 'number', defaultValueHint: 14, description: 'Grid cell size in px' },
    dotEdgeMin:    { type: 'number', defaultValueHint: 15, description: 'Min dot size as % of cell (far from cursor)' },
    dotEdgeMax:    { type: 'number', defaultValueHint: 45, description: 'Max dot size as % of cell (at cursor)' },
    falloffRadius: { type: 'number', defaultValueHint: 180, description: 'Distance from cursor over which dots fade from max → min (px)' },
    scale:         { type: 'number', defaultValueHint: 1, description: 'Zoom — multiplies step and falloff uniformly. 0.5 = small/dense; 2 = large/sparse.' },
    maxOpacity:    { type: 'number', defaultValueHint: 1, description: 'Max layer opacity (0–1)' },
    blendMode: {
      type: 'choice',
      options: ['normal', 'multiply', 'darken', 'overlay', 'screen', 'soft-light', 'color-burn'],
      defaultValueHint: 'normal',
    },
    trigger: {
      type: 'choice',
      options: ['hover', 'always', 'never'],
      defaultValueHint: 'hover',
    },
  },
  importPath: '@/components/plasmic-components/DotOverlay',
};
