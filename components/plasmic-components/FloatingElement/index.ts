import { FloatingElement } from './FloatingElement';

export { FloatingElement };

export const FloatingElementMeta = {
  name: 'FloatingElement',
  displayName: 'Floating Element',
  description: 'Wraps its children in a gentle float + rotate loop. Style and position the wrapper in Plasmic.',
  props: {
    children:           { type: 'slot', description: 'Content to animate' },
    animationAmplitude: { type: 'number', defaultValueHint: 12, description: 'Float distance in px' },
    animationDuration:  { type: 'number', defaultValueHint: 4,  description: 'Float cycle duration in seconds' },
  },
  importPath: '@/components/plasmic-components/FloatingElement',
};
