import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { tanRosebud, urbanist, syne } from '@/lib/fonts';

// Codegen pages provide their own Plasmic context (PlasmicQueryDataProvider) per-page,
// so no global PlasmicRootProvider is needed here.

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
