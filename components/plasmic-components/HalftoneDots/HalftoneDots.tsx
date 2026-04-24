import React, { useEffect, useRef } from 'react';
import styles from './HalftoneDots.module.css';
import { findHoverHost } from '@/hooks/findHoverHost';
import { colorOrDefault } from '@/hooks/colorDefault';

export interface HalftoneDotsProps {
  /** First ink color */
  dotColorA?: string;
  /** Second ink color */
  dotColorB?: string;
  /** Rotation angle of the first dot screen, in degrees (e.g. 15°) */
  layerAAngle?: number;
  /** Rotation angle of the second dot screen, in degrees (e.g. 75°) */
  layerBAngle?: number;
  /** Grid cell size in px — smaller = denser dots */
  step?: number;
  /** Dot radius as % of cell (0–100) */
  dotSize?: number;
  /** Max opacity (0–1) */
  maxOpacity?: number;
  /** CSS mix-blend-mode applied between the two ink layers */
  blendMode?: 'normal' | 'multiply' | 'darken' | 'overlay' | 'screen' | 'soft-light' | 'color-burn';
  /**
   * Cursor behavior on hover of the host element.
   *   none  — static, no reaction (cheapest)
   *   shift — the two layers drift apart (misregistration)
   *   pulse — dot size scales up across both layers
   */
  cursor?: 'none' | 'shift' | 'pulse';
  /** Upload an SVG icon to use as a mask for the dots (the icon's shape becomes the silhouette). */
  iconUrl?: string;
  /** Icon mask size as a CSS length (e.g. "96px", "40%", "8rem") */
  iconSize?: string;
  /** When true, the icon mask follows the cursor across the host (flashlight effect). */
  iconFollowsCursor?: boolean;
  /** hover: activate on host hover. always: always on. never: hidden. */
  trigger?: 'hover' | 'always' | 'never';
  /** Ease-in / ease-out duration (seconds) for the cursor shift/pulse activity ramp */
  easeDuration?: number;
  className?: string;
}

// Renders a single dot into a `step × step` tile canvas. The tile is then used
// as a repeating pattern to fill the whole layer with one fillRect call.
function buildDotTile(step: number, dotSizePct: number, color: string): HTMLCanvasElement {
  const size = Math.max(2, Math.round(step));
  const tile = document.createElement('canvas');
  tile.width = size;
  tile.height = size;
  const tctx = tile.getContext('2d');
  if (!tctx) return tile;
  const dotR = (Math.max(0, Math.min(100, dotSizePct)) / 100) * (size / 2);
  if (dotR < 0.3) return tile;
  tctx.fillStyle = color;
  tctx.beginPath();
  tctx.arc(size / 2, size / 2, dotR, 0, Math.PI * 2);
  tctx.fill();
  return tile;
}

export function HalftoneDots({
  dotColorA,
  dotColorB,
  layerAAngle = 15,
  layerBAngle = 75,
  step = 8,
  dotSize = 40,
  maxOpacity = 1,
  blendMode = 'multiply',
  cursor = 'none',
  iconUrl,
  iconSize = '96px',
  iconFollowsCursor = false,
  trigger = 'hover',
  easeDuration = 0.45,
  className,
}: HalftoneDotsProps) {
  const resolvedColorA = colorOrDefault(dotColorA, '#FF6A50');
  const resolvedColorB = colorOrDefault(dotColorB, '#DDEA44');

  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(false);
  // Cursor activity ramp (0 = idle, 1 = fully hovered). Used for shift/pulse.
  const activityRef = useRef(0);
  const hoveringRef = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas || trigger === 'never') return;

    const host = findHoverHost(root);
    if (!host) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── Pre-render dot tiles (per color). `pulse` mode needs to change dot
    // size over time — we rebuild the tile only when the computed radius
    // visibly changes (quantised to whole pixels).
    // The base tile uses dotSize at scale=1.
    let tileA = buildDotTile(step, dotSize, resolvedColorA);
    let tileB = buildDotTile(step, dotSize, resolvedColorB);
    let patternA = ctx.createPattern(tileA, 'repeat');
    let patternB = ctx.createPattern(tileB, 'repeat');
    // Track the pulse-scaled dot size we most recently baked into the tiles, so
    // we can skip tile rebuilds when the scale hasn't changed a whole pixel.
    let lastBakedDotSize = dotSize;

    const rebuildTilesForPulseScale = (scale: number) => {
      const scaled = Math.max(1, Math.min(100, dotSize * scale));
      if (Math.abs(scaled - lastBakedDotSize) < 1) return;
      lastBakedDotSize = scaled;
      tileA = buildDotTile(step, scaled, resolvedColorA);
      tileB = buildDotTile(step, scaled, resolvedColorB);
      patternA = ctx.createPattern(tileA, 'repeat');
      patternB = ctx.createPattern(tileB, 'repeat');
    };

    const resize = () => {
      canvas.width = host.offsetWidth;
      canvas.height = host.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(() => {
      resize();
      render();
    });
    ro.observe(host);

    // Smoothstep: gentle ease-in AND ease-out. Symmetric — enter and leave
    // animations slow down at both ends, not just the far end.
    const smoothstep = (x: number) => x * x * (3 - 2 * x);

    // ── Render one frame of both layers.
    // This uses ONE fillRect per layer (the rotated pattern covers everything).
    const render = () => {
      const { width: w, height: h } = canvas;
      if (w === 0 || h === 0) return;

      // activityRef holds linear progress 0..1 (time-based).
      // Shape it through smoothstep for the visual ramp.
      const a = smoothstep(activityRef.current);
      const pulseScale = cursor === 'pulse' ? 1 + a * 0.35 : 1;
      const shiftAmt = cursor === 'shift' ? a * (step * 0.6) : 0;
      // In shift mode the two layers counter-rotate slightly as they drift apart,
      // reinforcing the misregistration feel.
      const shiftRotDeg = cursor === 'shift' ? a * 8 : 0;

      if (cursor === 'pulse') rebuildTilesForPulseScale(pulseScale);
      if (!patternA || !patternB) return;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';

      const diagHalf = Math.ceil(Math.hypot(w, h) / 2) + step;

      // Layer A — base angle minus shift rotation
      const aRad = ((layerAAngle - shiftRotDeg) * Math.PI) / 180;
      ctx.setTransform(
        Math.cos(aRad), Math.sin(aRad),
        -Math.sin(aRad), Math.cos(aRad),
        w / 2 - shiftAmt, h / 2 - shiftAmt * 0.3
      );
      ctx.fillStyle = patternA;
      ctx.fillRect(-diagHalf, -diagHalf, diagHalf * 2, diagHalf * 2);

      // Layer B — base angle plus shift rotation (counter-rotate)
      ctx.globalCompositeOperation = 'multiply';
      const bRad = ((layerBAngle + shiftRotDeg) * Math.PI) / 180;
      ctx.setTransform(
        Math.cos(bRad), Math.sin(bRad),
        -Math.sin(bRad), Math.cos(bRad),
        w / 2 + shiftAmt, h / 2 + shiftAmt * 0.3
      );
      ctx.fillStyle = patternB;
      ctx.fillRect(-diagHalf, -diagHalf, diagHalf * 2, diagHalf * 2);

      // Reset
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
    };

    // ── Time-based activity ramp.
    // activityRef holds LINEAR progress 0..1; render() shapes it through
    // smoothstep for the visual. This gives symmetric ease-in/ease-out on
    // both hover-enter AND hover-leave so the dots smoothly return to their
    // static base state when the cursor leaves (not just pause where they were).
    let lastTickTs = 0;
    const easeSec = Math.max(0.05, easeDuration);

    const tickAnim = (now: number) => {
      const dt = lastTickTs === 0 ? 0 : Math.min(0.1, (now - lastTickTs) / 1000);
      lastTickTs = now;

      const target = hoveringRef.current ? 1 : 0;
      const delta = dt / easeSec;
      if (activityRef.current < target) {
        activityRef.current = Math.min(target, activityRef.current + delta);
      } else if (activityRef.current > target) {
        activityRef.current = Math.max(target, activityRef.current - delta);
      }

      render();

      if (Math.abs(activityRef.current - target) > 1e-6) {
        rafRef.current = requestAnimationFrame(tickAnim);
      } else {
        // Reached target — snap to exact value; one final render already happened above.
        activityRef.current = target;
        runningRef.current = false;
        lastTickTs = 0;
      }
    };

    const startAnim = () => {
      if (runningRef.current) return;
      runningRef.current = true;
      lastTickTs = 0;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tickAnim);
    };

    // ── Visibility + activation ─────────────────────────────────────────
    const showCanvas = () => canvas.classList.add(styles.active);
    const hideCanvas = () => canvas.classList.remove(styles.active);

    const isAnimated = cursor === 'shift' || cursor === 'pulse';

    const onEnter = () => {
      hoveringRef.current = true;
      if (trigger === 'hover') {
        showCanvas();
        render();                  // make sure dots exist before the fade-in
        if (isAnimated) startAnim();
      } else if (isAnimated) {
        startAnim();
      }
    };
    const onLeave = () => {
      hoveringRef.current = false;
      if (trigger === 'hover') hideCanvas();
      if (isAnimated) startAnim();
    };

    if (trigger === 'hover') {
      host.addEventListener('mouseenter', onEnter);
      host.addEventListener('mouseleave', onLeave);
    } else if (trigger === 'always') {
      showCanvas();
      render();                    // static render once
      if (isAnimated) {
        // Animated-always is unusual but valid: we still start anim on enter
        host.addEventListener('mouseenter', onEnter);
        host.addEventListener('mouseleave', onLeave);
      }
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      runningRef.current = false;
      ro.disconnect();
      host.removeEventListener('mouseenter', onEnter);
      host.removeEventListener('mouseleave', onLeave);
    };
  }, [
    resolvedColorA, resolvedColorB, layerAAngle, layerBAngle,
    step, dotSize, cursor, trigger, easeDuration,
  ]);

  // ── Cursor-following mask ────────────────────────────────────────────
  // Writes --mask-x / --mask-y CSS vars on the canvas in response to mouse
  // movement over the host. Bypasses React re-renders for smoothness.
  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas || !iconUrl || !iconFollowsCursor) return;

    const host = findHoverHost(root);
    if (!host) return;

    const onMove = (e: MouseEvent) => {
      const rect = host.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      canvas.style.setProperty('--mask-x', `${x}px`);
      canvas.style.setProperty('--mask-y', `${y}px`);
    };

    // Initial position: center of host, so first frame isn't at (0,0)
    canvas.style.setProperty('--mask-x', `${host.offsetWidth / 2}px`);
    canvas.style.setProperty('--mask-y', `${host.offsetHeight / 2}px`);

    host.addEventListener('mousemove', onMove);
    return () => host.removeEventListener('mousemove', onMove);
  }, [iconUrl, iconFollowsCursor]);

  if (trigger === 'never') return null;

  // ── Mask style ───────────────────────────────────────────────────────
  // - Without iconUrl: no mask (canvas shows the whole halftone fill).
  // - With iconUrl, centered: mask-position 50% 50%.
  // - With iconUrl, follow-cursor: mask-position uses --mask-x / --mask-y CSS vars
  //   driven by the mousemove effect above. We subtract half the icon size so
  //   the icon's CENTER lands at the cursor, not its top-left corner.
  const maskStyle: React.CSSProperties = iconUrl
    ? {
        maskImage: `url("${iconUrl}")`,
        WebkitMaskImage: `url("${iconUrl}")`,
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskSize: `${iconSize} ${iconSize}`,
        WebkitMaskSize: `${iconSize} ${iconSize}`,
        maskPosition: iconFollowsCursor
          ? `calc(var(--mask-x, 50%) - ${iconSize} / 2) calc(var(--mask-y, 50%) - ${iconSize} / 2)`
          : 'center center',
        WebkitMaskPosition: iconFollowsCursor
          ? `calc(var(--mask-x, 50%) - ${iconSize} / 2) calc(var(--mask-y, 50%) - ${iconSize} / 2)`
          : 'center center',
      }
    : {};

  return (
    <div ref={rootRef} className={[styles.root, className ?? ''].filter(Boolean).join(' ')} aria-hidden="true">
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        style={{
          opacity: maxOpacity,
          mixBlendMode: blendMode as React.CSSProperties['mixBlendMode'],
          ...maskStyle,
        }}
      />
    </div>
  );
}
