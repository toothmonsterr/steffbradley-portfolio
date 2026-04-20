import { PrintColorbar } from './PrintColorbar';

export { PrintColorbar };

export const PrintColorbarMeta = {
  name: 'PrintColorbar',
  displayName: 'Print Colorbar',
  description:
    'Six-swatch print registration colour bar. Defaults to CMYK process colours + white + black. Each swatch colour is independently editable.',
  props: {
    color1:       { type: 'color', defaultValueHint: '#00AEEF', description: 'Swatch 1 color (default: Cyan)' },
    color2:       { type: 'color', defaultValueHint: '#EC008C', description: 'Swatch 2 color (default: Magenta)' },
    color3:       { type: 'color', defaultValueHint: '#FFF200', description: 'Swatch 3 color (default: Yellow)' },
    color4:       { type: 'color', defaultValueHint: '#000000', description: 'Swatch 4 color (default: Key / Black)' },
    color5:       { type: 'color', defaultValueHint: '#FFFFFF', description: 'Swatch 5 color (default: White)' },
    color6:       { type: 'color', defaultValueHint: '#000000', description: 'Swatch 6 color (default: Black)' },
    swatchWidth:  { type: 'number', defaultValueHint: 16, description: 'Width of each individual swatch in px' },
    swatchHeight: { type: 'number', defaultValueHint: 16, description: 'Height of the colorbar in px' },
  },
  importPath: '@/components/plasmic-components/PrintColorbar',
};
