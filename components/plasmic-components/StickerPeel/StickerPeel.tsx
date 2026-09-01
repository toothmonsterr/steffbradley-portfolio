import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animate, useMotionValue, useMotionValueEvent } from 'motion/react';
import styles from './StickerPeel.module.css';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

// useLayoutEffect warns during SSR; fall back to useEffect on the server.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// Parse a CSS color into "R, G, B" so we can re-compose with a separate
// opacity (so shadow opacity can animate independently). Falls back to black.
function parseRgbTriple(str: string): string {
  const trimmed = str.trim();
  // #rgb / #rrggbb
  let m = trimmed.match(/^#([0-9a-f]{3})$/i);
  if (m) {
    const [r, g, b] = m[1].split('').map(c => parseInt(c + c, 16));
    return `${r}, ${g}, ${b}`;
  }
  m = trimmed.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (m) return `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`;
  // rgb() / rgba()
  m = trimmed.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (m) return `${m[1]}, ${m[2]}, ${m[3]}`;
  return '0, 0, 0';
}

type Corner = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
type Trigger = 'hover' | 'always' | 'none';

export interface StickerPeelProps {
  children?: React.ReactNode;
  corner?: Corner;
  peelSize?: number;
  hoverPeelSize?: number;
  /** Color of the peel-back face — the underside revealed by the lifted flap. */
  backColor?: string;
  /**
   * Fill of the sticker body, painted by an SVG layer behind the content.
   * The peeled corner is a real hole in this shape, so whatever sits behind
   * the sticker shows through it.
   */
  fillColor?: string;
  /** Corner radius in px, applied to the three un-peeled corners. */
  borderRadius?: number;
  shadowColor?: string;
  shadowBlur?: number;
  /**
   * Tilts the flap out of the page for a 3D lift. 0 = flat. Reasonable range
   * 10–45° — past 60° the flap goes near edge-on and mostly disappears.
   */
  tilt?: number;
  /** Perspective depth in px for the 3D tilt. Smaller = more dramatic foreshortening. */
  perspective?: number;
  trigger?: Trigger;
  easeDuration?: number;
  className?: string;
}

interface CornerCfg {
  peelPos: React.CSSProperties;
  peelClip: string;
  gradient: string;
  /** Rotation axis for the 3D tilt — always aligned with the fold diagonal,
   *  signed so positive tilt lifts the flap toward the viewer. */
  tiltAxis: [number, number, number];
}

const CORNER_CFG: Record<Corner, CornerCfg> = {
  'top-right': {
    peelPos: { top: 0, right: 0 },
    peelClip: 'polygon(0 0, 100% 100%, 0 100%)',
    gradient: 'to bottom left',
    tiltAxis: [1, 1, 0],
  },
  'top-left': {
    peelPos: { top: 0, left: 0 },
    peelClip: 'polygon(100% 0, 100% 100%, 0 100%)',
    gradient: 'to bottom right',
    tiltAxis: [1, -1, 0],
  },
  'bottom-right': {
    peelPos: { bottom: 0, right: 0 },
    peelClip: 'polygon(0 0, 100% 0, 0 100%)',
    gradient: 'to top left',
    tiltAxis: [-1, 1, 0],
  },
  'bottom-left': {
    peelPos: { bottom: 0, left: 0 },
    peelClip: 'polygon(0 0, 100% 0, 100% 100%)',
    gradient: 'to top right',
    tiltAxis: [-1, -1, 0],
  },
};

/**
 * Sticker body as an SVG path: a rounded rectangle whose peeled corner is
 * replaced by a straight diagonal cut. The peeled corner is genuinely absent
 * from the path, so it renders as a hole rather than a matching-colored patch.
 *
 * This lives in an SVG rather than a CSS clip-path because a clip-path on a
 * wrapper is defeated by any ancestor border-radius or overflow:hidden (which
 * Plasmic applies to component instances) — the SVG owns its own fill, so
 * nothing upstream can square the notch back off.
 */
function buildStickerPath(corner: Corner, w: number, h: number, peel: number, radius: number): string {
  // Never let the radius or peel exceed what the box can accommodate.
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  const s = Math.max(0, Math.min(peel, w, h));
  const p = (x: number, y: number) => `${x.toFixed(2)} ${y.toFixed(2)}`;
  const arc = (x: number, y: number) => `A ${r} ${r} 0 0 1 ${p(x, y)}`;

  switch (corner) {
    case 'top-right':
      return [
        `M ${p(r, 0)}`,
        `L ${p(w - s, 0)}`,
        `L ${p(w, s)}`,
        `L ${p(w, h - r)}`, arc(w - r, h),
        `L ${p(r, h)}`,     arc(0, h - r),
        `L ${p(0, r)}`,     arc(r, 0),
        'Z',
      ].join(' ');
    case 'top-left':
      return [
        `M ${p(s, 0)}`,
        `L ${p(w - r, 0)}`, arc(w, r),
        `L ${p(w, h - r)}`, arc(w - r, h),
        `L ${p(r, h)}`,     arc(0, h - r),
        `L ${p(0, s)}`,
        `L ${p(s, 0)}`,
        'Z',
      ].join(' ');
    case 'bottom-right':
      return [
        `M ${p(r, 0)}`,
        `L ${p(w - r, 0)}`, arc(w, r),
        `L ${p(w, h - s)}`,
        `L ${p(w - s, h)}`,
        `L ${p(r, h)}`,     arc(0, h - r),
        `L ${p(0, r)}`,     arc(r, 0),
        'Z',
      ].join(' ');
    case 'bottom-left':
      return [
        `M ${p(r, 0)}`,
        `L ${p(w - r, 0)}`, arc(w, r),
        `L ${p(w, h - r)}`, arc(w - r, h),
        `L ${p(s, h)}`,
        `L ${p(0, h - s)}`,
        `L ${p(0, r)}`,     arc(r, 0),
        'Z',
      ].join(' ');
  }
}

export function StickerPeel({
  children,
  corner = 'top-right',
  peelSize = 40,
  hoverPeelSize = 80,
  backColor = '#ffffff',
  fillColor = '#ffffff',
  borderRadius = 0,
  shadowColor = 'rgba(0,0,0,0.25)',
  shadowBlur = 10,
  tilt = 25,
  perspective = 800,
  trigger = 'hover',
  easeDuration = 0.4,
  className,
}: StickerPeelProps) {
  const cfg = CORNER_CFG[corner];
  const baseSize = trigger === 'always' ? hoverPeelSize : peelSize;
  const [ax, ay, az] = cfg.tiltAxis;
  const shadowRgb = parseRgbTriple(shadowColor);

  // For trigger='always', the rest state already shows the peel fully — so
  // skip the rest-vs-hover distinction and lock everything at the hover values.
  const isAlwaysOn = trigger === 'always';

  // The SVG path needs pixel dimensions, so the box has to be measured.
  const rootRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  // The peel size is animated as a number and the path regenerated from it each
  // frame. CSS `transition: d` only works in Chrome, so relying on it made the
  // notch snap in Safari and Firefox.
  const prefersReduced = usePrefersReducedMotion();
  const peelMv = useMotionValue(baseSize);
  const [animatedSize, setAnimatedSize] = useState(baseSize);
  useMotionValueEvent(peelMv, 'change', v => setAnimatedSize(v));

  useIsomorphicLayoutEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox(prev =>
        prev && prev.w === width && prev.h === height ? prev : { w: width, h: height }
      );
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Drive the motion value toward whichever size the current state calls for.
  const setPeelTarget = (target: number) => {
    if (prefersReduced) {
      peelMv.set(target);
      return;
    }
    animate(peelMv, target, { duration: easeDuration, ease: 'easeOut' });
  };

  // Keep in sync when the size props themselves change (e.g. edited in Studio).
  useIsomorphicLayoutEffect(() => {
    peelMv.set(baseSize);
    setAnimatedSize(baseSize);
  }, [baseSize, peelMv]);

  const activeSize = animatedSize;

  const wrapperStyle = {
    '--peel-size-base': `${baseSize}px`,
    '--peel-size-hover': `${hoverPeelSize}px`,
    '--ease-duration': `${easeDuration}s`,
    '--tilt-axis-x': ax,
    '--tilt-axis-y': ay,
    '--tilt-axis-z': az,
    '--tilt-target': `${tilt}deg`,
    '--shadow-blur-target': `${shadowBlur}px`,
    '--shadow-rgb': shadowRgb,
    // Always-on: pin tilt and shadow to the hover values so they don't sit at rest.
    ...(isAlwaysOn
      ? {
          '--tilt': `${tilt}deg`,
          '--shadow-blur': `${shadowBlur}px`,
          '--shadow-offset': '6px',
          '--shadow-opacity': '1',
        }
      : null),
    // Before measurement the SVG cannot be drawn, so the wrapper carries the
    // fill itself for that first frame — square-cornered, but never blank.
    // Once the SVG paints, it takes over and this is dropped so the notch
    // stays a genuine hole.
    backgroundColor: box ? undefined : fillColor,
    borderRadius: box ? undefined : borderRadius || undefined,
    perspective: `${perspective}px`,
  } as React.CSSProperties;

  return (
    <div
      ref={rootRef}
      className={[
        styles.wrapper,
        trigger === 'hover' ? styles.hoverTrigger : '',
        className ?? '',
      ].filter(Boolean).join(' ')}
      style={wrapperStyle}
      {...(trigger === 'hover'
        ? {
            onMouseEnter: () => setPeelTarget(hoverPeelSize),
            onMouseLeave: () => setPeelTarget(baseSize),
          }
        : null)}
    >
      {/* Sticker body. Painted behind the content and sized to the wrapper, so
          the notch is a real hole regardless of any ancestor clipping.

          Rendered only once measured: the path mixes absolute units (radius,
          peel size) with the box dimensions, so it cannot be expressed in a
          scalable viewBox without distorting the radius and the fold angle.
          The wrapper carries fillColor as a plain background until then, which
          keeps the sticker filled on first paint — square-cornered for one
          frame, rather than invisible. */}
      {box && box.w > 0 && box.h > 0 && (
        <svg
          className={styles.fill}
          width={box.w}
          height={box.h}
          viewBox={`0 0 ${box.w} ${box.h}`}
          aria-hidden="true"
          focusable="false"
        >
          <path
            className={styles.fillPath}
            d={buildStickerPath(corner, box.w, box.h, activeSize, borderRadius)}
            fill={fillColor}
          />
        </svg>
      )}

      <div className={styles.content}>{children}</div>

      <div
        className={styles.peel}
        aria-hidden="true"
        style={{
          ...cfg.peelPos,
          clipPath: cfg.peelClip,
          background: `linear-gradient(${cfg.gradient}, rgba(0,0,0,0.3) 0%, ${backColor} 60%)`,
          // transform + filter come from the CSS module — they read CSS vars
          // that swap between rest and hover states.
        }}
      />
    </div>
  );
}
