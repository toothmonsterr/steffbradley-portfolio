import React, { useId, useMemo } from 'react';
import { motion, type Variants } from 'motion/react';
import styles from './OffsetPrint.module.css';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export interface OffsetPrintProps {
  children?: React.ReactNode;
  colorA?: string;
  colorB?: string;
  offsetX?: number;
  offsetY?: number;
  blendMode?: 'multiply' | 'darken' | 'screen' | 'overlay';
  /**
   * 'hover'   — misregistered at rest; snaps into alignment on hover.
   * 'always'  — permanent misregistration, no hover reaction.
   * 'inverse' — aligned at rest; misregisters on hover.
   */
  interaction?: 'hover' | 'always' | 'inverse';
  /** Sub-pixel wobble magnitude for organic hand-printed feel (px) */
  jitter?: number;
  /**
   * 'shape' — floods the element's rendered silhouette with the ink color.
   *           Best for buttons and solid shapes with background-color.
   * 'image' — luminance separation: dark pixels become opaque ink, light fades out.
   *           Best for photos and icons / SVGs (preserves original transparency).
   */
  mode?: 'shape' | 'image';
  /** Contrast curve for image mode. Higher = deeper blacks, brighter highlights. */
  imageContrast?: number;
  /**
   * Whether to render the original children on top of the ink layers.
   * Defaults to true in shape mode (keeps button text readable),
   * false in image mode (ink layers are the full visual).
   * Set to false for icons in shape mode if you don't want the original showing.
   */
  showOriginal?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function invTable(contrast: number): string {
  const n = 9;
  const k = Math.max(0.1, contrast);
  const values: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const shaped = Math.pow(1 - t, 1 / k);
    values.push(Math.max(0, Math.min(1, shaped)));
  }
  return values.map((v) => v.toFixed(3)).join(' ');
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OffsetPrint({
  children,
  colorA        = '#FF6A50',
  colorB        = '#DDEA44',
  offsetX       = 4,
  offsetY       = 3,
  blendMode     = 'multiply',
  interaction   = 'hover',
  jitter        = 1.2,
  mode          = 'shape',
  imageContrast = 1.3,
  showOriginal,
  className,
}: OffsetPrintProps) {
  const uid        = useId().replace(/:/g, '');
  const filterAId  = `op-a-${uid}`;
  const filterBId  = `op-b-${uid}`;
  const prefersReduced = usePrefersReducedMotion();

  // showOriginal defaults to true for shape mode, false for image mode.
  const originalVisible = showOriginal !== undefined ? showOriginal : mode === 'shape';

  const wobbleA = useMemo(() => buildWobble(uid.charCodeAt(0) + 1, jitter), [uid, jitter]);
  const wobbleB = useMemo(() => buildWobble(uid.charCodeAt(0) + 2, jitter), [uid, jitter]);

  // Average of wobbleA and wobbleB — used for the sizer so it jiggles
  // in between the two ink layers rather than being perfectly still.
  const wobbleSizer = useMemo(
    () => wobbleA.map((ptA, i) => [
      (ptA[0] + wobbleB[i][0]) / 2,
      (ptA[1] + wobbleB[i][1]) / 2,
      (ptA[2] + wobbleB[i][2]) / 2,
    ]),
    [wobbleA, wobbleB]
  );

  const misreg     = { x: offsetX, y: offsetY };
  const registered = { x: 0.5, y: 0.5 };
  const springTransition = { type: 'spring' as const, stiffness: 200, damping: 16 };

  const buildVariants = (sign: 1 | -1, w: number[][]): Variants => {
    const breathe = {
      x: [sign * misreg.x + w[0][0], sign * misreg.x + w[1][0], sign * misreg.x + w[2][0], sign * misreg.x + w[0][0]],
      y: [sign * misreg.y + w[0][1], sign * misreg.y + w[1][1], sign * misreg.y + w[2][1], sign * misreg.y + w[0][1]],
      rotate: [w[0][2], w[1][2], w[2][2], w[0][2]],
      transition: { duration: 3.2 + (sign > 0 ? 0.4 : 0), ease: 'easeInOut' as const, repeat: Infinity },
    };
    const snap  = { x: sign * registered.x, y: sign * registered.y, rotate: 0, transition: springTransition };
    const still = { x: sign * misreg.x, y: sign * misreg.y, rotate: 0, transition: { duration: 0 } };

    if (prefersReduced) return { rest: still, hover: still };
    if (interaction === 'always')  return { rest: breathe, hover: breathe };
    if (interaction === 'inverse') return { rest: snap,    hover: breathe };
    return { rest: breathe, hover: snap };
  };

  // Sizer variants — no offset, just the averaged jitter so the original
  // content drifts subtly in between the two ink layers.
  const buildSizerVariants = (w: number[][]): Variants => {
    const breathe = {
      x: [w[0][0], w[1][0], w[2][0], w[0][0]],
      y: [w[0][1], w[1][1], w[2][1], w[0][1]],
      rotate: [w[0][2], w[1][2], w[2][2], w[0][2]],
      transition: { duration: 3.0, ease: 'easeInOut' as const, repeat: Infinity },
    };
    const snap  = { x: 0, y: 0, rotate: 0, transition: springTransition };
    const still = { x: 0, y: 0, rotate: 0, transition: { duration: 0 } };

    if (prefersReduced) return { rest: still, hover: still };
    if (interaction === 'always')  return { rest: breathe, hover: breathe };
    if (interaction === 'inverse') return { rest: snap,    hover: breathe };
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
  const variantsSizer = useMemo(
    () => buildSizerVariants(wobbleSizer),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wobbleSizer, interaction, prefersReduced]
  );

  const layerCopy = (filterId: string) => (
    <span className={styles.filterShell} style={{ filter: `url(#${filterId})` }}>
      <span className={styles.filterInner}>{children}</span>
    </span>
  );

  const shapeFilter = (id: string, color: string) => (
    <filter id={id} colorInterpolationFilters="sRGB">
      <feFlood floodColor={color} result="flood" />
      <feComposite in="flood" in2="SourceAlpha" operator="in" />
    </filter>
  );

  const lumaMatrix = '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.299 0.587 0.114 0 0';
  const imageFilter = (id: string, color: string) => (
    <filter id={id} colorInterpolationFilters="sRGB">
      <feColorMatrix type="matrix" values={lumaMatrix} result="luma" />
      <feComponentTransfer in="luma" result="lumaMasked">
        <feFuncA type="table" tableValues={invTable(imageContrast)} />
      </feComponentTransfer>
      <feComposite in="lumaMasked" in2="SourceAlpha" operator="in" result="masked" />
      <feFlood floodColor={color} result="flood" />
      <feComposite in="flood" in2="masked" operator="in" />
    </filter>
  );

  const filter = mode === 'image' ? imageFilter : shapeFilter;

  return (
    <motion.span
      className={[styles.wrapper, className ?? ''].filter(Boolean).join(' ')}
      initial="rest"
      animate="rest"
      whileHover={interaction === 'always' ? undefined : 'hover'}
    >
      <svg className={styles.defs} aria-hidden="true" focusable="false" width="0" height="0">
        <defs>
          {filter(filterAId, colorA)}
          {filter(filterBId, colorB)}
        </defs>
      </svg>

      {/* Layer A */}
      <motion.span
        className={styles.layer}
        aria-hidden="true"
        inert
        variants={variantsA}
        style={{ mixBlendMode: (originalVisible ? 'normal' : blendMode) as React.CSSProperties['mixBlendMode'] }}
      >
        {layerCopy(filterAId)}
      </motion.span>

      {/* Layer B */}
      <motion.span
        className={styles.layer}
        aria-hidden="true"
        inert
        variants={variantsB}
        style={{ mixBlendMode: (originalVisible ? 'normal' : blendMode) as React.CSSProperties['mixBlendMode'] }}
      >
        {layerCopy(filterBId)}
      </motion.span>

      {/* Original content — jiggles with the averaged wobble so it drifts
          subtly between the two ink layers rather than sitting perfectly still. */}
      {originalVisible && (
        <motion.span className={styles.sizer} variants={variantsSizer}>
          {children}
        </motion.span>
      )}

      {/* Hidden sizer — when original is not visible, still needed for layout. */}
      {!originalVisible && (
        <span className={styles.sizerHidden}>
          {children}
        </span>
      )}
    </motion.span>
  );
}
