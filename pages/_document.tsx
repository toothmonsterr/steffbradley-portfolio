import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preload the two fonts above the fold: TAN Rosebud (display
            headings) and Urbanist (body). Syne loads on demand from its
            @font-face in globals.css. */}
        <link
          rel="preload"
          href="/fonts/tan-rosebud.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/urbanist-latin-variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
