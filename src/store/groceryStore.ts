import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GroceryState, ManualGroceryItem } from '../types';
import { isRecord, MigrationError, persistOptions } from './persistence';

export const GROCERY_VERSION = 1;

// v0 → v1: no shape change; establishes versioning.
export function migrateGrocery(persisted: unknown, _fromVersion: number): GroceryState {
  if (!isRecord(persisted)) throw new MigrationError('grocery: not an object');
  return {
    checked: isRecord(persisted.checked) ? (persisted.checked as Record<string, boolean>) : {},
    manualItems: Array.isArray(persisted.manualItems) ? (persisted.manualItems as ManualGroceryItem[]) : [],
  };
}

interface GroceryStoreState extends GroceryState {
  toggleCheck: (key: string) => void;
  addManual: (name: string) => void;
  removeManual: (id: string) => void;
  clearChecked: () => void;
}

export const useGroceryStore = create<GroceryStoreState>()(
  persist(
    (set) => ({
      checked: {},
      manualItems: [],
      toggleCheck: (key) =>
        set((state) => ({ checked: { ...state.checked, [key]: !state.checked[key] } })),
      addManual: (name) =>
        set((state) => ({
          manualItems: [
            ...state.manualItems,
            { id: `manual-${Date.now()}`, name, category: 'Pantry & Canned' },
          ],
        })),
      removeManual: (id) =>
        set((state) => ({ manualItems: state.manualItems.filter((m) => m.id !== id) })),
      clearChecked: () => set({ checked: {} }),
    }),
    persistOptions<GroceryStoreState, GroceryState>({
      name: 'mealplan:grocery',
      version: GROCERY_VERSION,
      partialize: ({ checked, manualItems }) => ({ checked, manualItems }),
      migrate: migrateGrocery,
      onHydrated: () => {},
    })
  )
);
