import React, { useMemo } from 'react';
import { mulberry32 } from '../OffsetShape/shared';
import styles from './TornSection.module.css';

// Brand palette — matches tokens/primitives.ts so Plasmic authors pick by name.
const BRAND_COLORS: Record<string, string> = {
  cream:      '#EADBC2',
  lavender:   '#CEBEE3',
  coral:      '#FF6A50',
  peach:      '#FFAB7B',
  chartreuse: '#DDEA44',
  green:      '#52A159',
  navy:       '#00427F',
  brick:      '#802E28',
  sienna:     '#80553E',
  olive:      '#607522',
  forest:     '#295037',
  midnight:   '#201B2A',
  white:      '#FFFFFF',
  transparent: 'transparent',
};

export const BRAND_COLOR_OPTIONS = Object.keys(BRAND_COLORS);

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

  /** Background color — choose from brand palette */
  backgroundColor?: string;

  // Top tear
  tornTop?: boolean;
  tornTopSeed?: number;
  tornTopRoughness?: number;
  tornTopStepSize?: number;
  /** How deep the top tear cuts into the section as % of section height */
  tornTopDepth?: number;

  // Bottom tear
  tornBottom?: boolean;
  tornBottomSeed?: number;
  tornBottomRoughness?: number;
  tornBottomStepSize?: number;
  /** How deep the bottom tear cuts into the section as % of section height */
  tornBottomDepth?: number;

  className?: string;
}

export function TornSection({
  children,
  backgroundColor = 'cream',
  tornTop = false,
  tornTopSeed = 1,
  tornTopRoughness = 5,
  tornTopStepSize = 4,
  tornTopDepth = 4,
  tornBottom = false,
  tornBottomSeed = 2,
  tornBottomRoughness = 5,
  tornBottomStepSize = 4,
  tornBottomDepth = 4,
  className,
}: TornSectionProps) {
  const resolvedColor = BRAND_COLORS[backgroundColor] ?? backgroundColor;

  const topProfile = useMemo(
    () => tornTop ? buildTornProfile(tornTopSeed, tornTopRoughness, tornTopStepSize) : null,
    [tornTop, tornTopSeed, tornTopRoughness, tornTopStepSize],
  );

  const bottomProfile = useMemo(
    () => tornBottom ? buildTornProfile(tornBottomSeed, tornBottomRoughness, tornBottomStepSize) : null,
    [tornBottom, tornBottomSeed, tornBottomRoughness, tornBottomStepSize],
  );

  const clipPath = useMemo(
    () => buildClipPath(topProfile, tornTopDepth, bottomProfile, tornBottomDepth),
    [topProfile, tornTopDepth, bottomProfile, tornBottomDepth],
  );

  return (
    <div
      className={[styles.section, className ?? ''].filter(Boolean).join(' ')}
      style={{
        backgroundColor: resolvedColor,
        clipPath,
      }}
    >
      {children}
    </div>
  );
}
