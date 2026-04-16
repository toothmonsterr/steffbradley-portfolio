import { FloatingElement } from './FloatingElement';

export { FloatingElement };

export const FloatingElementMeta = {
  name: 'FloatingElement',
  displayName: 'Floating Element',
  props: {
    children:           { type: 'slot', description: 'Optional content inside the floating shape' },
    top:                { type: 'string', description: 'CSS top value (e.g. "10%", "80px")' },
    left:               { type: 'string' },
    right:              { type: 'string' },
    bottom:             { type: 'string' },
    width:              { type: 'string', defaultValueHint: '200px' },
    height:             { type: 'string', defaultValueHint: '200px' },
    backgroundColor:    { type: 'string', defaultValueHint: 'var(--color-lavender)' },
    borderRadius:       { type: 'string', defaultValueHint: '50%' },
    zIndex:             { type: 'number', defaultValueHint: -1 },
    animationAmplitude: { type: 'number', defaultValueHint: 12, description: 'Float distance in px' },
    animationDuration:  { type: 'number', defaultValueHint: 4,  description: 'Float cycle duration in seconds' },
  },
  importPath: '@/components/plasmic-components/FloatingElement',
};
