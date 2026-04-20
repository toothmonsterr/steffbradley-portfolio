import React, { useId } from 'react';
import styles from './InkBleed.module.css';

export interface InkBleedProps {
  children?: React.ReactNode;
  bleedColor?: string;
  /** How far the ink spreads from the content edge in px (feMorphology dilate radius) */
  spread?: number;
  /** Softness of the expanded edge — higher = more diffuse halo */
  softness?: number;
  /** feTurbulence baseFrequency — lower = chunkier fiber, higher = finer grain */
  noiseFrequency?: number;
  /** Fraction 0–1 controlling fiber sparseness: 0 = dense, 1 = sparse */
  noiseThreshold?: number;
  blendMode?: React.CSSProperties['mixBlendMode'];
  className?: string;
}

export function InkBleed({
  children,
  bleedColor     = '#201B2A',
  spread         = 8,
  softness       = 4,
  noiseFrequency = 0.08,
  noiseThreshold = 0.5,
  blendMode,
  className,
}: InkBleedProps) {
  const uid      = useId().replace(/:/g, '');
  const filterId = `inkbleed-${uid}`;

  // Build a discrete tableValues string for feFuncA.
  // noiseThreshold=0 → dense fiber (many ones), 1 → sparse (few ones).
  const N    = 10;
  const ones = Math.max(1, Math.min(N - 1, Math.round((1 - noiseThreshold) * N)));
  const tv   = Array.from({ length: N }, (_, i) => (i >= N - ones ? 1 : 0)).join(' ');

  return (
    <span className={[styles.wrapper, className ?? ''].filter(Boolean).join(' ')}>
      {/* Hidden defs SVG — same pattern as OffsetShape */}
      <svg className={styles.defs} aria-hidden="true" focusable="false" width="0" height="0">
        <defs>
          <filter
            id={filterId}
            colorInterpolationFilters="sRGB"
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            {/* ── 1. Expand the content silhouette outward ─────────────────── */}
            <feMorphology in="SourceAlpha" operator="dilate" radius={spread} result="expanded" />

            {/* ── 2. Soften the expanded edge ──────────────────────────────── */}
            <feGaussianBlur in="expanded" stdDeviation={softness} result="expandedEdge" />

            {/* ── 3. Paper-fiber noise mask ────────────────────────────────── */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency={noiseFrequency.toFixed(4)}
              numOctaves="3"
              stitchTiles="stitch"
              result="noise"
            />
            {/* Map noise RGB luminance → alpha so we can threshold it */}
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.299 0.587 0.114 0 0"
              in="noise"
              result="noiseAlpha"
            />
            {/* Binary threshold → fiber mask (1 = ink, 0 = clear paper) */}
            <feComponentTransfer in="noiseAlpha" result="grain">
              <feFuncA type="discrete" tableValues={tv} />
            </feComponentTransfer>

            {/* ── 4. Clip bleed region by paper fiber ─────────────────────── */}
            <feComposite in="expandedEdge" in2="grain" operator="in" result="roughBleed" />

            {/* ── 5. Colorise with ink color ───────────────────────────────── */}
            <feFlood floodColor={bleedColor} result="ink" />
            <feComposite in="ink" in2="roughBleed" operator="in" result="bleedLayer" />

            {/* ── 6. Composite: bleed behind original content ──────────────── */}
            <feMerge>
              <feMergeNode in="bleedLayer" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <span
        className={styles.filterShell}
        style={{ filter: `url(#${filterId})`, mixBlendMode: blendMode }}
      >
        {children}
      </span>
    </span>
  );
}
