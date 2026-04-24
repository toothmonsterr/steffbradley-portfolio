import React, { useId } from 'react';
import styles from './NoiseMask.module.css';
import { NextImage } from '../NextImage/NextImage';

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
  /** Image URL to apply the noise mask to */
  src?: string;
  /** Intrinsic image width in px for Next.js optimization (default 800) */
  width?: number;
  /** Intrinsic image height in px for Next.js optimization (default 600) */
  height?: number;
  /** Mark as high-priority to disable lazy loading (above-the-fold) */
  priority?: boolean;
  /** Image quality 1–100 (default 75) */
  quality?: number;
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
  className?: string;
}

export function NoiseMask({
  src,
  width = 800,
  height = 600,
  priority = false,
  quality,
  color = '#000000',
  step = 4,
  contrast = 60,
  imageContrast = 1.3,
  seed = 1,
  blendMode = 'normal',
  className,
}: NoiseMaskProps) {
  const uid = useId().replace(/:/g, '');
  const filterId = `nmask-${uid}`;
  const freq = (0.4 / Math.max(1, step)).toFixed(4);
  const tv = noiseTableValues(contrast);

  return (
    <span className={[styles.wrapper, className ?? ''].filter(Boolean).join(' ')}>
      <svg className={styles.defs} aria-hidden="true" focusable="false" width="0" height="0">
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
            {/* Luminance separation: dark image areas = more ink */}
            <feColorMatrix type="matrix" values={LUMA_MATRIX} result="luma" />
            <feComponentTransfer in="luma" result="lumaMasked">
              <feFuncA type="table" tableValues={invTable(imageContrast)} />
            </feComponentTransfer>
            <feComposite in="lumaMasked" in2="SourceAlpha" operator="in" result="imageMask" />
            {/* Noise grain clipped by luminance mask */}
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
          width,
          maxWidth: '100%',
          aspectRatio: `${width} / ${height}`,
        }}
      >
        {src && (
          <NextImage
            src={src}
            fill
            objectFit="contain"
            priority={priority}
            quality={quality}
            className={styles.image}
          />
        )}
      </span>
    </span>
  );
}
