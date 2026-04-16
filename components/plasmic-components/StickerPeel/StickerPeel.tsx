import React from 'react';
import styles from './StickerPeel.module.css';

export type StickerCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface StickerPeelProps {
  children?: React.ReactNode;
  peelCorner?: StickerCorner;
  peelAmount?: number;
  rotation?: number;
  shadowColor?: string;
  backgroundColor?: string;
  className?: string;
}

export function StickerPeel({
  children,
  peelCorner = 'top-right',
  peelAmount = 0.3,
  rotation = -2,
  shadowColor = 'rgba(32,27,42,0.25)',
  backgroundColor = '#EADBC2',
  className,
}: StickerPeelProps) {
  // Peel size as a CSS value — derived from peelAmount (0..1 → 0..40% of the shorter edge)
  const peelPct = Math.max(0, Math.min(1, peelAmount)) * 40;

  return (
    <div
      className={[
        styles.wrapper,
        styles[`corner-${peelCorner}`],
        className ?? '',
      ].filter(Boolean).join(' ')}
      style={{
        ['--peel-size' as string]: `${peelPct}%`,
        ['--sticker-rotation' as string]: `${rotation}deg`,
        ['--shadow-color' as string]: shadowColor,
        ['--peel-bg' as string]: backgroundColor,
      }}
      tabIndex={0}
    >
      <div className={styles.sticker}>
        <div className={styles.content}>{children}</div>
        <div className={styles.peel} aria-hidden="true" />
      </div>
    </div>
  );
}
