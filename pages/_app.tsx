import "../components/plasmic/toothmonster/plasmic.css"; // plasmic-import: 67C2x4VH9CGyuASG98L3XF/projectcss
import "@/styles/globals.css";
import type { AppProps } from "next/app";

// Codegen pages provide their own Plasmic context (PlasmicQueryDataProvider) per-page,
// so no global PlasmicRootProvider is needed here.
//
// Fonts are plain @font-face rules in globals.css under the family names the
// Plasmic tokens use, so there is no font className to inject here.

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div style={{ minHeight: "100%" }}>
      <Component {...pageProps} />
    </div>
  );
}
