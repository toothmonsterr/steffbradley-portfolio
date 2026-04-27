export { CmsPaginationContext } from './CmsPaginationContext';
export type { CmsPaginationContextProps } from './CmsPaginationContext';
export type { PaginationState } from './store';

export { CmsPaginationControls } from './CmsPaginationControls';
export type { CmsPaginationControlsProps } from './CmsPaginationControls';

export { CmsPaginationButton } from './CmsPaginationButton';
export type { CmsPaginationButtonProps } from './CmsPaginationButton';

export const CmsPaginationButtonMeta = {
  name: 'CmsPaginationButton',
  displayName: 'CMS Pagination Button',
  description:
    'Drop into the pageButton slot of CmsPaginationControls — it is cloned once per page with isActive and pageNumber injected automatically. To style: bind a text element inside to $props.pageNumber, and add a private style variant on the isActive prop.',
  props: {
    children:   { type: 'slot', description: 'Button content — add a text element and bind its content to $props.pageNumber' },
    isActive:   {
      type: 'boolean',
      defaultValueHint: false,
      description: 'True when this is the current page — use a private style variant on this prop to style active state',
    },
    pageNumber: { type: 'number', description: 'The page number this button represents — bind a text element to $props.pageNumber' },
  },
  importPath: '@/components/plasmic-components/CmsPagination',
};

export const CmsPaginationContextMeta = {
  name: 'CmsPaginationContext',
  displayName: 'CMS Pagination Context',
  description:
    'Owns page state and exposes $ctx.paginationCtx with: offset, pageSize, currentPage, totalCount, totalPages, hasPrev, hasNext. Bind CmsQueryRepeater.offset → $ctx.paginationCtx.offset and .limit → $ctx.paginationCtx.pageSize. Drop CmsPaginationControls anywhere inside.',
  providesData: true,
  props: {
    children:      { type: 'slot', description: 'Place a CmsQueryRepeater and CmsPaginationControls here' },
    databaseId:    { type: 'string', description: 'Plasmic CMS database ID (from Project Settings → CMS)' },
    databaseToken: { type: 'string', description: 'Plasmic CMS public database token' },
    table:         { type: 'string', description: 'CMS table identifier to paginate (e.g. caseStudyTitle)' },
    pageSize:      { type: 'number', defaultValueHint: 10, description: 'Rows per page' },
    where:         { type: 'string', description: 'Optional JSON WHERE filter, e.g. {"status":"published"}' },
    useDraft:      { type: 'boolean', defaultValueHint: false, description: 'Include draft rows in the count' },
  },
  importPath: '@/components/plasmic-components/CmsPagination',
};

export const CmsPaginationControlsMeta = {
  name: 'CmsPaginationControls',
  displayName: 'CMS Pagination Controls',
  description:
    'Renders prev/next and numbered page buttons. Must be inside a CmsPaginationContext. To customise the page number look, wrap CmsPaginationButton as a Plasmic component (with $props.isActive variants and a text bound to $props.pageNumber).',
  props: {
    showPageNumbers: { type: 'boolean', defaultValueHint: true, description: 'Show numbered page buttons' },
    maxPageButtons:  { type: 'number', defaultValueHint: 5, description: 'Max page buttons before collapsing with ellipsis' },
    prevLabel:       { type: 'string', defaultValueHint: '←', description: 'Fallback label when no prevButton slot is used' },
    nextLabel:       { type: 'string', defaultValueHint: '→', description: 'Fallback label when no nextButton slot is used' },
    prevButton:      { type: 'slot', description: 'Custom previous button — styled freely in Studio' },
    nextButton:      { type: 'slot', description: 'Custom next button — styled freely in Studio' },
    pageButton:      {
      type: 'slot',
      description: 'Drop a CmsPaginationButton here and style it. It is cloned once per page — pageNumber and isActive are injected automatically.',
    },
  },
  importPath: '@/components/plasmic-components/CmsPagination',
};
