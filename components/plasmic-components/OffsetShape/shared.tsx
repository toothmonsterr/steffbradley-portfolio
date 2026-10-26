import React, { useEffect, useRef } from 'react';
import { grainTileUrl, tileSizeForFrequency } from '../textures';

// ---------------------------------------------------------------------------
// Helpers shared by OffsetShape / OffsetImage / OffsetCMYK
// ---------------------------------------------------------------------------

export function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Returns 3 waypoints [x, y, rotate] in ±mag, ±mag, ±0.3° — seeded so SSR === CSR.
export function buildWobble(seed: number, mag: number): number[][] {
  const safeMag = (typeof mag === 'number' && isFinite(mag)) ? mag : 1.2;
  const safeSeed = (typeof seed === 'number' && isFinite(seed)) ? seed : 1;
  const rand = mulberry32(safeSeed);
  const pt = () => [
    (rand() * 2 - 1) * safeMag,
    (rand() * 2 - 1) * safeMag,
    (rand() * 2 - 1) * 0.3,
  ];
  return [pt(), pt(), pt()];
}

// feFuncA table values for image-mode luminance → alpha with a contrast curve.
// Negative contrast inverts the curve: light areas get ink instead of dark areas.
export function invTable(contrast: number): string {
  const n = 9;
  const inverted = contrast < 0;
  const k = Math.max(0.1, Math.abs(contrast));
  const values: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const shaped = Math.pow(inverted ? t : 1 - t, 1 / k);
    values.push(Math.max(0, Math.min(1, shaped)));
  }
  return values.map((v) => v.toFixed(3)).join(' ');
}

// ---------------------------------------------------------------------------
// SVG filter JSX builders
// ---------------------------------------------------------------------------

export type TintMode = 'shape' | 'image';
export type TextureMode = 'none' | 'noise' | 'halftone';

const LUMA_MATRIX = '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.299 0.587 0.114 0 0';

// Standard screen angles (index = layer order: 0=C,1=M,2=Y,3=K / A,B,...)
const SCREEN_ANGLES = [15, 30, 45, 60];

// Generates a w×h SVG with a rotated halftone dot grid, centred on the
// element. One <pattern> with a single circle, rotated about the centre, so
// the string is the same small size however large the element is (it used to
// emit one <circle> per dot — thousands on a big element, base64-encoded on
// mount and on every resize).
// Used by feImage sized to the full filter region — no feTile needed.
export function buildHalftoneSVG(w: number, h: number, step: number, dotSizePct: number, angleDeg: number): string {
  const s  = Math.max(2, step);
  const r  = (Math.max(1, dotSizePct) / 100) * (s / 2);
  const cx = w / 2;
  const cy = h / 2;
  // Pattern origin chosen so a dot sits exactly on the centre, which the
  // rotation then pivots around — the same grid the per-circle version drew.
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
    `<defs><pattern id="d" patternUnits="userSpaceOnUse" width="${s}" height="${s}"` +
    ` x="${(cx - s / 2).toFixed(2)}" y="${(cy - s / 2).toFixed(2)}"` +
    ` patternTransform="rotate(${angleDeg} ${cx.toFixed(2)} ${cy.toFixed(2)})">` +
    `<circle cx="${s / 2}" cy="${s / 2}" r="${r.toFixed(2)}" fill="black"/></pattern></defs>` +
    `<rect width="${w}" height="${h}" fill="url(#d)"/></svg>`;
  if (typeof btoa !== 'undefined') return `data:image/svg+xml;base64,${btoa(svg)}`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Legacy alias used by the hover proximity builder (proximity SVG is already full-size).
export function rotatedDotScreenUri(step: number, dotSizePct: number, _angleDeg: number): string {
  const s = Math.max(2, Math.round(step));
  const r = (Math.max(1, dotSizePct) / 100) * (s / 2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="black"/></svg>`;
  if (typeof btoa !== 'undefined') return `data:image/svg+xml;base64,${btoa(svg)}`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Ink grain for texture = 'noise': a pre-rendered grain tile (see
// scripts/build-textures.mjs) repeated with feTile, in place of a live
// feTurbulence. Same noise and threshold, so the same look, without
// evaluating fractal noise per pixel whenever the layer repaints.
//
// contrast 0–100 maps to how many of 10 discrete steps pass (higher = more
// ink), clamped to 1–9 as the old table was. Each layer gets its own patch of
// noise (its own seed, as before), so the plates scatter independently.
// Produces result="grain".
export function grainTileJSX(layerIndex: number, step: number, contrast: number) {
  const ones = Math.round(Math.max(1, Math.min(9, (contrast / 100) * 10)));
  const size = tileSizeForFrequency(0.4 / Math.max(1, step));
  return (
    <>
      <feImage
        href={grainTileUrl(ones * 10, layerIndex)}
        x={0}
        y={0}
        width={size}
        height={size}
        preserveAspectRatio="none"
        result="grainTile"
      />
      <feTile in="grainTile" result="grain" />
    </>
  );
}

export function shapeFilterJSX(
  id: string, color: string,
  texture: TextureMode = 'none',
  layerIndex = 0,
  step = 4, contrast = 60,
) {
  if (texture === 'halftone') {
    return (
      <filter id={id} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
        {/* href populated imperatively by useHalftoneScreen after mount */}
        <feImage href="" x="0%" y="0%" width="100%" height="100%" result="screen" preserveAspectRatio="none" />
        <feComposite in="screen" in2="SourceAlpha" operator="in" result="dots" />
        <feFlood floodColor={color} result="ink" />
        <feComposite in="ink" in2="dots" operator="in" />
      </filter>
    );
  }

  if (texture === 'noise') {
    return (
      <filter id={id} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
        {grainTileJSX(layerIndex, step, contrast)}
        <feComposite in="grain" in2="SourceAlpha" operator="in" result="maskedGrain" />
        <feFlood floodColor={color} result="ink" />
        <feComposite in="ink" in2="maskedGrain" operator="in" />
      </filter>
    );
  }

  return (
    <filter id={id} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
      <feFlood floodColor={color} result="flood" />
      <feComposite in="flood" in2="SourceAlpha" operator="in" />
    </filter>
  );
}

export function imageFilterJSX(
  id: string, color: string, imageContrast: number,
  texture: TextureMode = 'none',
  layerIndex = 0,
  step = 4, contrast = 60,
) {
  // Luminance mask: dark areas of the image = more ink
  const lumaMask = (
    <>
      <feColorMatrix type="matrix" values={LUMA_MATRIX} result="luma" />
      <feComponentTransfer in="luma" result="lumaMasked">
        <feFuncA type="table" tableValues={invTable(imageContrast)} />
      </feComponentTransfer>
      <feComposite in="lumaMasked" in2="SourceAlpha" operator="in" result="imageMask" />
    </>
  );

  if (texture === 'halftone') {
    return (
      <filter id={id} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
        {lumaMask}
        {/* href populated imperatively by useHalftoneScreen after mount */}
        <feImage href="" x="0%" y="0%" width="100%" height="100%" result="screen" preserveAspectRatio="none" />
        <feComposite in="screen" in2="imageMask" operator="in" result="dots" />
        <feFlood floodColor={color} result="ink" />
        <feComposite in="ink" in2="dots" operator="in" />
      </filter>
    );
  }

  if (texture === 'noise') {
    return (
      <filter id={id} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
        {lumaMask}
        {grainTileJSX(layerIndex, step, contrast)}
        {/* Grain clipped by image luminance mask */}
        <feComposite in="grain" in2="imageMask" operator="in" result="maskedGrain" />
        <feFlood floodColor={color} result="ink" />
        <feComposite in="ink" in2="maskedGrain" operator="in" />
      </filter>
    );
  }

  // none
  return (
    <filter id={id} colorInterpolationFilters="sRGB">
      <feColorMatrix type="matrix" values={LUMA_MATRIX} result="luma" />
      <feComponentTransfer in="luma" result="lumaMasked">
        <feFuncA type="table" tableValues={invTable(imageContrast)} />
      </feComponentTransfer>
      <feComposite in="lumaMasked" in2="SourceAlpha" operator="in" result="masked" />
      <feFlood floodColor={color} result="flood" />
      <feComposite in="flood" in2="masked" operator="in" />
    </filter>
  );
}

// ---------------------------------------------------------------------------
// Misregistration motion (CSS-driven — see offsetMotion.module.css)
// ---------------------------------------------------------------------------

export type Interaction = 'hover' | 'always' | 'inverse' | 'click';

// How close to registered the layers sit while active (px).
const REG = 0.5;

/** Whether the host rests in the active (registered) state. */
export function restsActive(interaction: Interaction): boolean {
  return interaction === 'inverse';
}

/** Host CSS variables: the ease duration shared by every layer. */
export function offsetHostVars(easeDuration: number): React.CSSProperties {
  return { '--offset-ease': `${Math.max(0.05, easeDuration)}s` } as React.CSSProperties;
}

/** Layer CSS variables: rest offset and near-registered position. */
export function offsetLayerVars(
  dxSign: number, dySign: number, offsetX: number, offsetY: number,
): React.CSSProperties {
  return {
    '--rest-x': `${dxSign * offsetX}px`,
    '--rest-y': `${dySign * offsetY}px`,
    '--reg-x': `${dxSign * REG}px`,
    '--reg-y': `${dySign * REG}px`,
  } as React.CSSProperties;
}

/** Wobble CSS variables: the three seeded breathing waypoints. */
export function wobbleVars(w: number[][]): React.CSSProperties {
  const vars: Record<string, string> = {};
  w.forEach(([x, y, r], i) => {
    vars[`--w${i}x`] = `${x.toFixed(3)}px`;
    vars[`--w${i}y`] = `${y.toFixed(3)}px`;
    vars[`--w${i}r`] = `${r.toFixed(3)}deg`;
  });
  return vars as React.CSSProperties;
}

/**
 * Toggles [data-active] on the host for hover / click / inverse, and
 * [data-offscreen] while it is scrolled out of view (pauses the wobble).
 * The motion itself is CSS; this only flips attributes on events, so
 * nothing runs per frame. The rest state is also rendered on the server
 * (data-active={restsActive(...)}), so it is right before hydration.
 */
export function useOffsetInteraction(
  hostRef: React.RefObject<HTMLElement | null>,
  interaction: Interaction,
) {
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const rest = restsActive(interaction);
    const setActive = (on: boolean) => {
      if (on) host.dataset.active = '';
      else delete host.dataset.active;
    };
    setActive(rest);

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) delete host.dataset.offscreen;
      else host.dataset.offscreen = '';
    }, { threshold: 0 });
    io.observe(host);

    let detach = () => {};
    if (interaction === 'click') {
      // click only: a tap fires click too, so also listening to touchend
      // toggled twice per tap and cancelled itself out.
      let on = rest;
      const onClick = () => { on = !on; setActive(on); };
      host.addEventListener('click', onClick);
      detach = () => host.removeEventListener('click', onClick);
    } else if (interaction !== 'always') {
      const onEnter = () => setActive(!rest);
      const onLeave = () => setActive(rest);
      host.addEventListener('mouseenter', onEnter);
      host.addEventListener('mouseleave', onLeave);
      detach = () => {
        host.removeEventListener('mouseenter', onEnter);
        host.removeEventListener('mouseleave', onLeave);
      };
    }

    return () => {
      detach();
      io.disconnect();
      delete host.dataset.offscreen;
    };
  }, [hostRef, interaction]);
}

// ---------------------------------------------------------------------------
// Halftone proximity effect
// ---------------------------------------------------------------------------

// Builds a full-element SVG where each dot's radius is sized by its distance
// from the (lerped) cursor. Mirrors the radial formula from CursorShadow:
//   t = 1 - dist/radius  (1 at cursor, 0 at edge of proximity zone)
//   dotPct = base + (hover - base) * sqrt(t)   ← sqrt gives smooth falloff
function buildProximityHalftoneSVG(
  w: number, h: number, step: number,
  baseDotSize: number, hoverDotSize: number,
  cursorX: number, cursorY: number,
  radius: number, feather: number,
): string {
  const half    = step / 2;
  const baseR   = (Math.max(1, baseDotSize) / 100) * half;
  const baseStr = baseR.toFixed(2);   // pre-formatted for the common case
  const parts: string[] = [];

  for (let gy = 0; gy * step <= h; gy++) {
    for (let gx = 0; gx * step <= w; gx++) {
      const px = gx * step + half;
      const py = gy * step + half;
      // AABB fast-reject: if either axis alone exceeds radius the dot is
      // guaranteed outside the circle, so skip the more expensive hypot.
      const dxAbs = Math.abs(px - cursorX);
      const dyAbs = Math.abs(py - cursorY);
      if (dxAbs > radius || dyAbs > radius) {
        parts.push(`<circle cx="${px}" cy="${py}" r="${baseStr}"/>`);
      } else {
        const dist    = Math.hypot(dxAbs, dyAbs);
        const t       = Math.max(0, 1 - dist / radius);
        const dotPct  = baseDotSize + (hoverDotSize - baseDotSize) * Math.pow(t, feather);
        const r       = (Math.max(1, dotPct) / 100) * half;
        parts.push(`<circle cx="${px}" cy="${py}" r="${r.toFixed(2)}"/>`);
      }
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><g fill="black">${parts.join('')}</g></svg>`;
  if (typeof btoa !== 'undefined') return `data:image/svg+xml;base64,${btoa(svg)}`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Drives per-dot halftone sizing based on cursor proximity.
 * Each dot's radius is computed from its distance to the cursor, so the effect
 * follows the cursor spatially rather than scaling the whole pattern uniformly.
 *
 * Generates a full-element SVG each frame and sets it as the feImage source
 * (sized to the element, so feTile shows it exactly once with no repeat seam).
 *
 * filterIds: IDs of the <filter> elements whose <feImage> to update.
 * Pass an empty array to disable.
 */
export function useHalftoneProximity(
  hostRef: React.RefObject<HTMLElement | null>,
  filterIds: string[],
  opts: {
    step: number;
    baseDotSize: number;
    hoverDotSize: number;
    /** px radius over which the effect ramps (default 150) */
    proximityRadius?: number;
    /** Falloff curve exponent — 0.5 = wide soft halo, 1 = linear, 2+ = tight concentrated spot (default 0.5) */
    feather?: number;
    prefersReduced?: boolean;
  },
) {
  const optsRef = useRef(opts);
  optsRef.current = opts;

  // target = raw mouse position, cur = lerped position (mirrors CursorShadow).
  const targetRef = useRef({ x: -9999, y: -9999 });
  const curRef    = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef(0);
  const filterIdsRef = useRef(filterIds);
  filterIdsRef.current = filterIds;
  // Track last rendered state so we skip regeneration when nothing changed.
  const prevRef = useRef({ x: NaN, y: NaN, w: 0, h: 0 });

  useEffect(() => {
    if (!filterIds.length) return;
    // No cursor on touch-only devices — skip entirely so mobile pays nothing.
    if (typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches) return;
    // Reduced motion — skip the mousemove listener and RAF loop entirely
    // rather than running them forever with the cursor parked off-canvas.
    if (opts.prefersReduced) return;

    const onMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    // Rebuilding a few thousand <circle>s and base64-encoding them is by far
    // the most expensive per-frame work in the project — never do it for an
    // element that isn't on screen.
    let inViewport = true;

    const tick = () => {
      const host = hostRef.current;
      const { step, baseDotSize, hoverDotSize, proximityRadius = 150, feather = 0.5 } = optsRef.current;
      const ids = filterIdsRef.current;

      // Don't burn a full SVG build before the mouse has been seen at all.
      if (targetRef.current.x === -9999) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Lerp cursor toward target (same 0.13 factor as CursorShadow).
      curRef.current.x += (targetRef.current.x - curRef.current.x) * 0.13;
      curRef.current.y += (targetRef.current.y - curRef.current.y) * 0.13;

      if (inViewport && host && ids.length) {
        const rect = host.getBoundingClientRect();
        const w = Math.ceil(rect.width);
        const h = Math.ceil(rect.height);
        // Cursor in element-local coordinates.
        const localX = curRef.current.x - rect.left;
        const localY = curRef.current.y - rect.top;

        const prev = prevRef.current;
        const moved = Math.abs(localX - prev.x) > 0.3 || Math.abs(localY - prev.y) > 0.3;
        const resized = w !== prev.w || h !== prev.h;

        if ((moved || resized) && w > 0 && h > 0) {
          prevRef.current = { x: localX, y: localY, w, h };
          const uri = buildProximityHalftoneSVG(w, h, step, baseDotSize, hoverDotSize, localX, localY, proximityRadius, feather);
          for (const id of ids) {
            const feImage = document.getElementById(id)?.querySelector('feImage');
            if (feImage) {
              feImage.setAttribute('href', uri);
              feImage.setAttribute('width', String(w));
              feImage.setAttribute('height', String(h));
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(tick);
    };
    const stopLoop = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };

    startLoop();

    // Pause entirely while scrolled out of view. The last built SVG persists,
    // and the cursor is re-sampled on the next frame, so there's nothing
    // jarring on return.
    const io = new IntersectionObserver((entries) => {
      inViewport = entries[0].isIntersecting;
      if (inViewport) startLoop();
      else stopLoop();
    }, { threshold: 0 });
    if (hostRef.current) io.observe(hostRef.current);

    return () => {
      window.removeEventListener('mousemove', onMove);
      io.disconnect();
      stopLoop();
    };
  // Re-mount only when enabled/disabled state changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostRef, filterIds.length, opts.prefersReduced]);
}

/**
 * Populates the feImage href for halftone filters with a full-size rotated dot
 * grid SVG, measured from the host element. Re-runs on resize.
 *
 * filterIds: array of filter element IDs whose first <feImage> to populate.
 * Each entry maps to one layer angle via SCREEN_ANGLES[index].
 */
export function useHalftoneScreen(
  hostRef: React.RefObject<HTMLElement | null>,
  filterIds: string[],
  opts: { step: number; contrast: number; prefersReduced?: boolean },
) {
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const filterIdsRef = useRef(filterIds);
  filterIdsRef.current = filterIds;
  const updateRef = useRef<() => void>(() => undefined);

  // Mount/resize effect — sets up ResizeObserver once
  useEffect(() => {
    if (!filterIds.length) return;

    const update = () => {
      const host = hostRef.current;
      if (!host) return;
      const rect = host.getBoundingClientRect();
      const w = Math.ceil(rect.width);
      const h = Math.ceil(rect.height);
      if (w === 0 || h === 0) return;
      const { step, contrast } = optsRef.current;
      for (let i = 0; i < filterIdsRef.current.length; i++) {
        const id = filterIdsRef.current[i];
        const angle = SCREEN_ANGLES[i % SCREEN_ANGLES.length];
        const uri = buildHalftoneSVG(w, h, step, contrast, angle);
        const feImage = document.getElementById(id)?.querySelector('feImage');
        if (feImage) {
          feImage.setAttribute('href', uri);
          feImage.setAttribute('width', String(w));
          feImage.setAttribute('height', String(h));
          feImage.setAttribute('x', '0');
          feImage.setAttribute('y', '0');
        }
      }
    };

    updateRef.current = update;
    update();
    let debounceTimer = 0;
    const debouncedUpdate = () => {
      clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(update, 150);
    };
    const ro = new ResizeObserver(debouncedUpdate);
    if (hostRef.current) ro.observe(hostRef.current);
    return () => { ro.disconnect(); clearTimeout(debounceTimer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostRef, filterIds.length]);

  // Re-render screen when step or contrast change without remounting the observer
  useEffect(() => {
    updateRef.current();
  }, [opts.step, opts.contrast]);
}
