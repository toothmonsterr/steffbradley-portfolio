import React from 'react';
import { type TextureMode } from '../OffsetShape/shared';

// ---------------------------------------------------------------------------
// Per-channel CMYK separation filters.
//
// For each channel we:
//   1. Compute channel density (how much ink that channel contributes) via
//      an feColorMatrix that puts the density in the alpha channel.
//   2. Multiply by the SOURCE ALPHA — critical so transparent areas of the
//      source don't ink up to full density on every channel.
//   3. Run the alpha through a contrast curve (higher = darker inks).
//   4. Flood the resulting alpha with the ink color.
//
// Channel density formulas (RGB → CMY):
//   Cyan    = 1 - R
//   Magenta = 1 - G
//   Yellow  = 1 - B
//   Key     ≈ 1 - (R + G + B) / 3   (approximates min(1-R, 1-G, 1-B))
// ---------------------------------------------------------------------------

export type Channel = 'C' | 'M' | 'Y' | 'K';

const MATRIX_FOR: Record<Channel, string> = {
  C: '0 0 0 0 0   0 0 0 0 0   0 0 0 0 0   -1 0 0 0 1',
  M: '0 0 0 0 0   0 0 0 0 0   0 0 0 0 0    0 -1 0 0 1',
  Y: '0 0 0 0 0   0 0 0 0 0   0 0 0 0 0    0 0 -1 0 1',
  K: `0 0 0 0 0   0 0 0 0 0   0 0 0 0 0    ${-1/3} ${-1/3} ${-1/3} 0 1`,
};

function contrastTable(k: number): string {
  const n = 9;
  const power = Math.max(0.1, k);
  const values: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    values.push(Math.pow(t, 1 / power));
  }
  return values.map((v) => v.toFixed(3)).join(' ');
}

export function channelFilter(
  id: string, channel: Channel, color: string, contrast: number,
  texture: TextureMode, layerIndex: number, step: number, dotSize: number,
) {
  const densityChain = (
    <>
      <feColorMatrix type="matrix" values={MATRIX_FOR[channel]} result="density" />
      <feComposite in="density" in2="SourceAlpha" operator="in" result="maskedDensity" />
      <feComponentTransfer in="maskedDensity" result="curved">
        <feFuncA type="table" tableValues={contrastTable(contrast)} />
      </feComponentTransfer>
    </>
  );

  if (texture === 'halftone') {
    return (
      <filter id={id} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
        {densityChain}
        {/* href populated imperatively by useHalftoneScreen after mount */}
        <feImage href="" x="0" y="0" width="100%" height="100%" result="screen" preserveAspectRatio="none" />
        <feComposite in="screen" in2="curved" operator="in" result="dots" />
        <feFlood floodColor={color} result="ink" />
        <feComposite in="ink" in2="dots" operator="in" />
      </filter>
    );
  }

  if (texture === 'noise') {
    const freq = (0.4 / Math.max(1, step)).toFixed(4);
    const n = 10;
    const ones = Math.round(Math.max(1, Math.min(n - 1, (dotSize / 100) * n)));
    const tv = Array.from({ length: n }, (_, i) => (i >= n - ones ? 1 : 0)).join(' ');
    return (
      <filter id={id} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
        {densityChain}
        <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves="2"
                      seed={layerIndex * 7 + 1} stitchTiles="stitch" result="noise" />
        <feColorMatrix type="saturate" values="0" in="noise" result="grey" />
        <feComponentTransfer in="grey" result="grain">
          <feFuncR type="discrete" tableValues={tv} />
          <feFuncG type="discrete" tableValues={tv} />
          <feFuncB type="discrete" tableValues={tv} />
          <feFuncA type="discrete" tableValues={tv} />
        </feComponentTransfer>
        <feComposite in="grain" in2="curved" operator="in" result="maskedGrain" />
        <feFlood floodColor={color} result="ink" />
        <feComposite in="ink" in2="maskedGrain" operator="in" />
      </filter>
    );
  }

  // none
  return (
    <filter id={id} colorInterpolationFilters="sRGB">
      {densityChain}
      <feFlood floodColor={color} result="ink" />
      <feComposite in="ink" in2="curved" operator="in" />
    </filter>
  );
}
