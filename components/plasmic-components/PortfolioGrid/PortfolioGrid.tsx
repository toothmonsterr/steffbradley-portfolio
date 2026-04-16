import React from 'react';
import { usePlasmicQueryData, DataProvider } from '@plasmicapp/loader-nextjs';
import { PortfolioCard } from './PortfolioCard';
import type { PortfolioItem } from './PortfolioCard';
import styles from './PortfolioGrid.module.css';

export interface PortfolioGridProps {
  cmsId?: string;
  cmsPublicToken?: string;
  // Which CMS table to query: 'case-studies' or 'art-portfolio'
  collection?: string;
  columns?: number;
  gap?: number;
  children?: React.ReactNode;
  className?: string;
}

interface CmsRow {
  data: PortfolioItem;
  id: string;
}

interface CmsResponse {
  rows?: CmsRow[];
}

export function PortfolioGrid({
  cmsId,
  cmsPublicToken,
  collection = 'case-studies',
  columns = 3,
  gap = 24,
  className,
}: PortfolioGridProps) {
  const queryKey = `portfolio-${collection}`;
  const resolvedCmsId    = cmsId    ?? process.env.NEXT_PUBLIC_PLASMIC_CMS_ID    ?? '';
  const resolvedCmsToken = cmsPublicToken ?? process.env.NEXT_PUBLIC_PLASMIC_CMS_TOKEN ?? '';

  const { data, error } = usePlasmicQueryData<CmsResponse>(queryKey, async () => {
    if (!resolvedCmsId || !resolvedCmsToken) return { rows: [] };

    const res = await fetch(
      `https://studio.plasmic.app/api/v1/cms/databases/${resolvedCmsId}/tables/${collection}/query`,
      {
        headers: {
          'x-plasmic-api-cms-tokens': `${resolvedCmsId}:${resolvedCmsToken}`,
        },
      }
    );
    if (!res.ok) return { rows: [] };
    return res.json();
  });

  const items: PortfolioItem[] = (data?.rows ?? []).map((row) => row.data);

  if (error) {
    console.error('[PortfolioGrid] CMS fetch error:', error);
  }

  return (
    <DataProvider name="portfolioItems" data={items}>
      <div
        className={[styles.grid, className ?? ''].filter(Boolean).join(' ')}
        style={{
          '--columns': columns,
          '--gap': `${gap}px`,
        } as React.CSSProperties}
      >
        {items.map((item, i) => (
          <PortfolioCard key={i} item={item} />
        ))}
        {items.length === 0 && (
          <p style={{ color: 'var(--color-neutral-50)', fontFamily: 'var(--font-body)' }}>
            no items yet — add entries in Plasmic CMS
          </p>
        )}
      </div>
    </DataProvider>
  );
}
