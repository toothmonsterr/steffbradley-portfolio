import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { DataProvider, useSelector } from '@plasmicapp/react-web/lib/host';
import { usePlasmicQueryData } from '@plasmicapp/react-web/lib/query';
import { mkApi } from '@plasmicpkgs/plasmic-cms';
import { writeStore, removeStore } from './store';

const CMS_DB_CONTEXT_KEY = 'plasmicCmsDatabase';

export interface CmsPaginationContextProps {
  children?: React.ReactNode;
  databaseId?: string;
  databaseToken?: string;
  /** CMS table name to paginate */
  table?: string;
  /** Rows per page (default 10) */
  pageSize?: number;
  /** Optional JSON WHERE filter, e.g. '{"status":"published"}' */
  where?: string;
  /** Include draft rows in the count (default false) */
  useDraft?: boolean;
  className?: string;
}

export function CmsPaginationContext({
  children,
  databaseId: databaseIdProp = '',
  databaseToken: databaseTokenProp = '',
  table = '',
  pageSize = 10,
  where,
  useDraft = false,
  className,
}: CmsPaginationContextProps) {
  const uid = useId();
  const [currentPage, setCurrentPageRaw] = useState(1);

  // Read credentials from CmsCredentialsProvider (same source as CmsQueryRepeater).
  const ctxDb = useSelector(CMS_DB_CONTEXT_KEY) as {
    databaseId?: string;
    databaseToken?: string;
    host?: string;
  } | undefined;
  const databaseId    = databaseIdProp    || ctxDb?.databaseId    || '';
  const databaseToken = databaseTokenProp || ctxDb?.databaseToken || '';
  const host          = ctxDb?.host ?? 'https://data.plasmic.app';

  const canFetch = !!table && !!databaseId && !!databaseToken;
  const cacheKey = canFetch
    ? JSON.stringify({ op: 'cms-count', databaseId, table, where, useDraft })
    : null;

  const { data: fetchedCount } = usePlasmicQueryData<number>(cacheKey, async () => {
    const api = mkApi({ databaseId, databaseToken, host });
    return api.count(table, {
      where: where ? JSON.parse(where) : undefined,
      useDraft,
    });
  });

  const totalCount = fetchedCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const totalPagesRef = useRef(totalPages);
  totalPagesRef.current = totalPages;

  const setCurrentPage = useCallback((p: number) => {
    setCurrentPageRaw(Math.min(Math.max(1, p), totalPagesRef.current));
  }, []);

  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const offset   = (safePage - 1) * pageSize;
  const hasPrev  = safePage > 1;
  const hasNext  = safePage < totalPages;

  // Write state to module-level store every render so CmsPaginationControls
  // (which lives in a separate React root in Plasmic) can subscribe to it.
  writeStore(uid, { currentPage: safePage, pageSize, totalCount, totalPages, offset, hasPrev, hasNext }, setCurrentPage);

  useEffect(() => () => removeStore(uid), [uid]);

  return (
    // paginationCtxId — lets CmsPaginationControls find the right store entry.
    // paginationCtx   — lets CmsQueryRepeater bind offset/limit via $ctx.paginationCtx.
    <DataProvider name="paginationCtxId" data={uid}>
      <DataProvider
        name="paginationCtx"
        data={{ currentPage: safePage, pageSize, totalCount, totalPages, offset, hasPrev, hasNext }}
      >
        <div className={className}>{children}</div>
      </DataProvider>
    </DataProvider>
  );
}
