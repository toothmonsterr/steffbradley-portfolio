import { CaseStudyMeta } from './CaseStudyMeta';

export { CaseStudyMeta };

export const CaseStudyMetaMeta = {
  name: 'CaseStudyMeta',
  displayName: 'Case Study Meta',
  description:
    'Label/value rows for case study metadata — Platforms, Launched, Roles. Values render exactly as typed in the CMS. ' +
    'Any row whose value is empty is dropped, so an unfilled field leaves no dangling label. ' +
    'Labels are editable, so the same component also serves the artwork table (e.g. "Medium:" / "Tools:").',
  props: {
    platformsLabel: { type: 'string', defaultValue: 'Platforms:', description: 'Label for the first row' },
    platformsValue: {
      type: 'string',
      description: 'Bind to $ctx.plasmicCmsCaseStudyTitleItem.data.caseStudyPlatforms',
    },

    launchedLabel: { type: 'string', defaultValue: 'Launched:', description: 'Label for the second row' },
    launchedValue: {
      type: 'string',
      description: 'Bind to $ctx.plasmicCmsCaseStudyTitleItem.data.caseStudyLaunched',
    },

    rolesLabel: { type: 'string', defaultValue: 'Roles:', description: 'Label for the third row' },
    rolesValue: {
      type: 'string',
      description: 'Bind to $ctx.plasmicCmsCaseStudyTitleItem.data.caseStudyRoles',
    },

    layout: {
      type: 'choice',
      options: ['stacked', 'inline'],
      defaultValueHint: 'stacked',
      description: 'stacked — label above value, rows side by side. inline — label beside value, rows stacked.',
    },
    labelColor: { type: 'string', defaultValueHint: 'var(--color-neutral-50)', description: 'Label text colour' },
    valueColor: { type: 'string', defaultValueHint: 'var(--color-midnight)', description: 'Value text colour' },
  },
  importPath: '@/components/plasmic-components/CaseStudyMeta',
};
