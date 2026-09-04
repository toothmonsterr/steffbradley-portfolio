import React from 'react';
import styles from './EyeLoader.module.css';
import { InkBleed } from '@/components/plasmic-components/InkBleed';
import { NoiseOverlay } from '@/components/plasmic-components/NoiseOverlay';

export interface EyeLoaderProps {
  /** Page background shown behind the mark (default matches --color-cream) */
  backgroundColor?: string;
  /** Eye fill color (default matches --color-navy) */
  eyeColor?: string;
  /** Mark size in px (default 96) */
  size?: number;
  /** Seconds for one full lap of the pupil's circular drift (default 4) */
  driftIntervalSec?: number;
  /** Delay before the bottom eye's pupil starts its drift, in seconds — so
   *  it reads as a cascade following the top eye rather than two pupils
   *  moving in lockstep (default 0.35) */
  driftCascadeSec?: number;
  /** Fade-out duration in ms once `hidden` becomes true (default 320) */
  fadeMs?: number;
  /** Set true to fade the overlay out and stop blocking interaction */
  hidden?: boolean;
  /** Print-grain texture over the whole splash, 0 to disable (default 0.15) */
  grainIntensity?: number;
  /** Rough ink-bleed halo dilating outward from the eye shapes, in px —
   *  0 disables it (default 3) */
  inkSpread?: number;
  /** Paper-fiber texture scale of the ink-bleed halo — lower is coarser/
   *  chunkier fiber, higher is finer grain (default 0.9) */
  inkTextureScale?: number;
  className?: string;
}

// Lens outline only (the outer eye shape, evenodd hole removed — the pupil is
// its own circle below so it can move independently of the static lens).
const LENS_TOP =
  'M0.494,31.375c10.458,-10.458 31.375,-31.375 62.75,-31.375c31.375,0 52.292,20.917 62.75,31.375c-10.458,10.458 -31.375,31.375 -62.75,31.375c-31.375,0 -52.292,-20.917 -62.75,-31.375Z';
const LENS_BOTTOM =
  'M0.494,94.125c10.458,-10.458 31.375,-31.375 62.75,-31.375c31.375,0 52.292,20.917 62.75,31.375c-10.458,10.458 -31.375,31.375 -62.75,31.375c-31.375,0 -52.292,-20.917 -62.75,-31.375Z';

const PUPIL_R = 15.688;
const EYE_CX = 62.75;
const TOP_CY = 31.375;
const BOTTOM_CY = 94.125;

export function EyeLoader({
  backgroundColor   = '#ff6a50',
  eyeColor          = '#ddea44',
  size              = 96,
  driftIntervalSec  = 4,
  driftCascadeSec   = 0.35,
  fadeMs            = 320,
  hidden            = false,
  grainIntensity    = 0.25,
  inkSpread         = 3,
  inkTextureScale   = 0.9,
  className,
}: EyeLoaderProps) {
  const cssVars = {
    '--eye-loader-bg':            backgroundColor,
    '--eye-loader-color':         eyeColor,
    '--eye-loader-size':          `${size}px`,
    '--eye-loader-drift-sec':     `${driftIntervalSec}s`,
    '--eye-loader-drift-offset':  `${driftCascadeSec}s`,
    '--eye-loader-fade-ms':       `${fadeMs}ms`,
  } as React.CSSProperties;

  const eyes = (
    <svg viewBox="0 0 126 126" fill="currentColor" aria-hidden="true">
      {/* Lens outlines are static — no per-frame repaint cost. Only the
          pupils move, via `transform: translate()`, which the compositor
          handles cheaply without rasterizing any vector geometry. */}
      <path d={LENS_TOP} />
      <path d={LENS_BOTTOM} />
      <circle className={styles.pupilTop} cx={EYE_CX} cy={TOP_CY} r={PUPIL_R} fill={backgroundColor} />
      <circle className={styles.pupilBottom} cx={EYE_CX} cy={BOTTOM_CY} r={PUPIL_R} fill={backgroundColor} />
    </svg>
  );

  return (
    <div
      className={[styles.root, className ?? ''].filter(Boolean).join(' ')}
      style={cssVars}
      data-hidden={hidden}
      role="status"
      aria-live="polite"
      aria-label={hidden ? undefined : 'Loading'}
    >
      {grainIntensity > 0 && (
        <NoiseOverlay
          intensity={grainIntensity}
          color={eyeColor}
          blendMode="overlay"
          grainSize={1}
        />
      )}
      {inkSpread > 0 ? (
        <InkBleed
          bleedColor={eyeColor}
          spread={inkSpread}
          noiseFrequency={inkTextureScale}
          className={styles.mark}
        >
          {eyes}
        </InkBleed>
      ) : (
        <div className={styles.mark}>{eyes}</div>
      )}
    </div>
  );
}
