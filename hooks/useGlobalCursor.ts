import { useEffect } from 'react';
import { motionValue, type MotionValue } from 'motion/react';

// Module-level singletons so every subscriber shares the same MotionValues
// and a single window 'mousemove' listener per page.
const xVal: MotionValue<number> = motionValue(0);
const yVal: MotionValue<number> = motionValue(0);
let subscribers = 0;
let listener: ((e: MouseEvent) => void) | null = null;
let initialized = false;

function attach() {
  if (typeof window === 'undefined') return;
  if (listener) return;

  listener = (e: MouseEvent) => {
    xVal.set(e.clientX);
    yVal.set(e.clientY);
  };
  window.addEventListener('mousemove', listener, { passive: true });

  // Seed with current cursor position if we have any signal (fallback: viewport center)
  if (!initialized) {
    xVal.set(window.innerWidth / 2);
    yVal.set(window.innerHeight / 2);
    initialized = true;
  }
}

function detach() {
  if (!listener) return;
  window.removeEventListener('mousemove', listener);
  listener = null;
}

export interface GlobalCursor {
  x: MotionValue<number>;
  y: MotionValue<number>;
}

export function useGlobalCursor(): GlobalCursor {
  useEffect(() => {
    subscribers += 1;
    attach();
    return () => {
      subscribers -= 1;
      if (subscribers <= 0) {
        subscribers = 0;
        detach();
      }
    };
  }, []);

  return { x: xVal, y: yVal };
}
