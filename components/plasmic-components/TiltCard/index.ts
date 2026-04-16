import { TiltCard } from './TiltCard';

export { TiltCard };

export const TiltCardMeta = {
  name: 'TiltCard',
  displayName: 'Tilt Card',
  description:
    '3D tilt wrapper that responds to cursor position. Set idleMode to breathe for a gentle auto-tilt when idle, or reactToGlobalCursor to respond even when the cursor is not over the card.',
  props: {
    children:            { type: 'slot', description: 'Card content' },
    maxTiltX:            { type: 'number', defaultValueHint: 20, description: 'Max X-axis tilt (deg). Higher = more dramatic 3D.' },
    maxTiltY:            { type: 'number', defaultValueHint: 20, description: 'Max Y-axis tilt (deg). Higher = more dramatic 3D.' },
    perspective:         { type: 'number', defaultValueHint: 600, description: 'Perspective distance (px). LOWER = more dramatic 3D depth.' },
    scaleOnHover:        { type: 'number', defaultValueHint: 1.04, description: 'Scale multiplier on hover' },
    idleMode:            {
      type: 'choice',
      options: ['rest', 'breathe'],
      defaultValueHint: 'rest',
      description: 'rest: flat when idle. breathe: gentle auto-tilt loop when idle',
    },
    breatheAmplitude:    { type: 'number', defaultValueHint: 4, description: 'Idle breathe amplitude (deg)' },
    breatheDuration:     { type: 'number', defaultValueHint: 6, description: 'Idle breathe cycle duration (s)' },
    reactToGlobalCursor: { type: 'boolean', defaultValueHint: false, description: 'Tilt toward pointer even when not hovered' },
  },
  importPath: '@/components/plasmic-components/TiltCard',
};
