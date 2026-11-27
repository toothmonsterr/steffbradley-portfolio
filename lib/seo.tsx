import * as React from "react";
import Head from "next/head";

// ---------------------------------------------------------------------------
// Page metadata: <title>, description, canonical URL, Open Graph and Twitter
// cards.
//
// Render <PageMeta> AFTER the Plasmic page component. The generated pages put
// their own <title>/og:title tags in <Head>; next/head keeps the last tag for
// each key, so the ones here win and Plasmic syncs can't clobber them.
// ---------------------------------------------------------------------------

export const SITE_NAME = "Steff Bradley";
export const SITE_DESCRIPTION =
  "Steff Bradley is a design engineer who designs and builds design systems, Figma tooling and conversion-focused web experiences.";

// The hero is a .webp, which some link previewers don't render. Swap in a
// 1200×630 PNG/JPG here if previews come out blank.
export const DEFAULT_OG_IMAGE = "/images/toothcontact-hero.webp";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");

/** Make a site path absolute. Link previewers ignore relative og:image URLs. */
function absolute(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export interface PageMetaProps {
  /** Page title without the site name; omit for the homepage. */
  title?: string;
  description?: string;
  /** Path of this page, e.g. "/about". Used for canonical and og:url. */
  path: string;
  image?: string;
  type?: "website" | "article";
}

export function PageMeta({
  title,
  description = SITE_DESCRIPTION,
  path,
  image = DEFAULT_OG_IMAGE,
  type = "website",
}: PageMetaProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const url = absolute(path);
  const imageUrl = absolute(image);

  return (
    <Head>
      <title key="title">{fullTitle}</title>
      <meta key="description" name="description" content={description} />
      {SITE_URL && <link key="canonical" rel="canonical" href={url} />}

      <meta key="og:site_name" property="og:site_name" content={SITE_NAME} />
      <meta key="og:type" property="og:type" content={type} />
      <meta key="og:title" property="og:title" content={fullTitle} />
      <meta key="og:description" property="og:description" content={description} />
      {SITE_URL && <meta key="og:url" property="og:url" content={url} />}
      <meta key="og:image" property="og:image" content={imageUrl} />

      <meta key="twitter:card" name="twitter:card" content="summary_large_image" />
      <meta key="twitter:title" name="twitter:title" content={fullTitle} />
      <meta key="twitter:description" name="twitter:description" content={description} />
      <meta key="twitter:image" name="twitter:image" content={imageUrl} />
    </Head>
  );
}

// ---------------------------------------------------------------------------
// Case study metadata, read from the CMS query cache getStaticProps already
// collected, so there's no second CMS request.
// ---------------------------------------------------------------------------

export interface CaseStudyMeta {
  title: string | null;
  description: string | null;
  image: string | null;
}

type CmsRow = { data?: Record<string, unknown> };

function isCaseStudyRow(value: unknown, slug: string): value is CmsRow {
  const data = (value as CmsRow | null)?.data;
  return !!data && typeof data === "object" && data.caseStudySlug === slug;
}

/** Depth-first search of the query cache for the row whose slug matches. */
function findRow(value: unknown, slug: string, depth = 0): CmsRow | null {
  if (depth > 6 || !value || typeof value !== "object") return null;
  if (isCaseStudyRow(value, slug)) return value;
  for (const child of Object.values(value as Record<string, unknown>)) {
    const found = findRow(child, slug, depth + 1);
    if (found) return found;
  }
  return null;
}

/** Strip HTML and collapse whitespace, then cut to a description-sized length. */
function toPlainText(value: unknown, max = 160): string | null {
  if (typeof value !== "string") return null;
  const text = value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return null;
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 0 ? cut.lastIndexOf(" ") : cut.length)}…`;
}

function imageUrl(value: unknown): string | null {
  const url = (value as { url?: unknown } | null)?.url;
  return typeof url === "string" && url ? url : null;
}

export function findCaseStudyMeta(
  queryCache: Record<string, unknown> | undefined,
  slug: string
): CaseStudyMeta {
  const data = findRow(queryCache, slug)?.data ?? {};
  return {
    title: toPlainText(data.caseStudyTitle, 120),
    description: toPlainText(data.caseStudyDesc),
    image:
      imageUrl(data.caseStudyCardImg) ??
      imageUrl(data.caseStudyFooterImg) ??
      imageUrl(data.caseStudyDesktopScreenshot),
  };
}
