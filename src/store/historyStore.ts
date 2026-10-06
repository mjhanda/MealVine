import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CookedEntry } from '../types';
import { isRecord, MigrationError, persistOptions } from './persistence';

// Oldest entries drop off past this; plenty for "recently cooked" and future ratings/notes.
export const HISTORY_LIMIT = 500;

interface PersistedHistory {
  cooked: CookedEntry[]; // newest first
}

export const HISTORY_VERSION = 1;

export function migrateHistory(persisted: unknown, _fromVersion: number): PersistedHistory {
  if (!isRecord(persisted) || !Array.isArray(persisted.cooked)) throw new MigrationError('history: missing cooked');
  return { cooked: persisted.cooked as CookedEntry[] };
}

interface HistoryState extends PersistedHistory {
  record: (entry: CookedEntry) => void;
  remove: (id: string) => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      cooked: [],
      record: (entry) => set((state) => ({ cooked: [entry, ...state.cooked].slice(0, HISTORY_LIMIT) })),
      remove: (id) => set((state) => ({ cooked: state.cooked.filter((e) => e.id !== id) })),
    }),
    persistOptions<HistoryState, PersistedHistory>({
      name: 'mealplan:history',
      version: HISTORY_VERSION,
      partialize: ({ cooked }) => ({ cooked }),
      migrate: migrateHistory,
      onHydrated: () => {},
    })
  )
);
