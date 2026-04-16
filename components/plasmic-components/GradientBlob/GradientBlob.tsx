import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import styles from './GradientBlob.module.css';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { NoiseOverlay } from '@/components/plasmic-components/NoiseOverlay';

export interface GradientBlobProps {
  colors?: string[];
  colorsText?: string;
  blobCount?: number;
  blurAmount?: number;
  loopDuration?: number;
  speed?: number;
  width?: string;
  height?: string;
  noise?: boolean;
  noiseIntensity?: number;
  seed?: number;
  className?: string;
}

// Small deterministic PRNG so blob layouts are stable per mount and per seed.
function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Blob {
  color: string;
  size: number;
  // Keyframes in %, normalized so start == end for seamless loop
  xs: string[];
  ys: string[];
  times: number[];
  duration: number;
}

function buildBlobs(colors: string[], count: number, seed: number, baseDuration: number): Blob[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, (_, i) => {
    // 3–4 intermediate waypoints; return to origin at the end
    const pts = 4;
    const xs: string[] = [];
    const ys: string[] = [];
    for (let p = 0; p < pts; p++) {
      xs.push(`${Math.round(rand() * 100)}%`);
      ys.push(`${Math.round(rand() * 100)}%`);
    }
    xs.push(xs[0]);
    ys.push(ys[0]);
    const times = Array.from({ length: pts + 1 }, (_, k) => k / pts);
    return {
      color: colors[i % colors.length] ?? '#FF6A50',
      size: 40 + rand() * 40,  // % of container's smaller dimension
      xs,
      ys,
      times,
      duration: baseDuration * (0.7 + rand() * 0.6),  // per-blob variation
    };
  });
}

export function GradientBlob({
  colors,
  colorsText,
  blobCount = 4,
  blurAmount = 80,
  loopDuration = 20,
  speed = 1,
  width = '100%',
  height = '400px',
  noise = true,
  noiseIntensity = 0.15,
  seed = 1,
  className,
}: GradientBlobProps) {
  const prefersReduced = usePrefersReducedMotion();

  // Derive color list: prefer explicit `colors` array, fall back to comma-separated `colorsText`,
  // then fall back to the brand default set.
  const resolvedColors = useMemo(() => {
    if (colors && colors.length > 0) return colors;
    if (colorsText && colorsText.trim()) {
      return colorsText.split(',').map((c) => c.trim()).filter(Boolean);
    }
    return ['#FF6A50', '#DDEA44', '#CEBEE3', '#FFAB7B'];
  }, [colors, colorsText]);

  const effectiveDuration = Math.max(2, loopDuration / Math.max(0.1, speed));

  const [blobs] = useState(() => buildBlobs(resolvedColors, blobCount, seed, effectiveDuration));

  // Rebuild blobs when key inputs change
  const keyedBlobs = useMemo(
    () => buildBlobs(resolvedColors, blobCount, seed, effectiveDuration),
    [resolvedColors, blobCount, seed, effectiveDuration]
  );
  const activeBlobs = prefersReduced ? blobs : keyedBlobs;

  const content = (
    <div
      className={[styles.container, className ?? ''].filter(Boolean).join(' ')}
      style={{ width, height }}
      aria-hidden="true"
    >
      <div className={styles.blobLayer} style={{ filter: `blur(${blurAmount}px)` }}>
        {activeBlobs.map((b, i) => {
          const common = {
            position: 'absolute' as const,
            width: `${b.size}%`,
            aspectRatio: '1 / 1',
            borderRadius: '50%',
            backgroundColor: b.color,
          };
          if (prefersReduced) {
            return (
              <div
                key={i}
                style={{ ...common, left: b.xs[0], top: b.ys[0], transform: 'translate(-50%, -50%)' }}
              />
            );
          }
          return (
            <motion.div
              key={i}
              style={{ ...common, transform: 'translate(-50%, -50%)' }}
              animate={{ left: b.xs, top: b.ys }}
              transition={{
                left:  { duration: b.duration, times: b.times, repeat: Infinity, ease: 'linear' },
                top:   { duration: b.duration, times: b.times, repeat: Infinity, ease: 'linear' },
              }}
            />
          );
        })}
      </div>
    </div>
  );

  if (noise) {
    return <NoiseOverlay intensity={noiseIntensity}>{content}</NoiseOverlay>;
  }
  return content;
}
