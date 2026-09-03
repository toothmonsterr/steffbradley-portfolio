import React, { useId, useRef } from 'react';
import { useAnimationTier } from '@/hooks/useAnimationTier';
import styles from './PaperTexture.module.css';

// ---------------------------------------------------------------------------
// Paper texture — subtractive, not additive.
//
// The other mask components (NoiseMask, HalftoneMask, OffsetCMYK) all end with
//   <feFlood floodColor={color}/> + <feComposite operator="in"/>
// which DISCARDS the source pixels and keeps only the mask shape as alpha.
// That is why a photo or GIF put through them comes out as a flat silhouette.
//
// This component instead keeps SourceGraphic and uses the noise purely as an
// alpha channel, so the content shows through at full colour and the texture
// only ever *removes* pixels — the ink-not-taking-on-rough-paper look.
//
//   grain      = thresholded fractal noise (the paper tooth)
//   coverage   = grain, optionally biased by source luminance
//   result     = SourceGraphic masked by coverage
//
// Cost note: this is ONE filter chain with one feTurbulence, versus four full
// chains in OffsetCMYK. feTurbulence is still the expensive primitive here, so
// `animate` defaults to off — a static seed lets the browser cache the filter
// result instead of regenerating it every frame.
// ---------------------------------------------------------------------------

const LUMA_MATRIX = '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.299 0.587 0.114 0 0';

/**
 * Discrete threshold table for the grain.
 * coverage 0 → almost everything knocked out; 100 → almost nothing removed.
 */
function grainTable(coverage: number): string {
  const n = 10;
  const ones = Math.round(Math.max(0, Math.min(n, (coverage / 100) * n)));
  return Array.from({ length: n }, (_, i) => (i >= n - ones ? 1 : 0)).join(' ');
}

/**
 * Luminance → how much the texture bites. Positive `k` makes the texture eat
 * into dark areas (ink starved), negative flips it to the highlights.
 */
function lumaBiasTable(k: number): string {
  const n = 9;
  const inverted = k < 0;
  const p = Math.max(0.1, Math.abs(k));
  const values: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    values.push(Math.max(0, Math.min(1, Math.pow(inverted ? 1 - t : t, 1 / p))));
  }
  return values.map((v) => v.toFixed(3)).join(' ');
}

export interface PaperTextureProps {
  /** Slot — image, GIF, text, anything. Colours are preserved. */
  children?: React.ReactNode;
  /** Grain coarseness — larger = chunkier flecks */
  step?: number;
  /**
   * How much of the content survives (0–100). 100 = untouched,
   * lower values eat away more of it. Default 80 = a light tooth.
   */
  coverage?: number;
  /**
   * Softens the knocked-out edges (px). 0 = hard binary flecks (screenprint),
   * ~0.5–1 = a softer, more absorbent paper.
   */
  softness?: number;
  /**
   * Bias the texture by the content's own brightness.
   *   0        — uniform: the texture bites everywhere equally (default)
   *   positive — bites into dark areas, as if ink ran out
   *   negative — bites into highlights
   */
  lumaBias?: number;
  /** Noise seed — change for a different paper sheet */
  seed?: number;
  /**
   * Animate the grain (reseeds ~12fps). Off by default: a static seed lets the
   * browser cache the filter result, and an animated feTurbulence over a
   * moving GIF is one of the most expensive things a mobile GPU can be asked
   * to do. Respects prefers-reduced-motion and is skipped on touch.
   */
  animate?: boolean;
  className?: string;
}

export function PaperTexture({
  children,
  step = 3,
  coverage = 80,
  softness = 0,
  lumaBias = 0,
  seed = 1,
  animate = false,
  className,
}: PaperTextureProps) {
  const uid = useId().replace(/:/g, '');
  const filterId = `paper-${uid}`;
  const hostRef = useRef<HTMLSpanElement>(null);

  const freq = (0.5 / Math.max(1, step)).toFixed(4);
  const tv = grainTable(coverage);
  const useLuma = lumaBias !== 0;

  return (
    <span ref={hostRef} className={[styles.wrapper, className ?? ''].filter(Boolean).join(' ')}>
      <svg className={styles.defs} aria-hidden="true" focusable="false" width="0" height="0">
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
            {/* 1. Paper tooth: fractal noise thresholded to hard flecks. */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency={freq}
              numOctaves={2}
              seed={seed}
              stitchTiles="stitch"
              result="noise"
            />
            <feColorMatrix type="saturate" values="0" in="noise" result="grey" />
            <feComponentTransfer in="grey" result="grain">
              <feFuncA type="discrete" tableValues={tv} />
            </feComponentTransfer>

            {/* 2. Optionally bias the tooth by the content's own luminance. */}
            {useLuma && (
              <>
                <feColorMatrix type="matrix" values={LUMA_MATRIX} in="SourceGraphic" result="luma" />
                <feComponentTransfer in="luma" result="lumaWeight">
                  <feFuncA type="table" tableValues={lumaBiasTable(lumaBias)} />
                </feComponentTransfer>
                <feComposite in="grain" in2="lumaWeight" operator="in" result="biasedGrain" />
              </>
            )}

            {/* 3. Clip the tooth to where the content actually exists, so we
                   never punch holes in already-transparent space. */}
            <feComposite
              in={useLuma ? 'biasedGrain' : 'grain'}
              in2="SourceAlpha"
              operator="in"
              result="clipped"
            />

            {/* Soften the knocked-out edges. Separate result name — a
                primitive cannot take its own result as input. */}
            {softness > 0 && (
              <feGaussianBlur in="clipped" stdDeviation={softness} result="softened" />
            )}

            {/* 4. The whole point: keep SourceGraphic and use the tooth as
                   alpha. No feFlood, so the content's own colours survive and
                   the texture only subtracts. */}
            <feComposite in="SourceGraphic" in2={softness > 0 ? 'softened' : 'clipped'} operator="in" />
          </filter>
        </defs>
      </svg>

      <span className={styles.inner} style={{ filter: `url(#${filterId})` }}>
        {children}
      </span>

      {animate && <AnimatedSeed filterId={filterId} seed={seed} hostRef={hostRef} />}
    </span>
  );
}

/**
 * Reseeds the feTurbulence for a live grain crawl. Split into its own
 * component so the hooks it needs are not paid for by the static default.
 */
function AnimatedSeed({
  filterId,
  seed,
  hostRef,
}: {
  filterId: string;
  seed: number;
  hostRef: React.RefObject<HTMLSpanElement | null>;
}) {
  const { prefersReduced, isTouch } = useAnimationTier();

  React.useEffect(() => {
    if (prefersReduced || isTouch) return;
    const turb = document.getElementById(filterId)?.querySelector('feTurbulence');
    const host = hostRef.current;
    if (!turb || !host) return;

    let raf = 0;
    let last = 0;
    let s = seed;

    const tick = (t: number) => {
      if (t - last > 83) {
        s = (s + 1) % 1000;
        turb.setAttribute('seed', String(s));
        last = t;
      }
      raf = requestAnimationFrame(tick);
    };
    const start = () => { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      turb.setAttribute('seed', String(seed));
      s = seed;
    };

    // Observe the wrapper, not the <filter> — SVG defs have no layout box, so
    // an IntersectionObserver on them never reports as intersecting.
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start();
      else stop();
    }, { threshold: 0 });
    io.observe(host);

    return () => { stop(); io.disconnect(); };
  }, [filterId, seed, prefersReduced, isTouch, hostRef]);

  return null;
}
