import React from 'react';
import styles from './StickerPeel.module.css';

type Corner = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
type Trigger = 'hover' | 'always' | 'none';

export interface StickerPeelProps {
  children?: React.ReactNode;
  corner?: Corner;
  peelSize?: number;
  hoverPeelSize?: number;
  backColor?: string;
  backdropColor?: string;
  shadowColor?: string;
  shadowBlur?: number;
  /**
   * Tilts the flap out of the page for a 3D lift. 0 = flat. Reasonable range
   * 10–45° — past 60° the flap goes near edge-on and mostly disappears.
   */
  tilt?: number;
  /** Perspective depth in px for the 3D tilt. Smaller = more dramatic foreshortening. */
  perspective?: number;
  trigger?: Trigger;
  easeDuration?: number;
  className?: string;
}

interface CornerCfg {
  contentClip: string;
  peelPos: React.CSSProperties;
  peelClip: string;
  gradient: string;
  /** Rotation axis for the 3D tilt — always aligned with the fold diagonal,
   *  signed so positive tilt lifts the flap toward the viewer. */
  tiltAxis: [number, number, number];
}

const S = 'var(--peel-size)';

const CORNER_CFG: Record<Corner, CornerCfg> = {
  'top-right': {
    contentClip: `polygon(0 0, calc(100% - ${S}) 0, 100% ${S}, 100% 100%, 0 100%)`,
    peelPos: { top: 0, right: 0 },
    peelClip: 'polygon(0 0, 100% 100%, 0 100%)',
    gradient: 'to bottom left',
    tiltAxis: [1, 1, 0],
  },
  'top-left': {
    contentClip: `polygon(${S} 0, 100% 0, 100% 100%, 0 100%, 0 ${S})`,
    peelPos: { top: 0, left: 0 },
    peelClip: 'polygon(100% 0, 100% 100%, 0 100%)',
    gradient: 'to bottom right',
    tiltAxis: [1, -1, 0],
  },
  'bottom-right': {
    contentClip: `polygon(0 0, 100% 0, 100% calc(100% - ${S}), calc(100% - ${S}) 100%, 0 100%)`,
    peelPos: { bottom: 0, right: 0 },
    peelClip: 'polygon(0 0, 100% 0, 0 100%)',
    gradient: 'to top left',
    tiltAxis: [-1, 1, 0],
  },
  'bottom-left': {
    contentClip: `polygon(0 0, 100% 0, 100% 100%, ${S} 100%, 0 calc(100% - ${S}))`,
    peelPos: { bottom: 0, left: 0 },
    peelClip: 'polygon(0 0, 100% 0, 100% 100%)',
    gradient: 'to top right',
    tiltAxis: [-1, -1, 0],
  },
};

export function StickerPeel({
  children,
  corner = 'top-right',
  peelSize = 40,
  hoverPeelSize = 80,
  backColor = '#ffffff',
  backdropColor = 'transparent',
  shadowColor = 'rgba(0,0,0,0.25)',
  shadowBlur = 10,
  tilt = 25,
  perspective = 800,
  trigger = 'hover',
  easeDuration = 0.4,
  className,
}: StickerPeelProps) {
  const cfg = CORNER_CFG[corner];
  const baseSize = trigger === 'always' ? hoverPeelSize : peelSize;
  const [ax, ay, az] = cfg.tiltAxis;

  const wrapperStyle = {
    '--peel-size-base': `${baseSize}px`,
    '--peel-size-hover': `${hoverPeelSize}px`,
    '--ease-duration': `${easeDuration}s`,
    backgroundColor: backdropColor,
    perspective: `${perspective}px`,
  } as React.CSSProperties;

  return (
    <div
      className={[
        styles.wrapper,
        trigger === 'hover' ? styles.hoverTrigger : '',
        className ?? '',
      ].filter(Boolean).join(' ')}
      style={wrapperStyle}
    >
      <div
        className={styles.content}
        style={{ clipPath: cfg.contentClip }}
      >
        {children}
      </div>
      <div
        className={styles.peel}
        aria-hidden="true"
        style={{
          ...cfg.peelPos,
          clipPath: cfg.peelClip,
          background: `linear-gradient(${cfg.gradient}, rgba(0,0,0,0.3) 0%, ${backColor} 60%)`,
          filter: `drop-shadow(0 2px ${shadowBlur}px ${shadowColor})`,
          transform: `rotate3d(${ax}, ${ay}, ${az}, ${tilt}deg)`,
          transformOrigin: '50% 50%',
        }}
      />
    </div>
  );
}
