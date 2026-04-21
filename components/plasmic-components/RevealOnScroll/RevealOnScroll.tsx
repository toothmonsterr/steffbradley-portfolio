import React, { useEffect, useId, useRef } from 'react';
import { animate, motion, useAnimationFrame, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react';
import styles from './RevealOnScroll.module.css';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export interface RevealOnScrollProps {
  children?: React.ReactNode;
  /** Max blur in px — organic, noise-displaced (not clean Gaussian) */
  blurAmount?: number;
  /** Max displacement scale — controls how noisy/wavy the blur looks */
  displaceAmount?: number;
  /** Size of the warp turbulence — larger = broader, chunkier waves; smaller = tighter ripple */
  warpSize?: number;
  /** Opacity at rest before the reveal begins (0–1) */
  startOpacity?: number;
  /** Viewport fraction (0–1) where the reveal completes — 0.1 = fast, 0.7 = slow */
  endRatio?: number;
  /** When true, the reveal plays once and stays revealed if the user scrolls back up */
  playOnce?: boolean;
  /**
   * scroll — reveal on scroll (default)
   * load   — reveal once on page load / mount
   * always — show fully revealed; use in Plasmic Studio canvas preview
   */
  trigger?: 'scroll' | 'load' | 'always';
  className?: string;
}

export function RevealOnScroll({
  children,
  blurAmount = 12,
  displaceAmount = 30,
  warpSize = 1,
  startOpacity = 0,
  endRatio = 0.35,
  playOnce = false,
  trigger = 'scroll',
  className,
}: RevealOnScrollProps) {
  const prefersReduced = usePrefersReducedMotion();
  const uid = useId().replace(/:/g, '');
  const rootRef = useRef<HTMLDivElement>(null);

  // SVG filter element refs — updated imperatively each frame
  const turbRef     = useRef<SVGFETurbulenceElement>(null);
  const blurRef     = useRef<SVGFEGaussianBlurElement>(null);
  const displaceRef = useRef<SVGFEDisplacementMapElement>(null);
  const saturateRef = useRef<SVGFEColorMatrixElement>(null);

  const seedRef       = useRef(0);
  const maxProgressRef = useRef(0);  // high-water mark for playOnce
  const warpFrequency = 0.03 / Math.max(0.1, warpSize);

  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ['start end', `start ${endRatio}`],
  });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 25 });

  // effectiveProgress: tracks smoothProgress but never decreases when playOnce is true
  const effectiveProgress = useMotionValue(0);
  const contentOpacity = useTransform(effectiveProgress, [0, 1], [startOpacity, 1]);

  // load trigger: animate effectiveProgress 0 → 1 on mount
  useEffect(() => {
    if (trigger !== 'load' || prefersReduced) return;
    const controls = animate(effectiveProgress, 1, { duration: 1.5, ease: 'easeOut' });
    return () => controls.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, prefersReduced]);

  // Imperative SVG attribute updates — zero React re-renders.
  // For scroll: drives effectiveProgress from scroll position.
  // For load:   effectiveProgress is driven by the useEffect above; we just read it.
  useAnimationFrame(() => {
    if (prefersReduced || trigger === 'always') return;

    if (trigger === 'scroll') {
      const raw = smoothProgress.get();
      const p   = playOnce ? Math.max(maxProgressRef.current, raw) : raw;
      maxProgressRef.current = p;
      effectiveProgress.set(p);
    }

    const p     = effectiveProgress.get();
    const chaos = Math.max(0, 1 - p);

    if (blurRef.current)     blurRef.current.setAttribute('stdDeviation', String((1 - p) * blurAmount));
    if (displaceRef.current) displaceRef.current.setAttribute('scale',    String((1 - p) * displaceAmount));
    if (saturateRef.current) saturateRef.current.setAttribute('values',   String(p));

    if (chaos > 0.02) {
      seedRef.current = (seedRef.current + chaos * 0.5) % 1000;
      if (turbRef.current) turbRef.current.setAttribute('seed', String(Math.floor(seedRef.current)));
    }
  });

  const filterId = `reveal-content-${uid}`;

  // In 'always' mode or when reduced motion is preferred: fully revealed immediately
  if (trigger === 'always' || prefersReduced) {
    return (
      <div ref={rootRef} className={[styles.wrapper, className ?? ''].filter(Boolean).join(' ')}>
        {children}
      </div>
    );
  }

  return (
    <div ref={rootRef} className={[styles.wrapper, className ?? ''].filter(Boolean).join(' ')}>

      {/* Zero-size SVG carrying the filter definition */}
      <svg width="0" height="0" className={styles.defs} aria-hidden="true" focusable="false">
        <defs>
          {/*
            Noisy blur: feTurbulence drives feDisplacementMap which warps the Gaussian blur,
            making it organic and wavery rather than a clean circle. All three attributes
            (stdDeviation, scale, saturate values) collapse to their neutral state as
            scroll progress → 1.
          */}
          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence
              ref={turbRef}
              type="turbulence"
              baseFrequency={warpFrequency}
              numOctaves={2}
              seed={0}
              result="warp"
            />
            <feGaussianBlur
              ref={blurRef}
              in="SourceGraphic"
              stdDeviation={blurAmount}
              result="blurred"
            />
            <feDisplacementMap
              ref={displaceRef}
              in="blurred"
              in2="warp"
              scale={displaceAmount}
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            <feColorMatrix
              ref={saturateRef}
              type="saturate"
              values="0"
              in="displaced"
            />
          </filter>
        </defs>
      </svg>

      <motion.div
        className={styles.content}
        style={{
          opacity: contentOpacity,
          filter: `url(#${filterId})`,
        }}
      >
        {children}
      </motion.div>

    </div>
  );
}
