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
  /**
   * 'auto'  — detects images in children and uses luminance separation for them (default).
   * 'shape' — always treats children as a shape; tint fills the silhouette.
   * 'image' — always uses luminance separation (dark pixels become ink; light fades to transparent).
   */
  mode?: 'auto' | 'shape' | 'image';
  /** Contrast curve for image-mode luminance → alpha. Higher = deeper blacks, brighter whites. */
  imageContrast?: number;
  className?: string;
}

// Walks a React children tree and returns true if any node is an <img>, <picture>, <video>, or SVG <image>.
function childrenContainImage(children: React.ReactNode): boolean {
  let found = false;
  React.Children.forEach(children, (child) => {
    if (found) return;
    if (!React.isValidElement(child)) return;
    const type = child.type as unknown;
    if (type === 'img' || type === 'picture' || type === 'video' || type === 'image') {
      found = true;
      return;
    }
    const props = child.props as { children?: React.ReactNode } | undefined;
    if (props?.children && childrenContainImage(props.children)) {
      found = true;
    }
  });
  return found;
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
  mode = 'auto',
  imageContrast = 1.3,
  className,
}: OffsetPrintProps) {
  const uid = useId().replace(/:/g, '');
  const filterAId = `tint-a-${uid}`;
  const filterBId = `tint-b-${uid}`;
  const overlapId = `overlap-${uid}`;
  const lumaAId = `luma-a-${uid}`;
  const lumaBId = `luma-b-${uid}`;
  const lumaOverlapId = `luma-overlap-${uid}`;
  const prefersReduced = usePrefersReducedMotion();

  // Decide whether this instance is in image mode.
  const isImageMode = useMemo(() => {
    if (mode === 'image') return true;
    if (mode === 'shape') return false;
    return childrenContainImage(children);
  }, [mode, children]);

  const wobbleA = useMemo(() => buildWobble(uid.charCodeAt(0) + 1, jitter), [uid, jitter]);
  const wobbleB = useMemo(() => buildWobble(uid.charCodeAt(0) + 2, jitter), [uid, jitter]);

  const misreg = { x: offsetX, y: offsetY };
  const registered = { x: 0.5, y: 0.5 };

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

    if (prefersReduced) return { rest: still, hover: still };
    if (interaction === 'always') return { rest: breathe, hover: breathe };
    if (interaction === 'inverse') return { rest: snap, hover: breathe };
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

  // Shape-mode copy: duplicates children with foreground stripped (color: transparent),
  // leaving only backgrounds/borders visible, then floods the alpha with the tint color.
  const shapeCopy = (filterId: string) => (
    <span className={styles.bgOnly} style={{ filter: `url(#${filterId})` }}>
      <span className={styles.bgOnlyInner}>{children}</span>
    </span>
  );

  // Image-mode copy: duplicates children without stripping, then runs the luma filter
  // that converts image luminance into alpha (dark→opaque) and floods with the tint.
  const imageCopy = (filterId: string) => (
    <span className={styles.imageLayer} style={{ filter: `url(#${filterId})` }}>
      <span className={styles.imageInner}>{children}</span>
    </span>
  );

  const layerCopy = (shapeFilter: string, imageFilter: string) =>
    isImageMode ? imageCopy(imageFilter) : shapeCopy(shapeFilter);

  return (
    <motion.span
      className={[styles.wrapper, className ?? ''].filter(Boolean).join(' ')}
      initial="rest"
      animate="rest"
      whileHover={interaction === 'always' ? undefined : 'hover'}
    >
      <svg className={styles.defs} aria-hidden="true" focusable="false" width="0" height="0">
        <defs>
          {/* Shape-mode filters — flood the entire silhouette with a solid color */}
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

          {/* Image-mode filters — convert luminance to alpha, then tint.
              The matrix below puts luminance into the alpha channel and zeros out RGB;
              feComponentTransfer then inverts alpha so DARK pixels are OPAQUE (ink),
              LIGHT pixels fade to transparent. feFlood + feComposite paints that
              alpha with the target color. */}
          <filter id={lumaAId} colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values={[
                '0 0 0 0 0',
                '0 0 0 0 0',
                '0 0 0 0 0',
                '0.299 0.587 0.114 0 0',
              ].join(' ')}
              result="luma"
            />
            <feComponentTransfer in="luma" result="inverted">
              <feFuncA type="table" tableValues={invTable(imageContrast)} />
            </feComponentTransfer>
            <feFlood floodColor={colorA} result="flood" />
            <feComposite in="flood" in2="inverted" operator="in" />
          </filter>
          <filter id={lumaBId} colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values={[
                '0 0 0 0 0',
                '0 0 0 0 0',
                '0 0 0 0 0',
                '0.299 0.587 0.114 0 0',
              ].join(' ')}
              result="luma"
            />
            <feComponentTransfer in="luma" result="inverted">
              <feFuncA type="table" tableValues={invTable(imageContrast)} />
            </feComponentTransfer>
            <feFlood floodColor={colorB} result="flood" />
            <feComposite in="flood" in2="inverted" operator="in" />
          </filter>
          {overlapColor && (
            <filter id={lumaOverlapId} colorInterpolationFilters="sRGB">
              <feColorMatrix
                type="matrix"
                values={[
                  '0 0 0 0 0',
                  '0 0 0 0 0',
                  '0 0 0 0 0',
                  '0.299 0.587 0.114 0 0',
                ].join(' ')}
                result="luma"
              />
              <feComponentTransfer in="luma" result="inverted">
                <feFuncA type="table" tableValues={invTable(imageContrast)} />
              </feComponentTransfer>
              <feFlood floodColor={overlapColor} result="flood" />
              <feComposite in="flood" in2="inverted" operator="in" />
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
        {layerCopy(filterAId, lumaAId)}
      </motion.span>

      {/* Layer B */}
      <motion.span
        className={styles.layer}
        aria-hidden="true"
        inert
        variants={variantsB}
        style={{ mixBlendMode: blendMode }}
      >
        {layerCopy(filterBId, lumaBId)}
      </motion.span>

      {/* Overlap layer */}
      {overlapColor && (
        <span className={styles.layer} aria-hidden="true" inert>
          {layerCopy(overlapId, lumaOverlapId)}
        </span>
      )}

      {/* Real, interactive child.
          In image mode it stays in the DOM for layout + a11y but is invisible —
          the visible rendering is entirely the two tinted luma separations. */}
      <span
        className={styles.sizer}
        style={isImageMode ? { visibility: 'hidden' } : undefined}
      >
        {children}
      </span>
    </motion.span>
  );
}

// Inverts a 0-1 ramp and applies a contrast curve.
// Returns a space-separated tableValues string for feFuncA.
function invTable(contrast: number): string {
  const n = 9;
  const k = Math.max(0.1, contrast);
  const values: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);          // 0 → 1 across luminance
    const inv = 1 - t;               // dark → opaque
    // Symmetric contrast: push towards the ends
    const shaped = Math.pow(inv, 1 / k);
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
