import { colorPrimitive, fontFamily, spacing } from './primitives';
import { colorNeutral, colorSuccess, colorWarning, colorError } from './semantic';

export const tokens = {
  color: {
    ...colorPrimitive,
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
  },
  fontFamily,
  spacing,
} as const;

export type TokenColor = keyof typeof tokens.color;
export { colorPrimitive, colorNeutral, colorSuccess, colorWarning, colorError, fontFamily, spacing };
