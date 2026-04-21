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
  /**
   * element — reveal is driven by the element's own position in the viewport (default).
   *           Use for content sections that reveal as they scroll into view.
   * page    — reveal is driven by raw page scroll offset in px.
   *           Use for fixed/sticky elements like a header nav that reacts to
   *           how far the page has scrolled regardless of the element's own position.
   */
  scrollMode?: 'element' | 'page';
  /**
   * element mode: how far the element has entered the viewport before reveal starts (0–100).
   *   0 = element just enters screen bottom, 50 = element top at center, 100 = element top at top.
   * page mode: page scroll offset in px at which the reveal begins.
   *   e.g. 80 = reveal starts after scrolling 80px down the page.
   */
  triggerPoint?: number;
  /**
   * element mode: scroll distance the reveal takes, in viewport heights (0.1–2.0).
   *   0.1 = snappy, 0.5 = medium, 1.5 = slow.
   * page mode: px of page scroll over which the reveal completes.
   *   e.g. 120 = reveal completes over 120px of scrolling after the trigger.
   */
  revealDuration?: number;
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
  scrollMode = 'element',
  triggerPoint = 20,
  revealDuration = 0.5,
  playOnce = false,
  trigger = 'scroll',
  className,
}: RevealOnScrollProps) {
  const prefersReduced = usePrefersReducedMotion();
  const uid = useId().replace(/:/g, '');
  const rootRef = useRef<HTMLDivElement>(null);

  const turbRef     = useRef<SVGFETurbulenceElement>(null);
  const blurRef     = useRef<SVGFEGaussianBlurElement>(null);
  const displaceRef = useRef<SVGFEDisplacementMapElement>(null);
  const saturateRef = useRef<SVGFEColorMatrixElement>(null);

  const seedRef        = useRef(0);
  const maxProgressRef = useRef(0);
  const warpFrequency  = 0.03 / Math.max(0.1, warpSize);

  // ── Element-mode scroll progress (useScroll, element-relative) ──────────
  const startViewport = 1 - triggerPoint / 100;
  const endViewport   = Math.max(0, startViewport - revealDuration);

  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: [`start ${startViewport.toFixed(3)}`, `start ${endViewport.toFixed(3)}`],
  });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 25 });

  // ── Page-mode scroll progress (raw window.scrollY) ───────────────────────
  const pageProgress = useMotionValue(0);
  useEffect(() => {
    if (scrollMode !== 'page' || trigger !== 'scroll') return;
    const onScroll = () => {
      const scrollY = window.scrollY;
      const start   = triggerPoint;
      const end     = triggerPoint + Math.max(1, revealDuration);
      const raw     = Math.max(0, Math.min(1, (scrollY - start) / (end - start)));
      pageProgress.set(raw);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // sync on mount
    return () => window.removeEventListener('scroll', onScroll);
  }, [scrollMode, trigger, triggerPoint, revealDuration, pageProgress]);

  const smoothPageProgress = useSpring(pageProgress, { stiffness: 80, damping: 25 });

  // ── Effective progress ────────────────────────────────────────────────────
  const effectiveProgress = useMotionValue(0);
  const contentOpacity    = useTransform(effectiveProgress, [0, 1], [startOpacity, 1]);

  useEffect(() => {
    if (trigger !== 'load' || prefersReduced) return;
    const controls = animate(effectiveProgress, 1, { duration: 1.5, ease: 'easeOut' });
    return () => controls.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, prefersReduced]);

  useAnimationFrame(() => {
    if (prefersReduced || trigger === 'always') return;

    if (trigger === 'scroll') {
      const raw = scrollMode === 'page' ? smoothPageProgress.get() : smoothProgress.get();
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

  if (trigger === 'always' || prefersReduced) {
    return (
      <div ref={rootRef} className={[styles.wrapper, className ?? ''].filter(Boolean).join(' ')}>
        {children}
      </div>
    );
  }

  return (
    <div ref={rootRef} className={[styles.wrapper, className ?? ''].filter(Boolean).join(' ')}>
      <svg width="0" height="0" className={styles.defs} aria-hidden="true" focusable="false">
        <defs>
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
