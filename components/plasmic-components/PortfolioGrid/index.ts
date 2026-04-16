import { PortfolioGrid } from './PortfolioGrid';

export { PortfolioGrid };

export const PortfolioGridMeta = {
  name: 'PortfolioGrid',
  displayName: 'Portfolio Grid',
  props: {
    cmsId: {
      type: 'string',
      description: 'Plasmic CMS database ID (or set NEXT_PUBLIC_PLASMIC_CMS_ID env var)',
    },
    cmsPublicToken: {
      type: 'string',
      description: 'Plasmic CMS public token (or set NEXT_PUBLIC_PLASMIC_CMS_TOKEN env var)',
    },
    collection: {
      type: 'choice',
      options: ['case-studies', 'art-portfolio'],
      defaultValueHint: 'case-studies',
      description: 'Which CMS collection to display',
    },
    columns: { type: 'number', defaultValueHint: 3 },
    gap:     { type: 'number', defaultValueHint: 24, description: 'Grid gap in px' },
  },
  importPath: '@/components/plasmic-components/PortfolioGrid',
};
