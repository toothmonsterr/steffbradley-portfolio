import { useEffect, useState } from 'react';

/**
 * True in WebKit-engine browsers: Safari, and every browser on iOS (Chrome
 * and Firefox there are WebKit too).
 *
 * WebKit does not render raster <feImage> inside CSS filters applied to HTML,
 * so the pre-rendered grain tiles (public/textures) come out empty there; the
 * texture components fall back to their live feTurbulence chains in WebKit.
 *
 * False on the server and the first client render so the hydrated markup
 * matches the server HTML; flips after mount.
 */
export function useIsWebKit(): boolean {
  const [isWebKit, setIsWebKit] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent;
    setIsWebKit(/AppleWebKit/.test(ua) && !/(Chrome|Chromium|Edg|OPR)\//.test(ua));
  }, []);
  return isWebKit;
}
