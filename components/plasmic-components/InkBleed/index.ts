import { InkBleed } from './InkBleed';

export { InkBleed };

export const InkBleedMeta = {
  name: 'InkBleed',
  displayName: 'Ink Bleed',
  description:
    'Wraps any slot and makes its edges bleed outward like ink soaking into paper. A noise mask breaks the bleed into a rough paper-fiber pattern. The original content sits on top of the bleed layer.',
  props: {
    children:       { type: 'slot', description: 'Content to apply the ink bleed to' },
    bleedColor:     { type: 'color', defaultValueHint: '#201B2A', description: 'Ink bleed color' },
    spread:         { type: 'number', defaultValueHint: 8,    description: 'How far the ink spreads from the content edge in px' },
    softness:       { type: 'number', defaultValueHint: 4,    description: 'Blur softness of the spread — higher = more diffuse, feathered bleed' },
    noiseFrequency: { type: 'number', defaultValueHint: 0.08, description: 'Paper fiber scale — lower = chunkier chunks, higher = finer grain' },
    noiseThreshold: { type: 'number', defaultValueHint: 0.5,  description: 'Fiber sparseness 0–1: 0 = dense saturation, 1 = very sparse, barely-there bleed' },
    blendMode: {
      type: 'choice',
      options: ['normal', 'multiply', 'darken', 'screen', 'overlay'],
      defaultValueHint: 'normal',
      description: 'How the bleed layer blends with elements behind it',
    },
    isolateBlend: {
      type: 'boolean',
      defaultValueHint: true,
      description: 'Reset blend context: when on, the blend mode only affects content inside this component. When off, the bleed blends with whatever is behind on the page.',
    },
  },
  importPath: '@/components/plasmic-components/InkBleed',
};
