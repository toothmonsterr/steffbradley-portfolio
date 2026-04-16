import React, { useId, useMemo } from 'react';
import { motion, type Variants } from 'motion/react';
import styles from './OffsetPrint.module.css';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export interface OffsetPrintProps {
  children?: React.ReactNode;
  colorA?: string;
  colorB?: string;
  overlapColor?: string;
  offsetX?: number;
  offsetY?: number;
  blendMode?: 'multiply' | 'darken' | 'screen' | 'overlay';
  /**
   * 'hover'   — misregistered at rest; snaps into alignment on hover (registering).
   * 'always'  — permanent misregistration, no hover reaction.
   * 'inverse' — aligned at rest; misregisters on hover.
   */
  interaction?: 'hover' | 'always' | 'inverse';
  /** Sub-pixel wobble magnitude for an organic hand-printed feel (px) */
  jitter?: number;
  className?: string;
}

export function OffsetPrint({
  children,
  colorA = '#FF6A50',
  colorB = '#DDEA44',
  overlapColor,
  offsetX = 4,
  offsetY = 3,
  blendMode = 'multiply',
  interaction = 'hover',
  jitter = 1.2,
  className,
}: OffsetPrintProps) {
  const uid = useId().replace(/:/g, '');
  const filterAId = `tint-a-${uid}`;
  const filterBId = `tint-b-${uid}`;
  const overlapId = `overlap-${uid}`;
  const prefersReduced = usePrefersReducedMotion();

  // Deterministic per-layer jitter so SSR === CSR. Three waypoints for a gentle drift loop.
  const wobbleA = useMemo(() => buildWobble(uid.charCodeAt(0) + 1, jitter), [uid, jitter]);
  const wobbleB = useMemo(() => buildWobble(uid.charCodeAt(0) + 2, jitter), [uid, jitter]);

  // "Rest" = misregistered (default); "registered" = snapped into alignment.
  // interaction drives which one the wrapper is in at rest vs hover.
  const misreg = { x: offsetX, y: offsetY };
  const registered = { x: 0.5, y: 0.5 }; // tiny residual for an inky edge, even when "aligned"

  // Build per-layer variants. sign = -1 for Layer A (negative offset), 1 for Layer B.
  const buildVariants = (sign: 1 | -1, w: number[][]): Variants => {
    const breathe = {
      x: [sign * misreg.x + w[0][0], sign * misreg.x + w[1][0], sign * misreg.x + w[2][0], sign * misreg.x + w[0][0]],
      y: [sign * misreg.y + w[0][1], sign * misreg.y + w[1][1], sign * misreg.y + w[2][1], sign * misreg.y + w[0][1]],
      rotate: [w[0][2], w[1][2], w[2][2], w[0][2]],
      transition: {
        duration: 3.2 + (sign > 0 ? 0.4 : 0),
        ease: 'easeInOut' as const,
        repeat: Infinity,
      },
    };
    const snap = {
      x: sign * registered.x,
      y: sign * registered.y,
      rotate: 0,
      transition: { type: 'spring' as const, stiffness: 200, damping: 16 },
    };
    const still = { x: sign * misreg.x, y: sign * misreg.y, rotate: 0, transition: { duration: 0 } };

    if (prefersReduced) {
      return { rest: still, hover: still };
    }
    if (interaction === 'always') {
      return { rest: breathe, hover: breathe };
    }
    if (interaction === 'inverse') {
      // aligned at rest, misregister on hover (breathing kicks in on hover)
      return { rest: snap, hover: breathe };
    }
    // 'hover' (default): misregistered on rest, snap into place on hover
    return { rest: breathe, hover: snap };
  };

  const variantsA = useMemo(
    () => buildVariants(-1, wobbleA),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wobbleA, interaction, offsetX, offsetY, prefersReduced]
  );
  const variantsB = useMemo(
    () => buildVariants(1, wobbleB),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wobbleB, interaction, offsetX, offsetY, prefersReduced]
  );

  const bgCopy = (filterId: string) => (
    <span className={styles.bgOnly} style={{ filter: `url(#${filterId})` }}>
      <span className={styles.bgOnlyInner}>{children}</span>
    </span>
  );

  return (
    <motion.span
      className={[styles.wrapper, className ?? ''].filter(Boolean).join(' ')}
      initial="rest"
      animate="rest"
      whileHover={interaction === 'always' ? undefined : 'hover'}
    >
      <svg className={styles.defs} aria-hidden="true" focusable="false" width="0" height="0">
        <defs>
          <filter id={filterAId} colorInterpolationFilters="sRGB">
            <feFlood floodColor={colorA} result="flood" />
            <feComposite in="flood" in2="SourceAlpha" operator="in" />
          </filter>
          <filter id={filterBId} colorInterpolationFilters="sRGB">
            <feFlood floodColor={colorB} result="flood" />
            <feComposite in="flood" in2="SourceAlpha" operator="in" />
          </filter>
          {overlapColor && (
            <filter id={overlapId} colorInterpolationFilters="sRGB">
              <feFlood floodColor={overlapColor} result="flood" />
              <feComposite in="flood" in2="SourceAlpha" operator="in" />
            </filter>
          )}
        </defs>
      </svg>

      {/* Layer A */}
      <motion.span
        className={styles.layer}
        aria-hidden="true"
        inert
        variants={variantsA}
        style={{ mixBlendMode: blendMode }}
      >
        {bgCopy(filterAId)}
      </motion.span>

      {/* Layer B */}
      <motion.span
        className={styles.layer}
        aria-hidden="true"
        inert
        variants={variantsB}
        style={{ mixBlendMode: blendMode }}
      >
        {bgCopy(filterBId)}
      </motion.span>

      {/* Overlap layer — silhouette filled with overlapColor, no offset, no breathing. */}
      {overlapColor && (
        <span className={styles.layer} aria-hidden="true" inert>
          {bgCopy(overlapId)}
        </span>
      )}

      {/* Real, interactive child */}
      <span className={styles.sizer}>{children}</span>
    </motion.span>
  );
}

function buildWobble(seed: number, mag: number): number[][] {
  const rand = mulberry32(seed);
  const pt = () => [
    (rand() * 2 - 1) * mag,
    (rand() * 2 - 1) * mag,
    (rand() * 2 - 1) * 0.3,
  ];
  return [pt(), pt(), pt()];
}

function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
