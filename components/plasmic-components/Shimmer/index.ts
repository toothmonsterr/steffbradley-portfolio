import { Shimmer } from './Shimmer';

export { Shimmer };

export const ShimmerMeta = {
  name: 'Shimmer',
  displayName: 'Shimmer',
  description:
    'Animated skeleton-loader fill that stretches to its parent. Drop into a CmsQueryRepeater loading slot, or any container you want to look "loading". Size by setting the parent width/height (or set width/height on this component).',
  defaultStyles: {
    width:  '100%',
    height: '16px',
  },
  props: {
    baseColor: {
      type: 'color',
      defaultValueHint: 'rgba(0, 0, 0, 0.06)',
      description: 'Base (resting) color of the block',
    },
    highlightColor: {
      type: 'color',
      defaultValueHint: 'rgba(255, 255, 255, 0.6)',
      description: 'Color of the moving highlight band',
    },
    durationSec: {
      type: 'number',
      defaultValueHint: 1.4,
      description: 'Animation duration in seconds',
    },
    radius: {
      type: 'number',
      defaultValueHint: 6,
      description: 'Border radius in px',
    },
    angleDeg: {
      type: 'number',
      defaultValueHint: 90,
      description: 'Sweep angle in degrees — 90 = left→right, 180 = top→bottom',
    },
  },
  importPath: '@/components/plasmic-components/Shimmer',
};
