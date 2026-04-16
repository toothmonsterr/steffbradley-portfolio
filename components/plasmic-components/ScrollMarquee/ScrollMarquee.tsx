import React, { useRef } from 'react';
import { motion, useAnimationFrame, useMotionValue, useTransform } from 'motion/react';
import { useScrollVelocity } from '@/hooks/useScrollVelocity';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import styles from './ScrollMarquee.module.css';

export interface ScrollMarqueeProps {
  speed?: number;
  direction?: 'left' | 'right';
  pauseOnHover?: boolean;
  gap?: number;
  className?: string;
}

export function ScrollMarquee({
  speed = 80,
  direction = 'left',
  pauseOnHover = true,
  gap = 48,
  className,
}: ScrollMarqueeProps) {
  const velocityFactor = useScrollVelocity({ maxFactor: 4 });
  const prefersReduced = usePrefersReducedMotion();
  const isPaused = useRef(false);

  // Base x position as a MotionValue — driven by useAnimationFrame
  const baseX = useMotionValue(0);
  const copyRef = useRef<HTMLDivElement>(null);

  // Direction multiplier: left = negative x drift, right = positive
  const dirMul = direction === 'left' ? -1 : 1;

  useAnimationFrame((_, delta) => {
    if (isPaused.current || prefersReduced) return;

    const copyWidth = copyRef.current?.offsetWidth ?? 0;
    if (copyWidth === 0) return;

    const factor = velocityFactor.get();
    const move = dirMul * speed * factor * (delta / 1000);

    let newX = baseX.get() + move;

    // Teleport: when the leading copy has scrolled fully offscreen,
    // wrap back to keep the loop seamless
    if (direction === 'left' && newX <= -copyWidth) {
      newX += copyWidth;
    } else if (direction === 'right' && newX >= 0) {
      newX -= copyWidth;
    }

    baseX.set(newX);
  });

  // Apply the x transform to the track
  const x = useTransform(baseX, (v) => `${v}px`);

  const handleMouseEnter = () => { if (pauseOnHover) isPaused.current = true; };
  const handleMouseLeave = () => { isPaused.current = false; };

  return (
    <div
      className={[styles.outer, className ?? ''].filter(Boolean).join(' ')}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className={styles.track}
        style={{ x, gap: `${gap}px` }}
      >
        {/* First copy — measured for teleport width */}
        <div ref={copyRef} className={styles.copy}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/marquee.svg" alt="" width={2008} height={126} draggable={false} style={{ display: 'block' }} />
        </div>
        {/* Second copy — always follows the first */}
        <div className={styles.copy} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/marquee.svg" alt="" width={2008} height={126} draggable={false} style={{ display: 'block' }} />
        </div>
      </motion.div>
    </div>
  );
}
