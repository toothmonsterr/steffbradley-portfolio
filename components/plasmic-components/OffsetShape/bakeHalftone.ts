import { useEffect, useState, type RefObject } from 'react';
import { buildHalftoneSVG, SCREEN_ANGLES } from './shared';
import { resolveCssColor } from '../NoiseOverlay/tintedGrain';

// Bakes OffsetShape's halftone ink layers into plain images, once, in the
// browser.
//
// Each layer used to be a live SVG filter: a full-size dot screen (feImage)
// composited into the content's alpha and flooded with the ink colour. The
// result never changes while the element sits there, but the browser still
// re-ran the chain whenever the layer was invalidated — and these layers sit
// inside a continuously floating, wobbling element. The canvas below does the
// identical composite (silhouette → dots inside it → ink colour) and hands
// back an image, so the moving layers only have to move a bitmap.
//
// The motion is untouched: misregistration, wobble and hover transform the
// layer, not its pixels.

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** An <svg> or <img> rendered by the slot, as a drawable image. */
async function silhouetteOf(el: Element, w: number, h: number): Promise<HTMLImageElement | null> {
  if (el instanceof HTMLImageElement) {
    if (!el.complete) await el.decode().catch(() => undefined);
    return el.naturalWidth ? el : null;
  }
  if (el instanceof SVGSVGElement) {
    const clone = el.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', String(w));
    clone.setAttribute('height', String(h));
    // Only the alpha matters (the ink colour replaces it), but give the
    // shapes a solid fill so currentColor/class-based fills still count.
    clone.style.color = '#000';
    const url = URL.createObjectURL(
      new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }),
    );
    try {
      return await loadImage(url);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  return null;
}

export interface HalftoneBakeOpts {
  enabled: boolean;
  colors: string[];
  step: number;
  contrast: number;
}

/**
 * Returns one object URL per layer (same order as `colors`) once baked, or
 * null while the live filters should still be shown — before hydration, while
 * baking, or when the content can't be baked (not a single <svg>/<img>).
 */
export function useBakedHalftone(
  hostRef: RefObject<HTMLElement | null>,
  sizerRef: RefObject<HTMLElement | null>,
  { enabled, colors, step, contrast }: HalftoneBakeOpts,
): string[] | null {
  const [urls, setUrls] = useState<string[] | null>(null);
  const colorKey = colors.join('|');

  useEffect(() => {
    if (!enabled) { setUrls(null); return; }
    const host = hostRef.current;
    const sizer = sizerRef.current;
    if (!host || !sizer) return;

    let cancelled = false;
    let made: string[] = [];
    let timer = 0;

    const bake = async () => {
      const content = sizer.querySelector('svg, img');
      const hostRect = host.getBoundingClientRect();
      if (!content || hostRect.width === 0 || hostRect.height === 0) return;
      const r = content.getBoundingClientRect();
      const w = Math.ceil(hostRect.width);
      const h = Math.ceil(hostRect.height);
      // 1x, like the filter: it rasterized its dot screen at css-pixel size and
      // let the browser scale it, which is the softer look the design was made
      // with. Baking at device resolution came out noticeably crisper.
      const dpr = 1;

      const shape = await silhouetteOf(content, Math.round(r.width), Math.round(r.height));
      if (!shape || cancelled) return;

      const next: string[] = [];
      for (let i = 0; i < colors.length; i++) {
        // The same dot screen the filter used: host-sized, centred, rotated to
        // this layer's screen angle.
        const screen = await loadImage(buildHalftoneSVG(w, h, step, contrast, SCREEN_ANGLES[i % SCREEN_ANGLES.length]));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);
        // 1. Silhouette, where the content sits inside the host.
        ctx.drawImage(shape, r.left - hostRect.left, r.top - hostRect.top, r.width, r.height);
        // 2. Keep only the dots that fall inside it.
        ctx.globalCompositeOperation = 'source-in';
        ctx.drawImage(screen, 0, 0, w, h);
        // 3. Ink.
        ctx.fillStyle = resolveCssColor(colors[i]);
        ctx.fillRect(0, 0, w, h);
        const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
        if (!blob || cancelled) return;
        next.push(URL.createObjectURL(blob));
      }
      if (cancelled) { next.forEach(URL.revokeObjectURL); return; }
      made.forEach(URL.revokeObjectURL);
      made = next;
      setUrls(next);
    };

    bake();
    // Re-bake if the element is resized (the screen is host-sized).
    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = window.setTimeout(bake, 150);
    });
    ro.observe(host);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      ro.disconnect();
      made.forEach(URL.revokeObjectURL);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, colorKey, step, contrast]);

  return urls;
}
