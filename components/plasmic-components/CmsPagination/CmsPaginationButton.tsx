import React from 'react';

export interface CmsPaginationButtonProps {
  children?: React.ReactNode;
  /** True when this button represents the current page — use to define an "active" variant in Studio */
  isActive?: boolean;
  /** The page number this button represents — bind a text element inside to this */
  pageNumber?: number;
  onClick?: () => void;
  className?: string;
}

export function CmsPaginationButton({
  children,
  isActive = false,
  pageNumber,
  onClick,
  className,
}: CmsPaginationButtonProps) {
  return (
    <div
      className={className}
      data-is-active={isActive ? 'true' : 'false'}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      aria-label={pageNumber !== undefined ? `Page ${pageNumber}` : undefined}
      role="button"
      style={{ cursor: 'pointer' }}
    >
      {children}
    </div>
  );
}
