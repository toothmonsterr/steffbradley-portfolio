import { useSyncExternalStore } from 'react';

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  offset: number;
  hasPrev: boolean;
  hasNext: boolean;
}

type Listener = () => void;

interface Entry {
  state: PaginationState;
  setter: (page: number) => void;
  listeners: Set<Listener>;
}

// Module-level store — survives across Plasmic's component tree boundaries.
const store = new Map<string, Entry>();

export function writeStore(id: string, state: PaginationState, setter: (page: number) => void) {
  const existing = store.get(id);
  if (existing) {
    existing.state = state;
    existing.setter = setter;
    existing.listeners.forEach(l => l());
  } else {
    store.set(id, { state, setter, listeners: new Set() });
  }
}

export function removeStore(id: string) {
  store.delete(id);
}

export function usePaginationStore(id: string | undefined) {
  return useSyncExternalStore(
    (cb) => {
      if (!id) return () => {};
      const entry = store.get(id);
      if (!entry) return () => {};
      entry.listeners.add(cb);
      return () => entry.listeners.delete(cb);
    },
    () => id ? store.get(id) ?? null : null,
    () => id ? store.get(id) ?? null : null,
  );
}
