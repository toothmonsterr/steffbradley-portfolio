import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export interface ScrollParallaxProps {
  children?: React.ReactNode;
  speed?: number;
  axis?: 'y' | 'x';
  clamp?: boolean;
  className?: string;
}

export function ScrollParallax({
  children,
  speed = 0.3,
  axis = 'y',
  clamp = true,
  className,
}: ScrollParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = usePrefersReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Range: when element center is at bottom of viewport, offset = +range;
  // when element center is at top, offset = -range. The magnitude depends on speed.
  const range = 200 * Math.abs(speed);
  const dir = speed >= 0 ? 1 : -1;

  const translate = useTransform(
    scrollYProgress,
    clamp ? [0, 1] : [-0.5, 1.5],
    clamp ? [range * dir, -range * dir] : [range * dir * 2, -range * dir * 2]
  );

  if (prefersReduced) {
    return <div ref={ref} className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={className} style={{ willChange: 'transform' }}>
      <motion.div style={axis === 'y' ? { y: translate } : { x: translate }}>
        {children}
      </motion.div>
    </div>
  );
}
