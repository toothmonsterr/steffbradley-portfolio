import { useSyncExternalStore } from 'react';
import type { ContactErrors, ContactValues, Field } from '@/lib/contact/validation';

export type ContactStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface ContactFormState {
  values: ContactValues;
  errors: ContactErrors;
  status: ContactStatus;
  errorMessage: string;
  /** Stable id prefix so fields can build unique input/error element ids. */
  domId: string;
}

export interface ContactFormActions {
  setField: (field: Field, value: string) => void;
  blurField: (field: Field) => void;
  registerInput: (field: Field, el: HTMLElement | null) => void;
}

type Listener = () => void;

interface Entry {
  state: ContactFormState;
  actions: ContactFormActions;
  listeners: Set<Listener>;
}

// Module-level store — survives across Plasmic's component tree boundaries.
// Slot content renders in a separate React root, so ordinary context does not
// reach it; this is the same pattern used by CmsPagination.
const store = new Map<string, Entry>();

export function writeStore(id: string, state: ContactFormState, actions: ContactFormActions) {
  const existing = store.get(id);
  if (existing) {
    existing.state = state;
    existing.actions = actions;
    existing.listeners.forEach((l) => l());
  } else {
    store.set(id, { state, actions, listeners: new Set() });
  }
}

export function removeStore(id: string) {
  store.delete(id);
}

export function useContactStore(id: string | undefined) {
  return useSyncExternalStore(
    (cb) => {
      if (!id) return () => {};
      const entry = store.get(id);
      if (!entry) return () => {};
      entry.listeners.add(cb);
      return () => entry.listeners.delete(cb);
    },
    () => (id ? store.get(id) ?? null : null),
    () => (id ? store.get(id) ?? null : null),
  );
}
