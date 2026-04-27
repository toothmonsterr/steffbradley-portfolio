import React from 'react';
import { usePlasmicCanvasContext, useSelector } from '@plasmicapp/react-web/lib/host';
import styles from './CmsPaginationControls.module.css';
import { usePaginationStore } from './store';
import { CmsPaginationButton } from './CmsPaginationButton';

interface CmsPaginationButtonClonedProps {
  isActive?: boolean;
  pageNumber?: number;
  onClick?: () => void;
}

export interface CmsPaginationControlsProps {
  /** Show numbered page buttons between prev/next (default true) */
  showPageNumbers?: boolean;
  /** Max page buttons visible before collapsing with ellipsis (default 5) */
  maxPageButtons?: number;
  /** Slot: a single CmsPaginationButton template — cloned once per page with fresh pageNumber and isActive props */
  pageButton?: React.ReactNode;
  /** Slot: custom previous button */
  prevButton?: React.ReactNode;
  /** Slot: custom next button */
  nextButton?: React.ReactNode;
  /** Fallback label when no prevButton slot is provided */
  prevLabel?: string;
  /** Fallback label when no nextButton slot is provided */
  nextLabel?: string;
  className?: string;
}

function buildPageList(current: number, total: number, max: number): (number | '…')[] {
  if (total <= max) return Array.from({ length: total }, (_, i) => i + 1);
  const half  = Math.floor((max - 2) / 2);
  const start = Math.max(2, current - half);
  const end   = Math.min(total - 1, current + half);
  const pages: (number | '…')[] = [1];
  if (start > 2) pages.push('…');
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push('…');
  pages.push(total);
  return pages;
}

function cloneClickable(
  node: React.ReactNode,
  onClick: () => void,
  disabled: boolean,
  extra?: Record<string, unknown>,
) {
  if (!React.isValidElement(node)) return node;
  return React.cloneElement(node as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
    onClick,
    'aria-disabled': disabled || undefined,
    style: disabled
      ? { ...(node.props as React.CSSProperties), opacity: 0.4, pointerEvents: 'none' }
      : (node.props as React.HTMLAttributes<HTMLElement>).style,
    ...extra,
  });
}

export function CmsPaginationControls({
  showPageNumbers = true,
  maxPageButtons  = 5,
  pageButton,
  prevButton,
  nextButton,
  prevLabel       = '←',
  nextLabel       = '→',
  className,
}: CmsPaginationControlsProps) {
  const inCanvas = !!usePlasmicCanvasContext();
  const storeId  = useSelector('paginationCtxId') as string | undefined;
  const entry    = usePaginationStore(storeId);

  if (!entry) {
    if (!inCanvas) return null;
    return (
      <div style={{ padding: '8px', border: '1px dashed #aaa', color: '#888', fontSize: 12 }}>
        CmsPaginationControls: place inside a CmsPaginationContext
      </div>
    );
  }

  const { currentPage, totalPages, hasPrev, hasNext } = entry.state;
  const go    = (p: number) => entry.setter(p);
  const pages = showPageNumbers ? buildPageList(currentPage, totalPages, maxPageButtons) : [];

  const renderPrev = () => {
    if (prevButton) return cloneClickable(prevButton, () => go(currentPage - 1), !hasPrev, { 'aria-label': 'Previous page' });
    return (
      <button className={styles.button} onClick={() => go(currentPage - 1)} disabled={!hasPrev} aria-label="Previous page">
        {prevLabel}
      </button>
    );
  };

  const renderNext = () => {
    if (nextButton) return cloneClickable(nextButton, () => go(currentPage + 1), !hasNext, { 'aria-label': 'Next page' });
    return (
      <button className={styles.button} onClick={() => go(currentPage + 1)} disabled={!hasNext} aria-label="Next page">
        {nextLabel}
      </button>
    );
  };

  return (
    <nav className={[styles.nav, className ?? ''].filter(Boolean).join(' ')} aria-label="Pagination">
      {renderPrev()}

      {pages.map((p, i) => {
        if (p === '…') {
          return <span key={`ellipsis-${i}`} className={styles.ellipsis} aria-hidden="true">…</span>;
        }

        const pageNum  = p as number;
        const isActive = pageNum === currentPage;

        // If user provided a CmsPaginationButton template via the slot, clone it
        // per page with fresh isActive/pageNumber/onClick props. Cloning (vs.
        // repeatedElement) ensures every clone re-renders with current props.
        if (React.isValidElement(pageButton)) {
          return React.cloneElement(
            pageButton as React.ReactElement<CmsPaginationButtonClonedProps>,
            {
              key: pageNum,
              isActive,
              pageNumber: pageNum,
              onClick: () => go(pageNum),
            },
          );
        }

        return (
          <CmsPaginationButton
            key={pageNum}
            isActive={isActive}
            pageNumber={pageNum}
            onClick={() => go(pageNum)}
          >
            <span className={styles.button}>{pageNum}</span>
          </CmsPaginationButton>
        );
      })}

      {renderNext()}
    </nav>
  );
}
