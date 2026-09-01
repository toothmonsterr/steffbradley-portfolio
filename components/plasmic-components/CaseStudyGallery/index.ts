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
    alt: {
      type: 'string',
      defaultValue: '',
      description:
        'Fallback alt text, used only for images that have no caption. A caption doubles as that image\'s alt text.',
    },
    showCaptions: {
      type: 'boolean',
      defaultValueHint: true,
      description:
        'Show captions from the CMS caption slots. Add text sub-fields named carouselCap1, carouselCap2, … alongside carouselImg1, carouselImg2, … and each caption pairs with the image of the same number.',
    },
    captionStyle: {
      type: 'choice',
      options: ['plain', 'tape'],
      defaultValueHint: 'plain',
      description: 'plain — text under the image. tape — text on a torn strip of scotch tape.',
      hidden: (props: { showCaptions?: boolean }) => props.showCaptions === false,
    },
    captionColor: {
      type: 'color',
      description: 'Caption text colour.',
      hidden: (props: { showCaptions?: boolean }) => props.showCaptions === false,
    },
    tapeColor: {
      type: 'color',
      defaultValueHint: 'rgba(221, 234, 68, 0.75)',
      description:
        'Tape tint. Keep some alpha — real tape is translucent and reads better when the background shows through.',
      hidden: (props: { showCaptions?: boolean; captionStyle?: string }) =>
        props.showCaptions === false || props.captionStyle !== 'tape',
    },
    tapeRotation: {
      type: 'number',
      defaultValueHint: -2,
      description: 'Tape tilt in degrees. 0 is perfectly straight; a degree or two reads as hand-applied.',
      hidden: (props: { showCaptions?: boolean; captionStyle?: string }) =>
        props.showCaptions === false || props.captionStyle !== 'tape',
    },
    priority: {
      type: 'boolean',
      defaultValueHint: false,
      description: 'Disable lazy loading on the first image — use only when above the fold',
    },

    // Carousel only
    visibleSlides: {
      type: 'number',
      defaultValueHint: 1,
      description:
        'Carousel only. How many images are visible at once. 1 is a classic one-at-a-time carousel; 2+ shows several side by side and advances by one. Always falls back to 1 below 720px.',
      hidden: (props: { layout?: string }) => props.layout !== 'carousel',
    },
    slideGap: {
      type: 'number',
      defaultValueHint: 16,
      description: 'Carousel only. Gap between slides in px. Only applies when more than one is visible.',
      hidden: (props: { layout?: string }) => props.layout !== 'carousel',
    },
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
