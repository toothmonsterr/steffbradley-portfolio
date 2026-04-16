import React from 'react';
import { motion } from 'motion/react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import styles from './FloatingElement.module.css';

export interface FloatingElementProps {
  children?: React.ReactNode;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  width?: string;
  height?: string;
  backgroundColor?: string;
  borderRadius?: string;
  zIndex?: number;
  animationAmplitude?: number;
  animationDuration?: number;
  className?: string;
}

export function FloatingElement({
  children,
  top,
  left,
  right,
  bottom,
  width = '200px',
  height = '200px',
  backgroundColor = 'var(--color-lavender)',
  borderRadius = '50%',
  zIndex = -1,
  animationAmplitude = 12,
  animationDuration = 4,
  className,
}: FloatingElementProps) {
  const prefersReduced = usePrefersReducedMotion();

  return (
    <motion.div
      className={[styles.wrapper, className ?? ''].filter(Boolean).join(' ')}
      style={{ top, left, right, bottom, width, height, zIndex, borderRadius }}
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
      <div
        className={styles.inner}
        style={{ backgroundColor, borderRadius }}
      >
        {children}
      </div>
    </motion.div>
  );
}
