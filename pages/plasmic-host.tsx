// This page is the Plasmic Studio canvas host.
// In Plasmic Studio → Project Settings → Host URL, set:
//   http://localhost:3000/plasmic-host  (for local development)
//   https://your-domain.com/plasmic-host  (for production preview)
//
// Do NOT include this page in your site navigation.

import { PlasmicCanvasHost } from '@plasmicapp/loader-nextjs';
// Side-effect import: registers all tokens and components with the Plasmic loader.
// Must be imported here so the canvas host has all custom components available.
import '@/lib/plasmic-init';

export default function PlasmicHost() {
  return <PlasmicCanvasHost />;
}
