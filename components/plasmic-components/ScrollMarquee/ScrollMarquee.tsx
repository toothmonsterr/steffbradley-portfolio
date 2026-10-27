import React, { useEffect, useRef } from 'react';
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

// Speed multiplier at full scroll speed, and the scroll speed (px/s) that
// reaches it. Same mapping the Motion version used.
const MAX_FACTOR = 4;
const FULL_SPEED_PX_S = 3000;

// The loop is a Web Animations API animation on the track's transform, so the
// compositor runs it: it stays smooth when the main thread is busy (which is
// exactly when scrolling), and costs no JavaScript per frame. Scrolling speeds
// it up by changing playbackRate, which the compositor picks up without
// restarting the animation. It used to be a Motion useAnimationFrame loop that
// wrote the transform from the main thread every frame, on and off screen.
export const ScrollMarquee = React.memo(function ScrollMarquee({
  children,
  speed = 80,
  direction = 'left',
  pauseOnHover = true,
  gap = 0,
  height = '126px',
  className,
}: ScrollMarqueeProps) {
  const prefersReduced = usePrefersReducedMotion();
  const outerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const track = trackRef.current;
    const copy = copyRef.current;
    if (!outer || !track || !copy || prefersReduced || typeof track.animate !== 'function') return;

    let anim: Animation | null = null;
    let hovered = false;
    let onScreen = true;

    const sync = () => {
      if (!anim) return;
      if (hovered || !onScreen) anim.pause();
      else anim.play();
    };

    // (Re)build the loop for the current copy width, keeping its progress.
    const build = () => {
      const width = copy.offsetWidth;
      if (width === 0) return;
      const progress = anim?.effect?.getComputedTiming().progress ?? 0;
      anim?.cancel();
      const from = direction === 'left' ? 0 : -width;
      const to = direction === 'left' ? -width : 0;
      anim = track.animate(
        [{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }],
        { duration: (width / Math.max(1, speed)) * 1000, iterations: Infinity, easing: 'linear' },
      );
      anim.currentTime = (progress ?? 0) * (width / Math.max(1, speed)) * 1000;
      sync();
    };
    build();
    const ro = new ResizeObserver(build);
    ro.observe(copy);

    // Off screen there is nothing to see, so nothing to animate.
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    }, { threshold: 0 });
    io.observe(outer);

    const onEnter = () => { if (pauseOnHover) { hovered = true; sync(); } };
    const onLeave = () => { hovered = false; sync(); };
    outer.addEventListener('mouseenter', onEnter);
    outer.addEventListener('mouseleave', onLeave);

    // Scroll speed → playback rate. Scroll events only record the velocity;
    // a short rAF loop eases the rate toward it and stops once settled, so
    // there is no per-frame work while the page is still.
    let lastY = window.scrollY;
    let lastT = performance.now();
    let target = 1;
    let rate = 1;
    let raf = 0;
    const ease = () => {
      // Decay the target back toward 1 so the boost fades after scrolling stops.
      target += (1 - target) * 0.08;
      rate += (target - rate) * 0.2;
      if (Math.abs(rate - 1) < 0.01 && Math.abs(target - 1) < 0.01) {
        rate = 1;
        raf = 0;
      } else {
        raf = requestAnimationFrame(ease);
      }
      if (anim && onScreen) anim.updatePlaybackRate(rate);
    };
    const onScroll = () => {
      const now = performance.now();
      const dt = Math.max(1, now - lastT);
      const v = Math.abs(window.scrollY - lastY) / (dt / 1000);
      lastY = window.scrollY;
      lastT = now;
      const factor = 1 + (MAX_FACTOR - 1) * Math.min(1, v / FULL_SPEED_PX_S);
      target = Math.max(target, factor);
      if (!raf) raf = requestAnimationFrame(ease);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
      outer.removeEventListener('mouseenter', onEnter);
      outer.removeEventListener('mouseleave', onLeave);
      io.disconnect();
      ro.disconnect();
      anim?.cancel();
    };
  }, [direction, speed, pauseOnHover, prefersReduced]);

  return (
    <div
      ref={outerRef}
      className={[styles.outer, className ?? ''].filter(Boolean).join(' ')}
      style={{ height }}
    >
      <div ref={trackRef} className={styles.track} style={{ gap: `${gap}px`, height }}>
        <div ref={copyRef} className={styles.copy} style={{ height, gap: `${gap}px` }}>
          {children}
        </div>
        <div className={styles.copy} aria-hidden="true" style={{ height, gap: `${gap}px` }}>
          {children}
        </div>
      </div>
    </div>
  );
});
