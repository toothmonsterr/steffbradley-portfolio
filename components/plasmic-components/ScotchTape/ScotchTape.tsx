import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { mulberry32 } from '../OffsetShape/shared';
import styles from './ScotchTape.module.css';

// Hash a string to a 32-bit integer (FNV-1a). Used to derive deterministic
// per-instance jitter so each ScotchTape has its own tooth profile while
// staying SSR-stable.
function hashId(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface ScotchTapeProps {
  /** Slot — what's "under" the tape (a label, image, etc.). Leave empty for pure decoration. */
  children?: React.ReactNode;
  /** Tooth size in px — distance between zigzag points along the short edges (default 8) */
  toothSize?: number;
  /** Per-tooth random height variation, 0–1 (default 0.2). 0 = perfectly geometric. */
  toothJitter?: number;
  /** Slight tilt in degrees — real tape is rarely applied straight (default -2) */
  rotation?: number;
  className?: string;
}

// Build a CSS clip-path polygon describing a rectangle with sawtooth serrations
// on the short (left + right) edges. Coordinates are in px relative to the
// element's measured size; the polygon is flattened to "Xpx Ypx" pairs.
function buildClipPath(
  width: number,
  height: number,
  toothSize: number,
  toothJitter: number,
  seed: number,
): string {
  if (width <= 0 || height <= 0 || toothSize <= 0) return 'none';

  const rand = mulberry32(seed);
  const tooth = Math.max(2, toothSize);
  // The "outer" x sits at the tape's nominal edge; the "inner" x cuts in by one
  // tooth width. Triangles alternate between outer (peak) and inner (valley).
  const innerLeft  = tooth;
  const innerRight = width - tooth;

  // We want roughly (height / tooth) teeth on each side, snapped to even count
  // so the corners line up cleanly.
  const teethCount = Math.max(2, Math.round(height / tooth));
  const stepY = height / teethCount;

  // Per-tooth jitter — slightly shifts the inner-x of each valley point so the
  // serration looks hand-torn rather than machine-cut. Jitter amount is a
  // fraction of `tooth` (clamped 0..1).
  const j = Math.max(0, Math.min(1, toothJitter));
  const jitter = () => (rand() * 2 - 1) * j * tooth * 0.5;

  const pts: string[] = [];

  // ─── Top edge: straight, left-to-right ──────────────────────────────
  pts.push(`0px 0px`);
  pts.push(`${width.toFixed(2)}px 0px`);

  // ─── Right edge: zigzag, top-to-bottom ──────────────────────────────
  // Walk down the right side. Even indices = peak (outer = full width),
  // odd indices = valley (inner, jittered toward center).
  for (let i = 1; i < teethCount; i++) {
    const y = i * stepY;
    if (i % 2 === 0) {
      pts.push(`${width.toFixed(2)}px ${y.toFixed(2)}px`);
    } else {
      const x = innerRight + jitter();
      pts.push(`${x.toFixed(2)}px ${y.toFixed(2)}px`);
    }
  }

  // ─── Bottom edge: straight, right-to-left ───────────────────────────
  pts.push(`${width.toFixed(2)}px ${height.toFixed(2)}px`);
  pts.push(`0px ${height.toFixed(2)}px`);

  // ─── Left edge: zigzag, bottom-to-top ───────────────────────────────
  for (let i = teethCount - 1; i >= 1; i--) {
    const y = i * stepY;
    if (i % 2 === 0) {
      pts.push(`0px ${y.toFixed(2)}px`);
    } else {
      const x = innerLeft + jitter();
      pts.push(`${x.toFixed(2)}px ${y.toFixed(2)}px`);
    }
  }

  return `polygon(${pts.join(', ')})`;
}

export function ScotchTape({
  children,
  toothSize   = 8,
  toothJitter = 0.2,
  rotation    = -2,
  className,
}: ScotchTapeProps) {
  const uid = useId().replace(/:/g, '');
  const seed = useMemo(() => hashId(uid), [uid]);

  // Measure the wrapper so the clip-path is built in pixel space — this keeps
  // teeth a constant size regardless of how the tape is sized in Studio.
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const r = entries[0]?.contentRect;
      if (r && r.width > 0 && r.height > 0) {
        setSize({ w: r.width, h: r.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const clipPath = useMemo(
    () => buildClipPath(size.w, size.h, toothSize, toothJitter, seed),
    [size.w, size.h, toothSize, toothJitter, seed],
  );

  return (
    // Outer .rotator: pure rotation transform, shrink-wraps the inner.
    // Inner .wrapper: receives Studio's className (size, background, shadow,
    // etc.) and applies the clip-path so all those styles trace the
    // serrated silhouette. Splitting prevents Studio-applied transforms from
    // overwriting our rotation.
    <span
      className={styles.rotator}
      style={{
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: 'center center',
      }}
    >
      <span
        ref={wrapperRef}
        className={[styles.wrapper, className ?? ''].filter(Boolean).join(' ')}
        style={{
          clipPath,
          WebkitClipPath: clipPath,
        }}
      >
        <span className={styles.content}>{children}</span>
      </span>
    </span>
  );
}
