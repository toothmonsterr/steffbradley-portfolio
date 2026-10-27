// Turns a black-on-transparent grain tile into a tile of a given colour, once
// per (tile, colour), so the grain can be drawn as a plain repeating
// background-image.
//
// Why not mask-image: a tiled CSS mask over a large section is expensive to
// composite, and in Firefox it was the single biggest scroll cost on the
// homepage (a ~36ms median frame without masks versus 100ms+ with them). A
// background image is the cheapest thing a browser can repeat.

const cache = new Map<string, Promise<string | null>>();

let probe: HTMLSpanElement | null = null;

/**
 * Resolves any CSS colour, including var(--token-…), to something canvas
 * understands, by letting the browser compute it on a probe element in the
 * same document (so page-level custom properties apply).
 */
function resolveColor(color: string): string {
  if (!probe) {
    probe = document.createElement('span');
    probe.style.display = 'none';
    document.body.appendChild(probe);
  }
  probe.style.color = '';
  probe.style.color = color;
  return getComputedStyle(probe).color || color;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Object URL of `tileUrl` recoloured to `color`, or null if it can't be made. */
export function tintedGrain(tileUrl: string, color: string): Promise<string | null> {
  const rgb = resolveColor(color);
  const key = `${tileUrl}|${rgb}`;
  let job = cache.get(key);
  if (!job) {
    job = (async () => {
      try {
        const img = await loadImage(tileUrl);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(img, 0, 0);
        // Keep the tile's alpha, replace its colour.
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = rgb;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
        return blob ? URL.createObjectURL(blob) : null;
      } catch {
        return null;
      }
    })();
    cache.set(key, job);
  }
  return job;
}
