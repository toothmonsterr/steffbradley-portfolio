import { CaseStudyGallery } from './CaseStudyGallery';

export { CaseStudyGallery };

export const CaseStudyGalleryMeta = {
  name: 'CaseStudyGallery',
  displayName: 'Case Study Gallery',
  description:
    'Image grid or carousel driven by a CMS object field of image slots (caseStudyFeatures or caseStudyCarousel). ' +
    'Empty slots are skipped, and the component renders nothing when no slot is filled. ' +
    'For print effects, wrap this in Reveal on Scroll or use Offset CMYK on individual images instead.',
  props: {
    images: {
      type: 'object',
      description:
        'Bind the WHOLE CMS object field — e.g. $ctx.plasmicCmsCaseStudyTitleItem.data.caseStudyFeatures — not an individual image sub-field.',
    },
    layout: {
      type: 'choice',
      options: ['grid', 'carousel'],
      defaultValueHint: 'grid',
      description: 'grid — every image at once. carousel — one at a time with prev/next arrows and dots.',
    },

    // Grid only
    columns: {
      type: 'number',
      defaultValueHint: 2,
      description: 'Grid only. Columns on desktop; collapses to 1 below 720px.',
      hidden: (props: { layout?: string }) => props.layout === 'carousel',
    },
    gap: {
      type: 'number',
      defaultValueHint: 24,
      description: 'Grid only. Gap between tiles in px.',
      hidden: (props: { layout?: string }) => props.layout === 'carousel',
    },

    // Shared
    aspectRatio: {
      type: 'string',
      defaultValueHint: '4 / 3',
      description: 'CSS aspect ratio for each image — e.g. "4 / 3", "16 / 9", "1 / 1"',
    },
    objectFit: {
      type: 'choice',
      options: ['cover', 'contain'],
      defaultValueHint: 'cover',
      description: 'cover crops to fill the frame; contain fits the whole image inside it',
    },
    rounded: { type: 'number', defaultValueHint: 0, description: 'Corner radius in px' },
    alt: { type: 'string', defaultValue: '', description: 'Alt text applied to every image' },
    priority: {
      type: 'boolean',
      defaultValueHint: false,
      description: 'Disable lazy loading on the first image — use only when above the fold',
    },

    // Carousel only
    loop: {
      type: 'boolean',
      defaultValueHint: true,
      description: 'Carousel only. Wrap around from the last image to the first. When off, the arrows disable at each end.',
      hidden: (props: { layout?: string }) => props.layout !== 'carousel',
    },
    showArrows: {
      type: 'boolean',
      defaultValueHint: true,
      description: 'Carousel only. Show the prev/next arrow buttons.',
      hidden: (props: { layout?: string }) => props.layout !== 'carousel',
    },
    showDots: {
      type: 'boolean',
      defaultValueHint: true,
      description: 'Carousel only. Show the position dots below the frame.',
      hidden: (props: { layout?: string }) => props.layout !== 'carousel',
    },
    arrowSize: {
      type: 'number',
      defaultValueHint: 56,
      description: 'Carousel only. Arrow button diameter in px.',
      hidden: (props: { layout?: string }) => props.layout !== 'carousel',
    },
    arrowOffset: {
      type: 'number',
      defaultValueHint: 0,
      description:
        'Carousel only. How far the arrows sit outside the frame edge, in px. Increase to have them overhang the frame; use a negative value to pull them inside.',
      hidden: (props: { layout?: string }) => props.layout !== 'carousel',
    },
    arrowColor: {
      type: 'color',
      defaultValueHint: '#201B2A',
      description: 'Carousel only. Arrow button background.',
      hidden: (props: { layout?: string }) => props.layout !== 'carousel',
    },
    arrowIconColor: {
      type: 'color',
      defaultValueHint: '#FFFFFF',
      description: 'Carousel only. Arrow chevron colour.',
      hidden: (props: { layout?: string }) => props.layout !== 'carousel',
    },
    dotColor: {
      type: 'color',
      defaultValueHint: 'rgba(32,27,42,0.25)',
      description: 'Carousel only. Inactive dot colour.',
      hidden: (props: { layout?: string }) => props.layout !== 'carousel',
    },
    activeDotColor: {
      type: 'color',
      defaultValueHint: '#201B2A',
      description: 'Carousel only. Active dot colour.',
      hidden: (props: { layout?: string }) => props.layout !== 'carousel',
    },
  },
  importPath: '@/components/plasmic-components/CaseStudyGallery',
};
