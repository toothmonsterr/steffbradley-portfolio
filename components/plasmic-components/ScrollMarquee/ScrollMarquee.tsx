import React, { useEffect, useRef } from 'react';
import { motion, useAnimationFrame, useMotionValue, useTransform } from 'motion/react';
import { useScrollVelocity } from '@/hooks/useScrollVelocity';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import styles from './ScrollMarquee.module.css';

export interface ScrollMarqueeProps {
  children?: React.ReactNode;
  speed?: number;
  direction?: 'left' | 'right';
  pauseOnHover?: boolean;
  gap?: number;
  height?: string;
  className?: string;
}

export const ScrollMarquee = React.memo(function ScrollMarquee({
  children,
  speed = 80,
  direction = 'left',
  pauseOnHover = true,
  gap = 0,
  height = '126px',
  className,
}: ScrollMarqueeProps) {
  const velocityFactor = useScrollVelocity({ maxFactor: 4 });
  const prefersReduced = usePrefersReducedMotion();
  const isPaused = useRef(false);

  const baseX = useMotionValue(0);
  const copyRef = useRef<HTMLDivElement>(null);

  // offsetWidth forces a synchronous layout read. Doing that every frame is a
  // guaranteed per-frame layout flush, so measure once and refresh only when
  // the content actually resizes.
  const copyWidthRef = useRef(0);
  useEffect(() => {
    const el = copyRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const measure = () => { copyWidthRef.current = el.offsetWidth; };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const dirMul = direction === 'left' ? -1 : 1;

  useAnimationFrame((_, delta) => {
    if (isPaused.current || prefersReduced) return;

    const copyWidth = copyWidthRef.current;
    if (copyWidth === 0) return;

    const factor = velocityFactor.get();
    const move = dirMul * speed * factor * (delta / 1000);

    let newX = baseX.get() + move;

    if (direction === 'left' && newX <= -copyWidth) {
      newX += copyWidth;
    } else if (direction === 'right' && newX >= 0) {
      newX -= copyWidth;
    }

    baseX.set(newX);
  });

  const x = useTransform(baseX, (v) => `${v}px`);

  const handleMouseEnter = () => { if (pauseOnHover) isPaused.current = true; };
  const handleMouseLeave = () => { isPaused.current = false; };

  return (
    <div
      className={[styles.outer, className ?? ''].filter(Boolean).join(' ')}
      style={{ height }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className={styles.track}
        style={{ x, gap: `${gap}px`, height }}
      >
        <div ref={copyRef} className={styles.copy} style={{ height, gap: `${gap}px` }}>
          {children}
        </div>
        <div className={styles.copy} aria-hidden="true" style={{ height, gap: `${gap}px` }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
});
