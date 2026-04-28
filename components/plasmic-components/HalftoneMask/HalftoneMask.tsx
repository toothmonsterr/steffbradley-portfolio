import React, { useId, useEffect, useRef } from 'react';
import styles from './HalftoneMask.module.css';
import { buildHalftoneSVG, invTable } from '../OffsetShape/shared';

const SCREEN_ANGLES = [15, 30, 45, 60];
const LUMA_MATRIX = '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.299 0.587 0.114 0 0';

function smoothstep(x: number) { return x * x * (3 - 2 * x); }

export interface HalftoneMaskProps {
  /** Slot — text, image, anything. Filter applies to the rendered alpha+luminance. */
  children?: React.ReactNode;
  color?: string;
  step?: number;
  contrast?: number;
  hoverContrast?: number;
  imageContrast?: number;
  angleIndex?: number;
  blendMode?: 'normal' | 'multiply' | 'darken' | 'screen' | 'overlay' | 'soft-light';
  /**
   * When true, the blend mode only affects content within this component
   * (via `isolation: isolate`). When false (default), the halftone blends
   * with whatever is behind the component on the page.
   */
  isolateBlend?: boolean;
  easeDuration?: number;
  className?: string;
}

export function HalftoneMask({
  children,
  color = '#000000',
  step = 4,
  contrast = 60,
  hoverContrast,
  imageContrast = 1.3,
  angleIndex = 0,
  blendMode = 'normal',
  isolateBlend = false,
  easeDuration = 0.4,
  className,
}: HalftoneMaskProps) {
  const uid = useId().replace(/:/g, '');
  const filterId = `htmask-${uid}`;
  const angle = SCREEN_ANGLES[angleIndex % SCREEN_ANGLES.length];

  const wrapperRef = useRef<HTMLSpanElement>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const activityRef = useRef(0);
  const hoveringRef = useRef(false);
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);
  const optsRef = useRef({ contrast, hoverContrast, step, angle, easeDuration, filterId, imageContrast });
  optsRef.current = { contrast, hoverContrast, step, angle, easeDuration, filterId, imageContrast };

  const setFeImage = (w: number, h: number, dotContrast: number) => {
    const { step: st, angle: ang, filterId: fid } = optsRef.current;
    const uri = buildHalftoneSVG(w, h, st, dotContrast, ang);
    const feImage = document.getElementById(fid)?.querySelector('feImage');
    if (feImage) {
      feImage.setAttribute('href', uri);
      feImage.setAttribute('width', String(w));
      feImage.setAttribute('height', String(h));
    }
  };

  const updateScreenRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const update = () => {
      const rect = wrapper.getBoundingClientRect();
      const w = Math.ceil(rect.width);
      const h = Math.ceil(rect.height);
      if (w === 0 || h === 0) return;
      sizeRef.current = { w, h };
      setFeImage(w, h, optsRef.current.contrast ?? 60);
    };

    updateScreenRef.current = update;
    update();
    let debounceTimer = 0;
    const debouncedUpdate = () => {
      clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(update, 150);
    };
    const ro = new ResizeObserver(debouncedUpdate);
    ro.observe(wrapper);
    return () => { ro.disconnect(); clearTimeout(debounceTimer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    updateScreenRef.current();
  }, [step, contrast, angle]);

  useEffect(() => {
    if (hoverContrast == null) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const tick = (now: number) => {
      const dt = lastTsRef.current === 0 ? 0 : Math.min(0.1, (now - lastTsRef.current) / 1000);
      lastTsRef.current = now;

      const { contrast: base, hoverContrast: hover, easeDuration: ease } = optsRef.current;
      const target = hoveringRef.current ? 1 : 0;
      const delta = dt / Math.max(0.05, ease);
      const cur = activityRef.current;
      activityRef.current = target > cur ? Math.min(target, cur + delta) : Math.max(target, cur - delta);

      const a = smoothstep(activityRef.current);
      const currentContrast = (base ?? 60) + ((hover ?? base ?? 60) - (base ?? 60)) * a;
      const { w, h } = sizeRef.current;
      if (w > 0 && h > 0) setFeImage(w, h, currentContrast);

      if (activityRef.current !== target) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = 0;
        lastTsRef.current = 0;
      }
    };

    const startLoop = () => {
      if (rafRef.current) return;
      lastTsRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    };

    const onEnter = () => { hoveringRef.current = true; startLoop(); };
    const onLeave = () => { hoveringRef.current = false; startLoop(); };

    wrapper.addEventListener('mouseenter', onEnter);
    wrapper.addEventListener('mouseleave', onLeave);
    return () => {
      wrapper.removeEventListener('mouseenter', onEnter);
      wrapper.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [hoverContrast]);

  return (
    <span
      ref={wrapperRef}
      className={[styles.wrapper, className ?? ''].filter(Boolean).join(' ')}
      style={{ isolation: isolateBlend ? 'isolate' : 'auto' }}
    >
      <svg className={styles.defs} aria-hidden="true" focusable="false" width="0" height="0">
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
            <feColorMatrix type="matrix" values={LUMA_MATRIX} result="luma" />
            <feComponentTransfer in="luma" result="lumaMasked">
              <feFuncA type="table" tableValues={invTable(imageContrast)} />
            </feComponentTransfer>
            <feComposite in="lumaMasked" in2="SourceAlpha" operator="in" result="imageMask" />
            <feImage href="" x="0" y="0" width="1" height="1" result="screen" preserveAspectRatio="none" />
            <feComposite in="screen" in2="imageMask" operator="in" result="dots" />
            <feFlood floodColor={color} result="ink" />
            <feComposite in="ink" in2="dots" operator="in" />
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
        }}
      >
        {children}
      </span>
    </span>
  );
}
