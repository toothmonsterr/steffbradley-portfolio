import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export interface FloatingElementProps {
  children?: React.ReactNode;
  animationAmplitude?: number;
  animationDuration?: number;
  /** Fixed phase offset 0–1. Leave unset for a random offset per instance. */
  phaseOffset?: number;
  className?: string;
}

export function FloatingElement({
  children,
  animationAmplitude = 12,
  animationDuration = 4,
  phaseOffset,
  className,
}: FloatingElementProps) {
  const prefersReduced = usePrefersReducedMotion();
  // Stable random phase per instance — only computed once on mount.
  const phase = useRef(phaseOffset ?? Math.random()).current;
  const delay = -(phase * animationDuration);

  return (
    <motion.div
      className={className}
      animate={prefersReduced ? undefined : {
        y: [0, -animationAmplitude, 0],
        rotate: [0, 2, -2, 0],
      }}
      transition={{
        duration: animationDuration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}
