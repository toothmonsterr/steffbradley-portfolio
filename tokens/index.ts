import { colorPrimitive, fontFamily, spacingPx, spacingLarge, fontSizeRem, lineHeight, opacity, radius } from './primitives';
import { colorNeutral, colorSuccess, colorWarning, colorError } from './semantic';

export const tokens = {
  color: {
    // Brand palette — prefixed so they group together in Plasmic's token panel
    'brand-cream':      colorPrimitive.cream,
    'brand-lavender':   colorPrimitive.lavender,
    'brand-coral':      colorPrimitive.coral,
    'brand-peach':      colorPrimitive.peach,
    'brand-chartreuse': colorPrimitive.chartreuse,
    'brand-green':      colorPrimitive.green,
    'brand-navy':       colorPrimitive.navy,
    'brand-brick':      colorPrimitive.brick,
    'brand-sienna':     colorPrimitive.sienna,
    'brand-olive':      colorPrimitive.olive,
    'brand-forest':     colorPrimitive.forest,
    'brand-midnight':   colorPrimitive.midnight,
    // Neutral scale
    'neutral-0':   colorNeutral['0'],
    'neutral-25':  colorNeutral['25'],
    'neutral-50':  colorNeutral['50'],
    'neutral-75':  colorNeutral['75'],
    'neutral-100': colorNeutral['100'],
    // Success scale
    'success-0':   colorSuccess['0'],
    'success-25':  colorSuccess['25'],
    'success-50':  colorSuccess['50'],
    'success-75':  colorSuccess['75'],
    'success-100': colorSuccess['100'],
    // Warning scale
    'warning-0':   colorWarning['0'],
    'warning-25':  colorWarning['25'],
    'warning-50':  colorWarning['50'],
    'warning-75':  colorWarning['75'],
    'warning-100': colorWarning['100'],
    // Error scale
    'error-0':   colorError['0'],
    'error-25':  colorError['25'],
    'error-50':  colorError['50'],
    'error-75':  colorError['75'],
    'error-100': colorError['100'],
    // Navy opacity scale
    'navy-0':  '#00427F00',
    'navy-25': '#00427F40',
    'navy-50': '#00427F80',
    'navy-75': '#00427FBF',
  },
  fontFamily,
  spacingPx,
  spacingLarge,
  fontSizeRem,
  lineHeight,
  opacity,
  radius,
} as const;

export type TokenColor = keyof typeof tokens.color;
export {
  colorPrimitive, colorNeutral, colorSuccess, colorWarning, colorError,
  fontFamily,
  spacingPx, spacingLarge,
  fontSizeRem,
  lineHeight,
  opacity,
  radius,
};
