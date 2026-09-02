import { useIsTouchDevice } from './useIsTouchDevice';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/**
 * none    — the user asked for reduced motion. Nothing animates.
 * reduced — touch device. Cursor-driven effects are skipped entirely (they
 *           render nothing without a pointer anyway) and ambient motion runs
 *           at a lower frame rate / lower quality.
 * full    — desktop with a precise pointer. Everything runs as designed.
 */
export type AnimationTier = 'full' | 'reduced' | 'none';

export interface AnimationCapabilities {
  tier: AnimationTier;
  /** No precise pointer — hover/proximity effects are invisible here. */
  isTouch: boolean;
  prefersReduced: boolean;
  /** Convenience: skip cursor-driven work entirely. */
  skipPointerEffects: boolean;
  /** Target frame interval in ms for ambient loops (0 = uncapped). */
  frameInterval: number;
}

/** ~30fps for ambient motion on touch devices. */
const REDUCED_FRAME_INTERVAL = 33;

export function useAnimationTier(): AnimationCapabilities {
  const prefersReduced = usePrefersReducedMotion();
  const isTouch = useIsTouchDevice();

  const tier: AnimationTier = prefersReduced ? 'none' : isTouch ? 'reduced' : 'full';

  return {
    tier,
    isTouch,
    prefersReduced,
    skipPointerEffects: prefersReduced || isTouch,
    frameInterval: tier === 'reduced' ? REDUCED_FRAME_INTERVAL : 0,
  };
}
