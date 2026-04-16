import React from 'react';
import { motion } from 'motion/react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export interface FloatingElementProps {
  children?: React.ReactNode;
  animationAmplitude?: number;
  animationDuration?: number;
  className?: string;
}

export function FloatingElement({
  children,
  animationAmplitude = 12,
  animationDuration = 4,
  className,
}: FloatingElementProps) {
  const prefersReduced = usePrefersReducedMotion();

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
      }}
    >
      {children}
    </motion.div>
  );
}
