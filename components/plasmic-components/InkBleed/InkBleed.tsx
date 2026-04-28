import React, { useEffect, useId, useRef } from 'react';
import styles from './InkBleed.module.css';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { findHoverHost } from '@/hooks/findHoverHost';

export interface InkBleedProps {
  children?: React.ReactNode;
  bleedColor?: string;
  /** How far the ink spreads from the content edge in px (feMorphology dilate radius) */
  spread?: number;
  /** Softness of the expanded edge — higher = more diffuse halo */
  softness?: number;
  /** feTurbulence baseFrequency — lower = chunkier fiber, higher = finer grain */
  noiseFrequency?: number;
  /** Fraction 0–1 controlling fiber sparseness: 0 = dense, 1 = sparse */
  noiseThreshold?: number;
  /**
   * Blend mode applied ONLY to the bleed halo (the noisy ink ring around the
   * content). The children on top render normally, untouched. Set to 'multiply'
   * etc. to make the halo darken the page; children stay pristine.
   */
  blendMode?: React.CSSProperties['mixBlendMode'];
  /**
   * When true (default), the blend mode only affects the bleed within this
   * component (via `isolation: isolate`). When false, the bleed blends with
   * whatever is behind the component on the page.
   */
  isolateBlend?: boolean;
  /**
   * When the bleed's paper fiber animates:
   *   never  — static fiber (cheapest)
   *   hover  — fiber shifts only while the hosting element is hovered
   *   always — fiber shifts continuously
   */
  animate?: 'never' | 'hover' | 'always';
  /** Fixed seed for the paper fiber pattern. Change to shift it. */
  seed?: number;
  className?: string;
}

export function InkBleed({
  children,
  bleedColor     = '#201B2A',
  spread         = 8,
  softness       = 4,
  noiseFrequency = 0.08,
  noiseThreshold = 0.5,
  blendMode,
  isolateBlend   = true,
  animate        = 'never',
  seed           = 0,
  className,
}: InkBleedProps) {
  const uid      = useId().replace(/:/g, '');
  const filterId = `inkbleed-${uid}`;
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const turbRef    = useRef<SVGFETurbulenceElement>(null);
  const prefersReduced = usePrefersReducedMotion();

  // Build a discrete tableValues string for feFuncA.
  // noiseThreshold=0 → dense fiber (many ones), 1 → sparse (few ones).
  const N    = 10;
  const ones = Math.max(1, Math.min(N - 1, Math.round((1 - noiseThreshold) * N)));
  const tv   = Array.from({ length: N }, (_, i) => (i >= N - ones ? 1 : 0)).join(' ');

  useEffect(() => {
    if (animate === 'never' || prefersReduced) return;
    const el = turbRef.current;
    if (!el) return;

    let raf = 0;
    let last = 0;
    let s = seed;
    let visible = true;
    const tick = (t: number) => {
      if (visible && t - last > 83) {
        s = (s + 1) % 1000;
        el.setAttribute('seed', String(s));
        last = t;
      }
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      el.setAttribute('seed', String(seed));
      s = seed;
    };

    if (animate === 'always') {
      const io = new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
      }, { threshold: 0 });
      if (wrapperRef.current) io.observe(wrapperRef.current);
      start();
      return () => { stop(); io.disconnect(); };
    }

    // animate === 'hover' — attach listeners to the hover host
    const host = findHoverHost(wrapperRef.current);
    if (!host) return;
    const onEnter = () => start();
    const onLeave = () => stop();
    host.addEventListener('mouseenter', onEnter);
    host.addEventListener('mouseleave', onLeave);
    return () => {
      host.removeEventListener('mouseenter', onEnter);
      host.removeEventListener('mouseleave', onLeave);
      stop();
    };
  }, [animate, seed, prefersReduced]);

  return (
    <span
      ref={wrapperRef}
      className={[styles.wrapper, className ?? ''].filter(Boolean).join(' ')}
      style={{ isolation: isolateBlend ? 'isolate' : 'auto' }}
    >
      {/* Hidden defs SVG */}
      <svg className={styles.defs} aria-hidden="true" focusable="false" width="0" height="0">
        <defs>
          <filter
            id={filterId}
            colorInterpolationFilters="sRGB"
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            {/* 1. Expand the content silhouette outward */}
            <feMorphology in="SourceAlpha" operator="dilate" radius={spread} result="expanded" />

            {/* 2. Soften the expanded edge */}
            <feGaussianBlur in="expanded" stdDeviation={softness} result="expandedEdge" />

            {/* 3. Paper-fiber noise mask */}
            <feTurbulence
              ref={turbRef}
              type="fractalNoise"
              baseFrequency={noiseFrequency.toFixed(4)}
              numOctaves="3"
              seed={seed}
              stitchTiles="stitch"
              result="noise"
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.299 0.587 0.114 0 0"
              in="noise"
              result="noiseAlpha"
            />
            <feComponentTransfer in="noiseAlpha" result="grain">
              <feFuncA type="discrete" tableValues={tv} />
            </feComponentTransfer>

            {/* 4. Clip bleed region by paper fiber */}
            <feComposite in="expandedEdge" in2="grain" operator="in" result="roughBleed" />

            {/* 5. Colorise with ink color — NOTE: no feMerge with SourceGraphic.
                The filter output is ONLY the bleed, so the children rendered
                as source for the filter don't appear visibly. */}
            <feFlood floodColor={bleedColor} result="ink" />
            <feComposite in="ink" in2="roughBleed" operator="in" />
          </filter>
        </defs>
      </svg>

      {/* Bleed layer — absolutely positioned behind the content. The filter
          replaces the rendered output with the bleed only; the children inside
          are invisible (filter discards SourceGraphic), but they supply the
          SourceAlpha silhouette the filter dilates from. Blend mode applies
          here only. */}
      <span
        className={styles.bleed}
        style={{ filter: `url(#${filterId})`, mixBlendMode: blendMode }}
        aria-hidden="true"
      >
        <span className={styles.bleedSource}>{children}</span>
      </span>

      {/* Content on top — rendered normally, no blend mode, no filter. */}
      <span className={styles.content}>{children}</span>
    </span>
  );
}
