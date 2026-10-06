import { CookedEntry, GroceryState, MealPlan, Preferences } from '../types';

// A backup is each store's persisted state plus the version it was saved at, so importing an
// old backup runs the exact same migrations as upgrading the app does.

export const BACKUP_FORMAT = 'mealapp-backup';
export const BACKUP_VERSION = 1;

export interface AppData {
  preferences: Preferences;
  plan: { plan: MealPlan };
  history: { cooked: CookedEntry[] };
  favorites: { favorites: string[] };
  grocery: GroceryState;
  notes: { notes: Record<string, string>; ratings: Record<string, 'up' | 'down'> };
}

export type StoreName = keyof AppData;

export interface Snapshot {
  version: number;
  state: unknown;
}

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  backupVersion: number;
  exportedAt: string;
  stores: Partial<Record<StoreName, Snapshot>>;
}

// Each store's own migrate function (supplied by the store layer, keeping this module pure).
export type Migrators = { [K in StoreName]: (state: unknown, version: number) => AppData[K] };

export const STORE_NAMES: StoreName[] = ['preferences', 'plan', 'history', 'favorites', 'grocery', 'notes'];

export function buildBackup(stores: Record<StoreName, Snapshot>, now: Date = new Date()): BackupFile {
  return { format: BACKUP_FORMAT, backupVersion: BACKUP_VERSION, exportedAt: now.toISOString(), stores };
}

export type ParseResult = { ok: true; data: Partial<AppData>; exportedAt: string } | { ok: false; error: string };

// Validates and upgrades a backup. Never partially succeeds: any bad store fails the whole import.
export function parseBackup(text: string, currentVersions: Record<StoreName, number>, migrators: Migrators): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "This file isn't a MealApp backup (it's not valid JSON)." };
  }
  const file = raw as Partial<BackupFile>;
  if (!file || file.format !== BACKUP_FORMAT || typeof file.stores !== 'object' || file.stores === null) {
    return { ok: false, error: "This file isn't a MealApp backup." };
  }
  if ((file.backupVersion ?? 0) > BACKUP_VERSION) {
    return { ok: false, error: 'This backup was made by a newer version of MealApp. Update the app, then try again.' };
  }
  const data: Partial<AppData> = {};
  for (const name of STORE_NAMES) {
    const snap = file.stores[name];
    if (!snap) continue;
    if (typeof snap.version !== 'number' || snap.version > currentVersions[name]) {
      return { ok: false, error: `The ${name} section was made by a newer version of MealApp.` };
    }
    try {
      (data as Record<StoreName, unknown>)[name] = migrators[name](snap.state, snap.version);
    } catch {
      return { ok: false, error: `The ${name} section of this backup is damaged.` };
    }
  }
  return { ok: true, data, exportedAt: typeof file.exportedAt === 'string' ? file.exportedAt : '' };
}

const unionBy = <T,>(a: T[], b: T[], key: (x: T) => string): T[] => {
  const seen = new Set(a.map(key));
  return [...a, ...b.filter((x) => !seen.has(key(x)))];
};

// Merge keeps everything the user has now and adds what the backup has on top. Current
// preferences win (they're the user's present choice); notes/ratings already set locally win.
export function mergeData(current: AppData, incoming: Partial<AppData>): AppData {
  return {
    preferences: current.preferences,
    plan: { plan: { items: unionBy(current.plan.plan.items, incoming.plan?.plan.items ?? [], (i) => i.id) } },
    history: {
      cooked: unionBy(current.history.cooked, incoming.history?.cooked ?? [], (e) => e.id).sort((a, b) => b.cookedAt - a.cookedAt),
    },
    favorites: { favorites: unionBy(current.favorites.favorites, incoming.favorites?.favorites ?? [], (id) => id) },
    grocery: {
      checked: current.grocery.checked,
      manualItems: unionBy(current.grocery.manualItems, incoming.grocery?.manualItems ?? [], (m) => m.id),
      pantry: { ...(incoming.grocery?.pantry ?? {}), ...current.grocery.pantry },
    },
    notes: {
      notes: { ...(incoming.notes?.notes ?? {}), ...current.notes.notes },
      ratings: { ...(incoming.notes?.ratings ?? {}), ...current.notes.ratings },
    },
  };
}

// Replace takes the backup wholesale; stores missing from an older backup fall back to `empty`.
export function replaceData(empty: AppData, incoming: Partial<AppData>): AppData {
  return { ...empty, ...incoming };
}
