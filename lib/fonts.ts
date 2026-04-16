import localFont from 'next/font/local';
import { Urbanist, Syne } from 'next/font/google';

// TAN Rosebud — self-hosted (licensed).
// Using the TTF file. For optimal performance, consider converting to WOFF2
// (e.g. via fonttools/woff2 CLI) and updating this path to tan-rosebud.woff2.
export const tanRosebud = localFont({
  src: '../public/fonts/TAN Rosebud.ttf',
  variable: '--font-display',
  display: 'swap',
  preload: true,
});

// Urbanist — variable weight (100–900)
export const urbanist = Urbanist({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

// Syne — variable weight (400–800)
export const syne = Syne({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});
