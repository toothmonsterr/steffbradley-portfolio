import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preload TAN Rosebud — critical display font (TTF; upgrade to WOFF2 for best perf) */}
        <link
          rel="preload"
          href="/fonts/TAN Rosebud.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </Head>
      <body>
        {/*
          Global SVG filter definitions.
          Noise threshold filter: feTurbulence → greyscale → discrete threshold (pure B&W).
          Referenced anywhere as filter: url(#noise-threshold).
          Must live in the document so filter: url(#id) resolves same-origin.
        */}
        <svg
          aria-hidden="true"
          focusable="false"
          style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
        >
          <defs>
            <filter
              id="noise-threshold"
              x="0%"
              y="0%"
              width="100%"
              height="100%"
              colorInterpolationFilters="linearRGB"
            >
              {/* Generate fractal noise */}
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.65 0.65"
                numOctaves={3}
                seed={2}
                stitchTiles="stitch"
                result="noiseOut"
              />
              {/* Convert to greyscale */}
              <feColorMatrix
                type="saturate"
                values="0"
                in="noiseOut"
                result="grey"
              />
              {/* Threshold: discrete 0/1 — pure black or pure white, no grey */}
              <feComponentTransfer in="grey" result="threshold">
                <feFuncR type="discrete" tableValues="0 1" />
                <feFuncG type="discrete" tableValues="0 1" />
                <feFuncB type="discrete" tableValues="0 1" />
              </feComponentTransfer>
              {/* Composite over source so it inherits shape/alpha */}
              <feComposite in="threshold" in2="SourceGraphic" operator="in" />
            </filter>
          </defs>
        </svg>

        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
