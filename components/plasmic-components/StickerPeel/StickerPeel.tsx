import React from 'react';
import styles from './StickerPeel.module.css';

export type StickerCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface StickerPeelProps {
  children?: React.ReactNode;
  /** Which corner peels up on hover */
  peelCorner?: StickerCorner;
  /** Peel size as a CSS length (e.g. "40px", "3rem", "18%"). Kept square for realistic fold geometry. */
  peelSize?: string;
  /** Resting rotation of the sticker (deg) */
  rotation?: number;
  /** Drop-shadow color of the sticker */
  shadowColor?: string;
  /** Paper-back color revealed under the peel */
  backgroundColor?: string;
  /** Add a tape strip across the top edge */
  tape?: boolean;
  /** Tape color */
  tapeColor?: string;
  /** Tape opacity (0–1) */
  tapeOpacity?: number;
  /** Width of the tape strip as a CSS length (e.g. "30%", "80px") */
  tapeWidth?: string;
  /** Add a glossy shine on the peeled-up backside */
  shine?: boolean;
  /** Depth of the shadow on the underside of the peel (0–1) */
  peelShadow?: number;
  className?: string;
}

export function StickerPeel({
  children,
  peelCorner = 'top-right',
  peelSize = '22%',
  rotation = -2,
  shadowColor = 'rgba(32,27,42,0.25)',
  backgroundColor = '#EADBC2',
  tape = false,
  tapeColor = 'rgba(255, 255, 255, 0.5)',
  tapeOpacity = 0.85,
  tapeWidth = '40%',
  shine = true,
  peelShadow = 0.3,
  className,
}: StickerPeelProps) {
  const peelShadowColor = `rgba(0, 0, 0, ${Math.max(0, Math.min(1, peelShadow))})`;

  return (
    <div
      className={[
        styles.wrapper,
        styles[`corner-${peelCorner}`],
        className ?? '',
      ].filter(Boolean).join(' ')}
      style={{
        ['--peel-size' as string]: peelSize,
        ['--sticker-rotation' as string]: `${rotation}deg`,
        ['--shadow-color' as string]: shadowColor,
        ['--peel-bg' as string]: backgroundColor,
        ['--peel-shadow-color' as string]: peelShadowColor,
        ['--tape-color' as string]: tapeColor,
        ['--tape-opacity' as string]: String(tapeOpacity),
        ['--tape-width' as string]: tapeWidth,
      }}
      tabIndex={0}
    >
      <div className={styles.sticker}>
        <div className={styles.content}>{children}</div>

        {/* Peeled corner — a square "flap" that rotates 180° from its fold edge.
            The flap sits behind the content and is revealed as the corner clip
            advances inward on hover. */}
        <div className={styles.peelBacking} aria-hidden="true">
          <div className={styles.peelFace}>
            {shine && <div className={styles.peelShine} aria-hidden="true" />}
          </div>
        </div>

        {/* Tape — optional strip at the top edge */}
        {tape && <div className={styles.tape} aria-hidden="true" />}
      </div>
    </div>
  );
}
