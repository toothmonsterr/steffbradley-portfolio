import { IconListItem } from './IconListItem';

export { IconListItem };

export const IconListItemMeta = {
  name: 'IconListItem',
  displayName: 'Icon List Item',
  props: {
    icon: { type: 'slot', description: 'Icon element displayed to the left' },
    heading: { type: 'string', defaultValueHint: 'skill or feature' },
    body: { type: 'string', defaultValueHint: 'description of the skill or feature' },
  },
  importPath: '@/components/plasmic-components/IconListItem',
};
