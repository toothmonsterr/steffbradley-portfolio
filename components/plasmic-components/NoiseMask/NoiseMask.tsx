import React, { useId } from 'react';
import styles from './NoiseMask.module.css';

function noiseTableValues(contrast: number): string {
  const n = 10;
  const ones = Math.round(Math.max(1, Math.min(n - 1, (contrast / 100) * n)));
  return Array.from({ length: n }, (_, i) => (i >= n - ones ? 1 : 0)).join(' ');
}

const LUMA_MATRIX = '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.299 0.587 0.114 0 0';

function invTable(contrast: number): string {
  const n = 9;
  const inverted = contrast < 0;
  const k = Math.max(0.1, Math.abs(contrast));
  const values: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    values.push(Math.max(0, Math.min(1, Math.pow(inverted ? t : 1 - t, 1 / k))));
  }
  return values.map((v) => v.toFixed(3)).join(' ');
}

export interface NoiseMaskProps {
  /** Slot — text, image, anything. The grain mask is clipped to the rendered alpha. */
  children?: React.ReactNode;
  /** Ink color */
  color?: string;
  /** Grain coarseness — larger = chunkier grain */
  step?: number;
  /** Grain density (0–100) — higher = more pixels filled */
  contrast?: number;
  /** Luminance contrast of the image separation — higher = richer ink in dark areas */
  imageContrast?: number;
  /** Noise seed — different integers give different grain patterns */
  seed?: number;
  /** CSS mix-blend-mode */
  blendMode?: 'normal' | 'multiply' | 'darken' | 'screen' | 'overlay' | 'soft-light';
  /**
   * When true, the blend mode only affects content within this component
   * (via `isolation: isolate`). When false (default), the grain blends with
   * whatever is behind the component on the page.
   */
  isolateBlend?: boolean;
  className?: string;
}

export function NoiseMask({
  children,
  color = '#000000',
  step = 4,
  contrast = 60,
  imageContrast = 1.3,
  seed = 1,
  blendMode = 'normal',
  isolateBlend = false,
  className,
}: NoiseMaskProps) {
  const uid = useId().replace(/:/g, '');
  const filterId = `nmask-${uid}`;
  const freq = (0.4 / Math.max(1, step)).toFixed(4);
  const tv = noiseTableValues(contrast);

  return (
    <span
      className={[styles.wrapper, className ?? ''].filter(Boolean).join(' ')}
      style={{ isolation: isolateBlend ? 'isolate' : 'auto' }}
    >
      <svg className={styles.defs} aria-hidden="true" focusable="false" width="0" height="0">
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
            <feColorMatrix type="matrix" values={LUMA_MATRIX} result="luma" />
            <feComponentTransfer in="luma" result="lumaMasked">
              <feFuncA type="table" tableValues={invTable(imageContrast)} />
            </feComponentTransfer>
            <feComposite in="lumaMasked" in2="SourceAlpha" operator="in" result="imageMask" />
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
              <feFuncR type="discrete" tableValues={tv} />
              <feFuncG type="discrete" tableValues={tv} />
              <feFuncB type="discrete" tableValues={tv} />
              <feFuncA type="discrete" tableValues={tv} />
            </feComponentTransfer>
            <feComposite in="grain" in2="imageMask" operator="in" result="maskedGrain" />
            <feFlood floodColor={color} result="ink" />
            <feComposite in="ink" in2="maskedGrain" operator="in" />
          </filter>
        </defs>
      </svg>
      <span
        className={styles.inner}
        style={{
          filter: `url(#${filterId})`,
          mixBlendMode: blendMode as React.CSSProperties['mixBlendMode'],
          position: 'relative',
          display: 'inline-block',
        }}
      >
        {children}
      </span>
    </span>
  );
}
