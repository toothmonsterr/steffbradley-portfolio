// GSAP is imported and configured here once.
// Import { gsap, ScrollTrigger } from this file instead of directly from 'gsap'
// to guarantee ScrollTrigger is always registered.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };
