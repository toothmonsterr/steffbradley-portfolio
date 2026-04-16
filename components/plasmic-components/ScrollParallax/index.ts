import { ScrollParallax } from './ScrollParallax';

export { ScrollParallax };

export const ScrollParallaxMeta = {
  name: 'ScrollParallax',
  displayName: 'Scroll Parallax',
  description:
    'Translates its children based on scroll position as they cross the viewport. Pair with other layers to build depth.',
  props: {
    children: { type: 'slot', description: 'Content to translate on scroll' },
    speed:    { type: 'number', defaultValueHint: 0.3, description: 'Translation speed. Negative reverses direction; 0 disables.' },
    axis:     { type: 'choice', options: ['y', 'x'], defaultValueHint: 'y' },
    clamp:    { type: 'boolean', defaultValueHint: true, description: 'Clamp translation at viewport entry/exit' },
  },
  importPath: '@/components/plasmic-components/ScrollParallax',
};
