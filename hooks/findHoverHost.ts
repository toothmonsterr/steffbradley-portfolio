// Walks up from `fromEl` to find the nearest ancestor that makes sense to attach
// hover listeners to.
//
// Heuristic:
//   1. Skip absolutely-positioned ancestors (those are usually effect layers themselves).
//   2. Stop at the first ancestor that has a non-zero layout box AND is not display:contents.
//   3. Don't go higher than <body>.
//
// Returned element is where `mouseenter`/`mouseleave` will fire reliably when a
// user hovers the button / card that the effect is filling.
export function findHoverHost(fromEl: HTMLElement | null): HTMLElement | null {
  if (!fromEl || typeof window === 'undefined') return null;

  let el: HTMLElement | null = fromEl.parentElement;
  while (el && el !== document.body) {
    const cs = window.getComputedStyle(el);
    if (cs.display !== 'contents' && cs.position !== 'absolute' && cs.position !== 'fixed') {
      // We want something with a rendered box; offsetParent is null for display:none
      if (el.offsetWidth > 0 || el.offsetHeight > 0) return el;
    }
    el = el.parentElement;
  }
  return fromEl.parentElement ?? null;
}
