import { NextImage } from './NextImage';

export { NextImage };

export const NextImageMeta = {
  name: 'NextImage',
  displayName: 'Image',
  description:
    'Next.js optimised image with WebP/AVIF output, lazy loading, and blur-up placeholders. ' +
    'For fill mode: set the parent container to position: relative with explicit dimensions in Plasmic.',
  props: {
    src: {
      type: 'imageUrl',
      description: 'Image source — upload or paste a URL. Files in /public can be referenced as /images/photo.webp.',
    },
    alt: {
      type: 'string',
      defaultValue: '',
      description: 'Alt text for accessibility (leave blank for decorative images)',
    },
    fill: {
      type: 'boolean',
      defaultValueHint: false,
      description:
        'Fill mode: image stretches to cover its parent. Parent must have position: relative and a defined size.',
    },
    width: {
      type: 'number',
      defaultValueHint: 800,
      description: 'Intrinsic width in px (ignored in fill mode)',
    },
    height: {
      type: 'number',
      defaultValueHint: 600,
      description: 'Intrinsic height in px (ignored in fill mode)',
    },
    objectFit: {
      type: 'choice',
      options: ['cover', 'contain', 'fill', 'none', 'scale-down'],
      defaultValueHint: 'cover',
      description: 'How the image fits within its box',
    },
    objectPosition: {
      type: 'string',
      defaultValueHint: 'center',
      description: 'Focal point — e.g. "top", "center", "50% 20%"',
    },
    priority: {
      type: 'boolean',
      defaultValueHint: false,
      description: 'Disable lazy loading — use for above-the-fold hero images',
    },
    quality: {
      type: 'number',
      defaultValueHint: 75,
      description: 'Output quality 1–100. Lower = smaller file size.',
    },
    unoptimized: {
      type: 'boolean',
      defaultValueHint: false,
      description:
        'Skip Next.js optimisation — required for external URLs not in next.config remotePatterns, SVGs, or animated GIFs.',
    },
  },
  importPath: '@/components/plasmic-components/NextImage',
};
