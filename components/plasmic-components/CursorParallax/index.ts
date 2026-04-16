import { CursorParallax } from './CursorParallax';

export { CursorParallax };

export const CursorParallaxMeta = {
  name: 'CursorParallax',
  displayName: 'Cursor Parallax',
  description:
    'Translates stacked children by the cursor’s offset from center, with each child moving at a different depth. Drop multiple children inside — the first is the background (slowest), the last is the foreground (fastest). Use reverse to flip that order.',
  props: {
    children:    { type: 'slot', description: 'One layer per child. Order determines depth.' },
    intensity:   { type: 'number', defaultValueHint: 30, description: 'Max pixel travel for the deepest layer' },
    depthScale:  { type: 'number', defaultValueHint: 1, description: '0 = uniform movement; 1 = arithmetic depth ramp; >1 emphasizes separation' },
    reverse:     { type: 'boolean', defaultValueHint: false, description: 'Reverse depth order — later children become background' },
    mode:        {
      type: 'choice',
      options: ['hover', 'global'],
      defaultValueHint: 'hover',
      description: 'hover: only tracks pointer inside the container. global: tracks pointer anywhere on the page',
    },
    smoothing:   { type: 'number', defaultValueHint: 0.15, description: 'Per-frame lerp toward target (0–1). Higher = snappier.' },
    perspective: { type: 'number', defaultValueHint: 0, description: 'Enable 3D depth with Z translation when > 0 (px)' },
    ambientIdle: { type: 'boolean', defaultValueHint: false, description: 'Layers slowly drift when no cursor input' },
  },
  importPath: '@/components/plasmic-components/CursorParallax',
};
