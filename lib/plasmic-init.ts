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
// All color tokens become --plasmic-token-{name} CSS variables in Studio.
// ---------------------------------------------------------------------------
Object.entries(tokens.color).forEach(([name, value]) => {
  PLASMIC.registerToken({ name, value: value as string, type: 'color' });
});

Object.entries(tokens.fontFamily).forEach(([name, value]) => {
  PLASMIC.registerToken({ name: `font-${name}`, value: value as string, type: 'font-family' });
});

// Spacing — register the numeric primitives and t-shirt semantic aliases separately.
// Plasmic shows these in the Spacing tokens panel.
Object.entries(tokens.spacingScale).forEach(([name, value]) => {
  PLASMIC.registerToken({ name: `sp-${name}`, value: value as string, type: 'spacing' });
});
Object.entries(tokens.spacing).forEach(([name, value]) => {
  PLASMIC.registerToken({ name: `space-${name}`, value: value as string, type: 'spacing' });
});

// Border radius — 'border-radius' is not a Plasmic TokenType; tokens live as
// CSS vars (--radius-sm etc.) and can be referenced in Studio's raw CSS input.

// Opacity — key is the integer percentage (e.g. '50' → 0.5)
Object.entries(tokens.opacity).forEach(([name, value]) => {
  PLASMIC.registerToken({ name: `opacity-${name}`, value: value as string, type: 'opacity' });
});

// Font size — register numeric primitives and t-shirt aliases.
Object.entries(tokens.fontSizeScale).forEach(([name, value]) => {
  PLASMIC.registerToken({ name: `fs-${name}`, value: value as string, type: 'font-size' });
});
Object.entries(tokens.fontSize).forEach(([name, value]) => {
  PLASMIC.registerToken({ name: `font-size-${name}`, value: value as string, type: 'font-size' });
});

// Line height
Object.entries(tokens.lineHeight).forEach(([name, value]) => {
  PLASMIC.registerToken({ name: `lh-${name}`, value: value as string, type: 'line-height' });
});

// ---------------------------------------------------------------------------
// Component registrations.
// Meta objects are cast to `any` because Plasmic's prop type system requires
// literal string types (e.g. 'string' not string) which TypeScript infers
// as wide types from plain object literals. Runtime behaviour is unaffected.
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
import { SecondaryButton, SecondaryButtonMeta } from '@/components/plasmic-components/SecondaryButton';
import { ContactField, ContactFieldMeta }       from '@/components/plasmic-components/ContactField';
import { IconListItem, IconListItemMeta }       from '@/components/plasmic-components/IconListItem';
import { Footer, FooterMeta }                   from '@/components/plasmic-components/Footer';
import { StickyNav, StickyNavMeta }             from '@/components/plasmic-components/StickyNav';
import { FloatingElement, FloatingElementMeta } from '@/components/plasmic-components/FloatingElement';
import { PrimaryButton, PrimaryButtonMeta }     from '@/components/plasmic-components/PrimaryButton';
import { ScrollMarquee, ScrollMarqueeMeta }     from '@/components/plasmic-components/ScrollMarquee';
import { PortfolioGrid, PortfolioGridMeta }     from '@/components/plasmic-components/PortfolioGrid';
import { ModelViewer, ModelViewerMeta }         from '@/components/plasmic-components/ModelViewer';
import { DotOverlay, DotOverlayMeta }           from '@/components/plasmic-components/DotOverlay';
import { CursorDots, CursorDotsMeta }           from '@/components/plasmic-components/CursorDots';
import { CursorShadow, CursorShadowMeta }       from '@/components/plasmic-components/CursorShadow';

PLASMIC.registerComponent(SecondaryButton, SecondaryButtonMeta as any);
PLASMIC.registerComponent(ContactField,    ContactFieldMeta    as any);
PLASMIC.registerComponent(IconListItem,    IconListItemMeta    as any);
PLASMIC.registerComponent(Footer,          FooterMeta          as any);
PLASMIC.registerComponent(StickyNav,       StickyNavMeta       as any);
PLASMIC.registerComponent(FloatingElement, FloatingElementMeta as any);
PLASMIC.registerComponent(PrimaryButton,   PrimaryButtonMeta   as any);
PLASMIC.registerComponent(ScrollMarquee,   ScrollMarqueeMeta   as any);
PLASMIC.registerComponent(PortfolioGrid,   PortfolioGridMeta   as any);
PLASMIC.registerComponent(ModelViewer,     ModelViewerMeta     as any);
PLASMIC.registerComponent(DotOverlay,      DotOverlayMeta      as any);
PLASMIC.registerComponent(CursorDots,      CursorDotsMeta      as any);
PLASMIC.registerComponent(CursorShadow,    CursorShadowMeta    as any);
/* eslint-enable @typescript-eslint/no-explicit-any */
