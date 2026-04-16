import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { tanRosebud, urbanist, syne } from '@/lib/fonts';

// NOTE: PlasmicRootProvider is intentionally NOT here.
// It belongs only on pages that use Plasmic data (i.e. [[...catchall]].tsx with prefetchedData).
// Putting PlasmicRootProvider globally in _app.tsx causes the plasmic-host page to subscribe
// to Studio changes as a client, which conflicts with it acting as the canvas host.

export default function App({ Component, pageProps }: AppProps) {
  return (
    // Font CSS variables injected here so all components can reference
    // var(--font-display), var(--font-heading), var(--font-body)
    <div
      className={`${tanRosebud.variable} ${urbanist.variable} ${syne.variable}`}
      style={{ minHeight: '100%' }}
    >
      <Component {...pageProps} />
    </div>
  );
}
