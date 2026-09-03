import { PaperTexture } from './PaperTexture';

export { PaperTexture };

export const PaperTextureMeta = {
  name: 'PaperTexture',
  displayName: 'Paper Texture',
  description:
    'Overlays a paper-grain texture that masks content to transparency. Unlike Noise Mask / Halftone Mask / Offset CMYK, this keeps the original colours — it only removes pixels, so a photo or GIF stays full-colour with a rough, printed-on-paper edge.',
  props: {
    children: { type: 'slot', description: 'Content to texture — image, GIF, text. Colours are preserved.' },
    step: {
      type: 'number',
      defaultValueHint: 3,
      description: 'Grain coarseness — larger = chunkier flecks',
    },
    coverage: {
      type: 'number',
      defaultValueHint: 80,
      description: 'How much content survives (0–100). 100 = untouched, lower eats away more.',
    },
    softness: {
      type: 'number',
      defaultValueHint: 0,
      description: 'Softens knocked-out edges (px). 0 = hard screenprint flecks.',
    },
    lumaBias: {
      type: 'number',
      defaultValueHint: 0,
      description: 'Bias by brightness. 0 = uniform, positive = bites into darks (ink starved), negative = bites into highlights.',
    },
    seed: {
      type: 'number',
      defaultValueHint: 1,
      description: 'Noise seed — change for a different sheet of paper',
    },
    animate: {
      type: 'boolean',
      defaultValueHint: false,
      description:
        'Animate the grain. Leave off for best performance — a static seed lets the browser cache the filter. Automatically disabled on touch devices and under reduced-motion.',
    },
  },
  importPath: '@/components/plasmic-components/PaperTexture',
};
