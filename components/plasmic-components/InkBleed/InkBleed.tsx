import React, { useEffect, useId, useRef, useState } from 'react';
import styles from './InkBleed.module.css';
import { useAnimationTier } from '@/hooks/useAnimationTier';
import { findHoverHost } from '@/hooks/findHoverHost';
import { fiberTileUrl, tileSizeForFrequency, TILE_VARIANTS } from '../textures';

export interface InkBleedProps {
  children?: React.ReactNode;
  bleedColor?: string;
  /** How far the ink spreads from the content edge in px (feMorphology dilate radius) */
  spread?: number;
  /** Softness of the expanded edge — higher = more diffuse halo */
  softness?: number;
  /** Paper-fiber frequency — lower = chunkier fiber, higher = finer grain */
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

// Below this the dilate rounds to nothing visible, so a fractional spread was
// paying for a morphology pass that changed no pixels.
const MIN_SPREAD = 0.5;


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
  const tileRef    = useRef<SVGFEImageElement>(null);
  const { prefersReduced, isTouch } = useAnimationTier();

  // The paper fiber is a pre-rendered tile of the old noise chain (3-octave
  // fractal noise, luminance into alpha, same threshold table), drawn at the
  // size that reproduces noiseFrequency. feImage + feTile replaces
  // feTurbulence, so the filter no longer evaluates noise per pixel.
  const tileSize = tileSizeForFrequency(noiseFrequency);
  // The seed picks one of the pre-rendered sheets of fiber.
  const variant = Math.abs(Math.round(seed)) % TILE_VARIANTS;

  const dilate = spread >= MIN_SPREAD;

  // Size the filter region to what the halo can reach (the dilate radius plus
  // ~3σ of blur) instead of a blanket ±30% of the box. On a wide title, ±30%
  // was hundreds of px of filter surface that nothing ever painted into.
  const pad = (dilate ? spread : 0) + softness * 3 + 1;
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        setBox((prev) =>
          prev && Math.abs(prev.w - width) < 1 && Math.abs(prev.h - height) < 1
            ? prev
            : { w: width, h: height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const region = box
    ? {
        x: `${((-pad / box.w) * 100).toFixed(3)}%`,
        y: `${((-pad / box.h) * 100).toFixed(3)}%`,
        width: `${((1 + (2 * pad) / box.w) * 100).toFixed(3)}%`,
        height: `${((1 + (2 * pad) / box.h) * 100).toFixed(3)}%`,
      }
    : { x: '-30%', y: '-30%', width: '160%', height: '160%' };

  useEffect(() => {
    // Static on touch: 'hover' can never fire without a pointer, and the
    // 'always' flicker isn't worth a permanent SVG filter re-render on a phone.
    if (animate === 'never' || prefersReduced || isTouch) return;
    const el = tileRef.current;
    if (!el) return;

    let raf = 0;
    let last = 0;
    // Flicker by stepping through the other pre-rendered sheets of fiber,
    // standing in for the old per-frame reseed.
    let i = 0;
    const place = (n: number) => {
      el.setAttribute('href', fiberTileUrl(noiseThreshold, variant + n));
    };
    const tick = (t: number) => {
      if (t - last > 83) {
        i += 1;
        place(i);
        last = t;
      }
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf) return;
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      i = 0;
      place(0);
    };

    if (animate === 'always') {
      // Actually cancel the RAF off-screen.
      const io = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) start();
        else stop();
      }, { threshold: 0 });
      if (wrapperRef.current) io.observe(wrapperRef.current);
      start();
      return () => { stop(); io.disconnect(); };
    }

    // animate === 'hover' — attach listeners to the hover host
    const host = findHoverHost(wrapperRef.current);
    if (!host) return;
    host.addEventListener('mouseenter', start);
    host.addEventListener('mouseleave', stop);
    return () => {
      host.removeEventListener('mouseenter', start);
      host.removeEventListener('mouseleave', stop);
      stop();
    };
  }, [animate, prefersReduced, isTouch, noiseThreshold, variant]);

  return (
    <span
      ref={wrapperRef}
      className={[styles.wrapper, className ?? ''].filter(Boolean).join(' ')}
      style={{ isolation: isolateBlend ? 'isolate' : 'auto' }}
    >
      {/* Hidden defs SVG */}
      <svg className={styles.defs} aria-hidden="true" focusable="false" width="0" height="0">
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB" {...region}>
            {/* 1. Expand the content silhouette outward (skipped when the
                spread is too small to show) */}
            {dilate && (
              <feMorphology in="SourceAlpha" operator="dilate" radius={spread} result="expanded" />
            )}

            {/* 2. Soften the expanded edge */}
            <feGaussianBlur in={dilate ? 'expanded' : 'SourceAlpha'} stdDeviation={softness} result="expandedEdge" />

            {/* 3. Paper-fiber mask: one pre-rendered tile, repeated */}
            <feImage
              ref={tileRef}
              href={fiberTileUrl(noiseThreshold, variant)}
              x={0}
              y={0}
              width={tileSize}
              height={tileSize}
              preserveAspectRatio="none"
              result="fiberTile"
            />
            <feTile in="fiberTile" result="grain" />

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
