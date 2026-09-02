import { useMediaQuery } from './useMediaQuery';

/**
 * True when the device has no precise pointer.
 *
 * `(pointer: fine)` asks "is there a precise pointing device", which is the
 * right question for hover-driven effects — a tablet with a mouse keeps them,
 * a large phone loses them. Viewport width would get both of those wrong.
 */
export function useIsTouchDevice(): boolean {
  return !useMediaQuery('(pointer: fine)');
}
