import { ScotchTape } from './ScotchTape';

export { ScotchTape };

export const ScotchTapeMeta = {
  name: 'ScotchTape',
  displayName: 'Scotch Tape',
  description:
    'A piece of translucent tape with serrated short edges. Drop content into the slot to label it (the tape body is translucent so children show through), or leave empty for pure decoration. Style background-color, drop-shadow, opacity, and size in the Design tab — the clip-path traces whatever silhouette your styling produces.',
  defaultStyles: {
    width:  '120px',
    height: '40px',
  },
  props: {
    children: {
      type: 'slot',
      description: 'Optional content under the tape — text, an image, or anything. Translucent tape body lets it show through.',
    },
    toothSize: {
      type: 'number',
      defaultValueHint: 8,
      description: 'Tooth size in px — distance between serration points along the short edges. Smaller = finer teeth.',
    },
    toothJitter: {
      type: 'number',
      defaultValueHint: 0.2,
      description: 'Per-tooth random height variation, 0–1. 0 = perfectly geometric, 0.5+ = more hand-torn.',
    },
    rotation: {
      type: 'number',
      defaultValueHint: -2,
      description: 'Slight tilt in degrees — real tape is rarely applied perfectly straight',
    },
  },
  importPath: '@/components/plasmic-components/ScotchTape',
};
