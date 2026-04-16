import { useScroll, useVelocity, useSpring, useTransform } from 'motion/react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

interface ScrollVelocityOptions {
  // Maximum speed multiplier (applied when scrolling fast). Default: 4.
  maxFactor?: number;
  // Spring config for smoothing the velocity. Default: damping 50, stiffness 400.
  damping?: number;
  stiffness?: number;
}

// Returns a MotionValue<number> representing a speed multiplier:
//   1.0 = at rest (base speed)
//   up to maxFactor = scrolling fast
// Use this to multiply the base speed of a marquee or other scroll-driven animation.
export function useScrollVelocity({
  maxFactor = 4,
  damping = 50,
  stiffness = 400,
}: ScrollVelocityOptions = {}) {
  const prefersReduced = usePrefersReducedMotion();
  const { scrollY } = useScroll();

  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping, stiffness });

  // Map velocity (px/s) to a scalar multiplier.
  // Negative velocity (scrolling up) also accelerates; use abs via [-max, 0, max].
  const velocityFactor = useTransform(
    smoothVelocity,
    [-3000, 0, 3000],
    [maxFactor, 1, maxFactor]
  );

  // When reduced motion is preferred, always return 1 (no acceleration)
  const clampedFactor = useTransform(velocityFactor, (v) =>
    prefersReduced ? 1 : v
  );

  return clampedFactor;
}
