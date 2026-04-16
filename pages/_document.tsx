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
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
