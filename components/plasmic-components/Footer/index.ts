import { Footer } from './Footer';

export { Footer };

export const FooterMeta = {
  name: 'Footer',
  displayName: 'Footer',
  props: {
    logoText: { type: 'string', defaultValueHint: 'toothmonster' },
    tagline: { type: 'string', defaultValueHint: 'ui/ux developer & interaction designer' },
    email: { type: 'string', defaultValueHint: 'toothbops@gmail.com' },
    copyright: { type: 'string', description: 'Overrides the default copyright line' },
  },
  importPath: '@/components/plasmic-components/Footer',
};
