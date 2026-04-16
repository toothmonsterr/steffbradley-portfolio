import { initPlasmicLoader } from '@plasmicapp/loader-nextjs';
import { tokens } from '@/tokens';

// ---------------------------------------------------------------------------
// Initialize the Plasmic loader.
// Replace PLASMIC_PROJECT_ID and PLASMIC_PUBLIC_TOKEN with your project values
// from Plasmic Studio → Project Settings → API tokens.
// ---------------------------------------------------------------------------
export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      id:    process.env.NEXT_PUBLIC_PLASMIC_PROJECT_ID    ?? 'YOUR_PROJECT_ID',
      token: process.env.NEXT_PUBLIC_PLASMIC_PUBLIC_TOKEN  ?? 'YOUR_PUBLIC_TOKEN',
    },
  ],
  // In development, always fetch the latest from Plasmic Studio.
  // In production, use the pre-fetched static data from getStaticProps.
  preview: process.env.NODE_ENV === 'development',
});

// ---------------------------------------------------------------------------
// Register design tokens.
// ---------------------------------------------------------------------------

// Colors — brand-* prefix for brand palette; neutral/success/warning/error keep their prefix.
Object.entries(tokens.color).forEach(([name, value]) => {
  PLASMIC.registerToken({ name, value: value as string, type: 'color' });
});

// Font families
Object.entries(tokens.fontFamily).forEach(([name, value]) => {
  PLASMIC.registerToken({ name: `font-${name}`, value: value as string, type: 'font-family' });
});

// Spacing — raw px values named by their value ("4px", "8px", … "144px")
Object.entries(tokens.spacingPx).forEach(([name, value]) => {
  PLASMIC.registerToken({ name, value: value as string, type: 'spacing' });
});

// Large layout sizes ("320px" … "1920px")
Object.entries(tokens.spacingLarge).forEach(([name, value]) => {
  PLASMIC.registerToken({ name, value: value as string, type: 'spacing' });
});

// Font sizes — raw rem values named by their value ("0.75rem", "1rem", …)
Object.entries(tokens.fontSizeRem).forEach(([name, value]) => {
  PLASMIC.registerToken({ name, value: value as string, type: 'font-size' });
});

// Opacity — key is the integer percentage ("0" … "100")
Object.entries(tokens.opacity).forEach(([name, value]) => {
  PLASMIC.registerToken({ name: `opacity-${name}`, value: value as string, type: 'opacity' });
});

// Border radius — not a valid Plasmic TokenType; lives as CSS vars only (--radius-sm etc.).
// Line height  — not registered; user creates semantic tokens in Studio.

// ---------------------------------------------------------------------------
// Component registrations.
// Meta objects are cast to `any` because Plasmic's prop type system requires
// literal string types (e.g. 'string' not string) which TypeScript infers
// as wide types from plain object literals. Runtime behaviour is unaffected.
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
import { FloatingElement, FloatingElementMeta } from '@/components/plasmic-components/FloatingElement';
import { ScrollMarquee, ScrollMarqueeMeta }     from '@/components/plasmic-components/ScrollMarquee';
import { ModelViewer, ModelViewerMeta }         from '@/components/plasmic-components/ModelViewer';
import { DotOverlay, DotOverlayMeta }           from '@/components/plasmic-components/DotOverlay';
import { CursorDots, CursorDotsMeta }           from '@/components/plasmic-components/CursorDots';
import { CursorShadow, CursorShadowMeta }       from '@/components/plasmic-components/CursorShadow';
import { NoiseOverlay, NoiseOverlayMeta }       from '@/components/plasmic-components/NoiseOverlay';
import { OffsetPrint, OffsetPrintMeta }         from '@/components/plasmic-components/OffsetPrint';
import { TiltCard, TiltCardMeta }               from '@/components/plasmic-components/TiltCard';
import { CursorParallax, CursorParallaxMeta }   from '@/components/plasmic-components/CursorParallax';
import { GradientBlob, GradientBlobMeta }       from '@/components/plasmic-components/GradientBlob';
import { StickerPeel, StickerPeelMeta }         from '@/components/plasmic-components/StickerPeel';
import { ScrollParallax, ScrollParallaxMeta }   from '@/components/plasmic-components/ScrollParallax';

PLASMIC.registerComponent(FloatingElement, FloatingElementMeta as any);
PLASMIC.registerComponent(ScrollMarquee,   ScrollMarqueeMeta   as any);
PLASMIC.registerComponent(ModelViewer,     ModelViewerMeta     as any);
PLASMIC.registerComponent(DotOverlay,      DotOverlayMeta      as any);
PLASMIC.registerComponent(CursorDots,      CursorDotsMeta      as any);
PLASMIC.registerComponent(CursorShadow,    CursorShadowMeta    as any);
PLASMIC.registerComponent(NoiseOverlay,    NoiseOverlayMeta    as any);
PLASMIC.registerComponent(OffsetPrint,     OffsetPrintMeta     as any);
PLASMIC.registerComponent(TiltCard,        TiltCardMeta        as any);
PLASMIC.registerComponent(CursorParallax,  CursorParallaxMeta  as any);
PLASMIC.registerComponent(GradientBlob,    GradientBlobMeta    as any);
PLASMIC.registerComponent(StickerPeel,     StickerPeelMeta     as any);
PLASMIC.registerComponent(ScrollParallax,  ScrollParallaxMeta  as any);
/* eslint-enable @typescript-eslint/no-explicit-any */
