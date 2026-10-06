import { AppData, buildBackup, mergeData, Migrators, ParseResult, parseBackup, replaceData, Snapshot, StoreName } from '../utils/backup';
import { migrateFavorites, useFavoritesStore } from './favoritesStore';
import { migrateGrocery, useGroceryStore } from './groceryStore';
import { migrateHistory, useHistoryStore } from './historyStore';
import { migratePlan, usePlanStore } from './planStore';
import { DEFAULT_PREFERENCES, migratePreferences, usePreferencesStore } from './preferencesStore';
import { migrateNotes, useRecipeNotesStore } from './recipeNotesStore';

const MIGRATORS: Migrators = {
  preferences: migratePreferences,
  plan: migratePlan,
  history: migrateHistory,
  favorites: migrateFavorites,
  grocery: migrateGrocery,
  notes: migrateNotes,
};

// The persisted stores that make up a backup. Each one's own persist options supply the
// version and the partialize function, so a backup holds exactly what's on disk.
const STORES = {
  preferences: usePreferencesStore,
  plan: usePlanStore,
  history: useHistoryStore,
  favorites: useFavoritesStore,
  grocery: useGroceryStore,
  notes: useRecipeNotesStore,
} as const;

type AnyPersistedStore = {
  getState: () => unknown;
  setState: (partial: object) => void;
  persist: { getOptions: () => { version?: number; partialize?: (s: never) => unknown } };
};

const entries = () => Object.entries(STORES) as [StoreName, AnyPersistedStore][];

const snapshot = (store: AnyPersistedStore): Snapshot => {
  const { version = 0, partialize } = store.persist.getOptions();
  const state = store.getState();
  return { version, state: partialize ? partialize(state as never) : state };
};

export const currentVersions = (): Record<StoreName, number> =>
  Object.fromEntries(entries().map(([name, store]) => [name, store.persist.getOptions().version ?? 0])) as Record<
    StoreName,
    number
  >;

export function exportBackupJson(now?: Date): string {
  const stores = Object.fromEntries(entries().map(([name, store]) => [name, snapshot(store)])) as Record<StoreName, Snapshot>;
  return JSON.stringify(buildBackup(stores, now), null, 2);
}

export const readBackup = (text: string): ParseResult => parseBackup(text, currentVersions(), MIGRATORS);

const currentData = (): AppData =>
  Object.fromEntries(entries().map(([name, store]) => [name, snapshot(store).state])) as unknown as AppData;

const EMPTY: AppData = {
  preferences: { ...DEFAULT_PREFERENCES },
  plan: { plan: { items: [] } },
  history: { cooked: [] },
  favorites: { favorites: [] },
  grocery: { checked: {}, manualItems: [], pantry: {} },
  notes: { notes: {}, ratings: {} },
};

export function applyBackup(incoming: Partial<AppData>, mode: 'merge' | 'replace'): void {
  const next = mode === 'merge' ? mergeData(currentData(), incoming) : replaceData(EMPTY, incoming);
  entries().forEach(([name, store]) => store.setState(next[name] as object));
}
