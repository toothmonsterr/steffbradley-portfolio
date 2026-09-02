/**
 * Frame-rate limiter for requestAnimationFrame loops.
 *
 * Call at the top of a tick. Returns false when the frame should be skipped —
 * the caller still re-schedules the RAF, it just does no work this time. Keeps
 * ambient motion alive on weaker devices at a fraction of the cost.
 *
 * `lastRef` is a plain mutable ref holding the timestamp of the last rendered
 * frame; seed it with 0.
 *
 *   if (!shouldRenderFrame(now, lastFrameRef, frameInterval)) {
 *     raf = requestAnimationFrame(tick);
 *     return;
 *   }
 */
export function shouldRenderFrame(
  now: number,
  lastRef: { current: number },
  minIntervalMs: number
): boolean {
  if (minIntervalMs <= 0) return true;
  if (lastRef.current !== 0 && now - lastRef.current < minIntervalMs) return false;
  lastRef.current = now;
  return true;
}
