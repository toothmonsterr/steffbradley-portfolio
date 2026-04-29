import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { mulberry32 } from '../OffsetShape/shared';
import styles from './TornSection.module.css';

// Hash a string to a 32-bit integer (FNV-1a). Used to derive deterministic
// seeds from React's useId so each instance gets its own tear shape without
// hydration mismatches.
function hashId(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}


// Number of virtual x-steps; higher = finer profile resolution.
const VSTEPS = 200;

// Returns an array of y-values (0–1) for the torn profile across VSTEPS+1 points.
function buildTornProfile(seed: number, roughness: number, stepSize: number): number[] {
  const rand = mulberry32(seed);
  const pts: number[] = [];
  // stepSize controls how many virtual units between each jagged point.
  // Smaller stepSize = more points = finer tear.
  const step = Math.max(1, stepSize);
  let x = 0;
  while (x <= VSTEPS) {
    pts.push(rand());
    x += step;
  }
  // Ensure we always cover to x=VSTEPS
  if (pts.length < 2) pts.push(rand());
  return pts;
}

// Converts a torn profile into a CSS clip-path polygon string.
// topProfile / bottomProfile are arrays of 0–1 y-values.
// topAmountPct / bottomAmountPct control how many % of the section height the tear occupies.
function buildClipPath(
  topProfile: number[] | null,
  topAmountPct: number,
  bottomProfile: number[] | null,
  bottomAmountPct: number,
): string {
  const pts: string[] = [];

  if (topProfile) {
    // Trace left→right along the top torn edge
    topProfile.forEach((y, i) => {
      const xPct = (i / (topProfile.length - 1)) * 100;
      // y=0 is the very top of the section, y=1 is deepest into the section
      const yPct = y * topAmountPct;
      pts.push(`${xPct.toFixed(2)}% ${yPct.toFixed(2)}%`);
    });
  } else {
    pts.push('0% 0%', '100% 0%');
  }

  // Right side: top-right → bottom-right
  pts.push(`100% ${bottomProfile ? `${(100 - bottomAmountPct).toFixed(2)}%` : '100%'}`);

  if (bottomProfile) {
    // Trace right→left along the bottom torn edge
    const reversed = [...bottomProfile].reverse();
    reversed.forEach((y, i) => {
      const xPct = (1 - i / (reversed.length - 1)) * 100;
      // y=0 is deepest cut into section, y=1 is the very bottom edge
      const yPct = 100 - y * bottomAmountPct;
      pts.push(`${xPct.toFixed(2)}% ${yPct.toFixed(2)}%`);
    });
  } else {
    pts.push('0% 100%');
  }

  // Left side closes the polygon back to start
  pts.push(`0% ${topProfile ? `${(topProfile[0] * topAmountPct).toFixed(2)}%` : '0%'}`);

  return `polygon(${pts.join(', ')})`;
}

export interface TornSectionProps {
  children?: React.ReactNode;
  /** Background slot — clipped to the torn shape. Drop in a solid color div, GradientBlob, NoiseOverlay, etc. */
  background?: React.ReactNode;

  // Top tear
  tornTop?: boolean;
  /** Vertical jitter of the top tear in px (constant regardless of section size) */
  tornTopRoughness?: number;
  tornTopStepSize?: number;
  /** How deep the top tear cuts into the section in px (constant regardless of section size) */
  tornTopDepthPx?: number;

  // Bottom tear
  tornBottom?: boolean;
  tornBottomRoughness?: number;
  tornBottomStepSize?: number;
  /** How deep the bottom tear cuts into the section in px */
  tornBottomDepthPx?: number;

  className?: string;
}

export function TornSection({
  children,
  background,
  tornTop = false,
  tornTopRoughness = 5,
  tornTopStepSize = 4,
  tornTopDepthPx = 24,
  tornBottom = false,
  tornBottomRoughness = 5,
  tornBottomStepSize = 4,
  tornBottomDepthPx = 24,
  className,
}: TornSectionProps) {
  // Two distinct per-instance seeds (top vs bottom) derived from useId so each
  // TornSection has its own shapes without hydration mismatch.
  const uid = useId().replace(/:/g, '');
  const tornTopSeed    = useMemo(() => hashId(uid + ':t'), [uid]);
  const tornBottomSeed = useMemo(() => hashId(uid + ':b'), [uid]);

  const topProfile = useMemo(
    () => tornTop ? buildTornProfile(tornTopSeed, tornTopRoughness, tornTopStepSize) : null,
    [tornTop, tornTopSeed, tornTopRoughness, tornTopStepSize],
  );

  const bottomProfile = useMemo(
    () => tornBottom ? buildTornProfile(tornBottomSeed, tornBottomRoughness, tornBottomStepSize) : null,
    [tornBottom, tornBottomSeed, tornBottomRoughness, tornBottomStepSize],
  );

  // Measure the section height so we can convert a px-based tear depth into
  // the % values clip-path requires. This keeps the tear a constant size
  // regardless of how tall the section grows.
  const sectionRef = useRef<HTMLDivElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState(0);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const h = entries[0]?.contentRect.height ?? 0;
      if (h > 0) setMeasuredHeight(h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const clipPath = useMemo(() => {
    // Pre-mount we don't yet have a measured height — render with no clip
    // (clip-path "none") so the background fills until the first measurement
    // arrives a frame later.
    if (measuredHeight <= 0) return undefined;
    const topPct    = Math.min(100, (tornTopDepthPx    / measuredHeight) * 100);
    const bottomPct = Math.min(100, (tornBottomDepthPx / measuredHeight) * 100);
    return buildClipPath(topProfile, topPct, bottomProfile, bottomPct);
  }, [topProfile, bottomProfile, tornTopDepthPx, tornBottomDepthPx, measuredHeight]);

  return (
    <div ref={sectionRef} className={[styles.section, className ?? ''].filter(Boolean).join(' ')}>
      {/* Absolutely-positioned background — clipped to the torn shape.
          clip-path lives here (not on root) so drop-shadow on root is not clipped. */}
      <div className={styles.bg} style={{ clipPath }}>
        {background}
      </div>
      {/* Content in normal flow — sizes the section when height is auto */}
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
