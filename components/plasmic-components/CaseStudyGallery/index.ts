import { CaseStudyGallery } from './CaseStudyGallery';

export { CaseStudyGallery };

export const CaseStudyGalleryMeta = {
  name: 'CaseStudyGallery',
  displayName: 'Case Study Gallery',
  description:
    'Responsive image grid driven by a CMS object field of image slots (caseStudyFeatures or caseStudyCarousel). ' +
    'Empty slots are skipped, and the component renders nothing when no slot is filled. ' +
    'For print effects, wrap this in Reveal on Scroll or use Offset CMYK on individual images instead.',
  props: {
    images: {
      type: 'object',
      description:
        'Bind the WHOLE CMS object field — e.g. $ctx.plasmicCmsCaseStudyTitleItem.data.caseStudyFeatures — not an individual image sub-field.',
    },
    columns: {
      type: 'number',
      defaultValueHint: 2,
      description: 'Columns on desktop. Collapses to 1 below 720px.',
    },
    gap: { type: 'number', defaultValueHint: 24, description: 'Gap between tiles in px' },
    aspectRatio: {
      type: 'string',
      defaultValueHint: '4 / 3',
      description: 'CSS aspect ratio for each tile — e.g. "4 / 3", "16 / 9", "1 / 1"',
    },
    objectFit: {
      type: 'choice',
      options: ['cover', 'contain'],
      defaultValueHint: 'cover',
      description: 'cover crops to fill the tile; contain fits the whole image inside it',
    },
    rounded: { type: 'number', defaultValueHint: 0, description: 'Corner radius in px' },
    alt: { type: 'string', defaultValue: '', description: 'Alt text applied to every image in the grid' },
    priority: {
      type: 'boolean',
      defaultValueHint: false,
      description: 'Disable lazy loading on the first tile — use only when the grid is above the fold',
    },
  },
  importPath: '@/components/plasmic-components/CaseStudyGallery',
};
