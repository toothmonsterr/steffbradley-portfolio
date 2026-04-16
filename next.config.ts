import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Required: three.js ships as ESM and must be transpiled for Next.js
  transpilePackages: ['three'],
};

export default nextConfig;
// NOTE: Do NOT run `next dev --turbopack` — there is a known Turbopack bug
// in Next.js 15.3.x that incorrectly processes backdrop-filter CSS declarations.
// Run `next dev` (without --turbopack) for local development.
