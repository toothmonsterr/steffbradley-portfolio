import { RichText } from './RichText';

export { RichText };

export const RichTextMeta = {
  name: 'RichText',
  displayName: 'Rich Text',
  description:
    'Renders an HTML string from a CMS rich-text field with prose typography (headings, paragraphs, lists, links, images, blockquotes) using the site design tokens. ' +
    'Bind html to a CMS rich-text field such as $ctx.plasmicCmsCaseStudyTitleItem.data.caseStudyContentTop. Renders nothing when the field is empty.',
  props: {
    html: {
      type: 'string',
      description:
        'HTML from a CMS rich-text field. Bind this with the dynamic value (lightning) icon — typing plain text here will not be formatted.',
    },
    size: {
      type: 'choice',
      options: ['small', 'body', 'large'],
      defaultValueHint: 'body',
      description: 'Base body text size',
    },
    maxWidth: {
      type: 'number',
      defaultValueHint: 720,
      description: 'Max line length in px for readability. Leave blank to fill the parent.',
    },
    align: {
      type: 'choice',
      options: ['left', 'center'],
      defaultValueHint: 'left',
      description: 'Text alignment',
    },
    accentColor: {
      type: 'string',
      defaultValueHint: 'var(--color-coral)',
      description:
        'Link and blockquote accent colour. Bind to the row\'s caseStudyColor so each case study\'s prose matches its own brand colour.',
    },
  },
  importPath: '@/components/plasmic-components/RichText',
};
