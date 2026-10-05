import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, PersistOptions } from 'zustand/middleware';

// Non-persisted record of stores whose saved data couldn't be loaded this session,
// so the UI can tell the user once instead of silently starting fresh.
interface StorageHealthState {
  failedStores: string[];
  reportFailure: (name: string) => void;
  dismiss: () => void;
}

export const useStorageHealth = create<StorageHealthState>()((set) => ({
  failedStores: [],
  reportFailure: (name) => set((s) => ({ failedStores: [...s.failedStores, name] })),
  dismiss: () => set({ failedStores: [] }),
}));

export const backupKey = (name: string, timestamp: number) => `${name}:backup:${timestamp}`;

// Copies the raw saved blob aside before anything can overwrite it with defaults.
async function backupRaw(name: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(name);
    if (raw !== null) await AsyncStorage.setItem(backupKey(name, Date.now()), raw);
  } catch (e) {
    console.warn(`[storage] could not back up ${name}`, e);
  }
}

export class MigrationError extends Error {}

export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

interface PersistConfig<S, P> {
  name: string;
  version: number;
  partialize: (state: S) => P;
  // Upgrades a blob saved at `fromVersion` to the current shape. Throw MigrationError on unusable data.
  migrate: (persisted: unknown, fromVersion: number) => P;
  // Called exactly once per launch after hydration finishes, whether or not loading succeeded.
  onHydrated: () => void;
}

export function persistOptions<S, P>(config: PersistConfig<S, P>): PersistOptions<S, P> {
  const { name, version, partialize, migrate, onHydrated } = config;
  return {
    name,
    version,
    storage: createJSONStorage(() => AsyncStorage),
    partialize,
    migrate,
    onRehydrateStorage: () => (_state, error) => {
      if (!error) {
        onHydrated();
        return;
      }
      console.warn(`[storage] failed to load ${name}; starting fresh`, error);
      useStorageHealth.getState().reportFailure(name);
      backupRaw(name).finally(onHydrated);
    },
  };
}
