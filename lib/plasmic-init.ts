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

// Line heights — unitless multipliers named by their value ("1", "1.5", "1.6", …)
Object.entries(tokens.lineHeight).forEach(([name, value]) => {
  PLASMIC.registerToken({ name, value: value as string, type: 'line-height' });
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
import { NoiseOverlay, NoiseOverlayMeta }       from '@/components/plasmic-components/NoiseOverlay';
import { OffsetShape, OffsetShapeMeta }         from '@/components/plasmic-components/OffsetShape';
import { OffsetImage, OffsetImageMeta }         from '@/components/plasmic-components/OffsetImage';
import { OffsetCMYK, OffsetCMYKMeta }           from '@/components/plasmic-components/OffsetCMYK';
import { HalftoneDots, HalftoneDotsMeta }       from '@/components/plasmic-components/HalftoneDots';
import { GradientBlob, GradientBlobMeta }       from '@/components/plasmic-components/GradientBlob';
import { DotOverlay, DotOverlayMeta }           from '@/components/plasmic-components/DotOverlay';
import { TornEdge, TornEdgeMeta }               from '@/components/plasmic-components/TornEdge';
import { InkBleed, InkBleedMeta }               from '@/components/plasmic-components/InkBleed';
import { PrintColorbar, PrintColorbarMeta }     from '@/components/plasmic-components/PrintColorbar';
import { TornSection, TornSectionMeta }         from '@/components/plasmic-components/TornSection';
import { HalftoneMask, HalftoneMaskMeta }       from '@/components/plasmic-components/HalftoneMask';
import { NoiseMask, NoiseMaskMeta }             from '@/components/plasmic-components/NoiseMask';
import { RevealOnScroll, RevealOnScrollMeta }   from '@/components/plasmic-components/RevealOnScroll';
import { NextImage, NextImageMeta }             from '@/components/plasmic-components/NextImage';
import { StickerPeel, StickerPeelMeta }         from '@/components/plasmic-components/StickerPeel';
import { ScotchTape, ScotchTapeMeta }           from '@/components/plasmic-components/ScotchTape';
import { Shimmer, ShimmerMeta }                 from '@/components/plasmic-components/Shimmer';
import { RichText, RichTextMeta }                 from '@/components/plasmic-components/RichText';
import { CaseStudyMeta, CaseStudyMetaMeta }       from '@/components/plasmic-components/CaseStudyMeta';
import { CaseStudyGallery, CaseStudyGalleryMeta } from '@/components/plasmic-components/CaseStudyGallery';
import { MockupFrame, MockupFrameMeta }           from '@/components/plasmic-components/MockupFrame';
import {
  CmsPaginationContext, CmsPaginationContextMeta,
  CmsPaginationControls, CmsPaginationControlsMeta,
  CmsPaginationButton, CmsPaginationButtonMeta,
} from '@/components/plasmic-components/CmsPagination';
import {
  ContactForm, ContactFormMeta,
  ContactField, ContactFieldMeta,
  ContactSubmit, ContactSubmitMeta,
} from '@/components/plasmic-components/ContactForm';

PLASMIC.registerComponent(FloatingElement, FloatingElementMeta as any);
PLASMIC.registerComponent(ScrollMarquee,   ScrollMarqueeMeta   as any);
PLASMIC.registerComponent(ModelViewer,     ModelViewerMeta     as any);
PLASMIC.registerComponent(NoiseOverlay,    NoiseOverlayMeta    as any);
PLASMIC.registerComponent(OffsetShape,     OffsetShapeMeta     as any);
PLASMIC.registerComponent(OffsetImage,     OffsetImageMeta     as any);
PLASMIC.registerComponent(OffsetCMYK,      OffsetCMYKMeta      as any);
PLASMIC.registerComponent(HalftoneDots,    HalftoneDotsMeta    as any);
PLASMIC.registerComponent(GradientBlob,    GradientBlobMeta    as any);
PLASMIC.registerComponent(DotOverlay,    DotOverlayMeta    as any);
PLASMIC.registerComponent(TornEdge,      TornEdgeMeta      as any);
PLASMIC.registerComponent(InkBleed,      InkBleedMeta      as any);
PLASMIC.registerComponent(PrintColorbar, PrintColorbarMeta as any);
PLASMIC.registerComponent(TornSection,   TornSectionMeta   as any);
PLASMIC.registerComponent(HalftoneMask, HalftoneMaskMeta  as any);
PLASMIC.registerComponent(NoiseMask,    NoiseMaskMeta     as any);
PLASMIC.registerComponent(RevealOnScroll, RevealOnScrollMeta as any);
PLASMIC.registerComponent(NextImage,           NextImageMeta           as any);
PLASMIC.registerComponent(StickerPeel,         StickerPeelMeta         as any);
PLASMIC.registerComponent(ScotchTape,          ScotchTapeMeta          as any);
PLASMIC.registerComponent(Shimmer,             ShimmerMeta             as any);
PLASMIC.registerComponent(RichText,         RichTextMeta         as any);
PLASMIC.registerComponent(CaseStudyMeta,    CaseStudyMetaMeta    as any);
PLASMIC.registerComponent(CaseStudyGallery, CaseStudyGalleryMeta as any);
PLASMIC.registerComponent(MockupFrame,      MockupFrameMeta      as any);
PLASMIC.registerComponent(CmsPaginationContext,  CmsPaginationContextMeta  as any);
PLASMIC.registerComponent(CmsPaginationControls, CmsPaginationControlsMeta as any);
PLASMIC.registerComponent(CmsPaginationButton,   CmsPaginationButtonMeta   as any);
PLASMIC.registerComponent(ContactForm,   ContactFormMeta   as any);
PLASMIC.registerComponent(ContactField,  ContactFieldMeta  as any);
PLASMIC.registerComponent(ContactSubmit, ContactSubmitMeta as any);
/* eslint-enable @typescript-eslint/no-explicit-any */
