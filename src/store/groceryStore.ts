import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LEGACY_INGREDIENT_NAMES } from '../data/legacyIngredientNames';
import { Aisle, GroceryState, ManualGroceryItem } from '../types';
import { pruneChecked } from '../utils/grocery';
import { isRecord, MigrationError, persistOptions } from './persistence';

export const GROCERY_VERSION = 2;

export const MANUAL_KEY_PREFIX = 'manual__';
export const manualKey = (id: string) => `${MANUAL_KEY_PREFIX}${id}`;
const isManualKey = (key: string) => key.startsWith(MANUAL_KEY_PREFIX);

// Pre-v2 section names → v2 aisles. Every v0/v1 manual item was forced into 'Pantry & Canned'
// regardless of what it was, so that one maps to 'Other' rather than pretending to know.
const LEGACY_CATEGORY_TO_AISLE: Record<string, Aisle> = {
  Produce: 'Produce',
  Protein: 'Meat & Seafood',
  'Dairy & Eggs': 'Dairy & Eggs',
  'Grains & Bread': 'Bakery & Bread',
  'Condiments & Spices': 'Spices & Baking',
  'Pantry & Canned': 'Other',
};

// v0/v1 checked keys were `${ingredientName}__${unit}`; v2 keys are canonical ingredient ids.
function migrateCheckedKeys(checked: Record<string, boolean>): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  Object.entries(checked).forEach(([key, value]) => {
    if (!value) return;
    if (isManualKey(key)) {
      out[key] = true;
      return;
    }
    const id = LEGACY_INGREDIENT_NAMES[key.split('__')[0]];
    if (id) out[id] = true;
  });
  return out;
}

type LegacyManualItem = { id: string; name: string; category?: string; aisle?: Aisle };

// v0 → v1: no shape change. v1 → v2: canonical ingredient keys; manual items get an `aisle`.
export function migrateGrocery(persisted: unknown, fromVersion: number): GroceryState {
  if (!isRecord(persisted)) throw new MigrationError('grocery: not an object');
  const checked = isRecord(persisted.checked) ? (persisted.checked as Record<string, boolean>) : {};
  const manualItems = Array.isArray(persisted.manualItems) ? (persisted.manualItems as LegacyManualItem[]) : [];
  if (fromVersion >= 2) return { checked, manualItems: manualItems as ManualGroceryItem[] };
  return {
    checked: migrateCheckedKeys(checked),
    manualItems: manualItems.map(({ id, name, category }) => ({
      id,
      name,
      aisle: LEGACY_CATEGORY_TO_AISLE[category ?? ''] ?? 'Other',
    })),
  };
}

interface GroceryStoreState extends GroceryState {
  toggleCheck: (key: string) => void;
  addManual: (name: string) => void;
  removeManual: (id: string) => void;
  clearChecked: () => void;
  pruneToPlan: (liveKeys: Set<string>) => void;
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
            { id: `manual-${Date.now()}`, name, aisle: 'Other' },
          ],
        })),
      removeManual: (id) =>
        set((state) => {
          const { [manualKey(id)]: _removed, ...checked } = state.checked;
          return { manualItems: state.manualItems.filter((m) => m.id !== id), checked };
        }),
      clearChecked: () => set({ checked: {} }),
      pruneToPlan: (liveKeys) =>
        set((state) => ({ checked: pruneChecked(state.checked, liveKeys, isManualKey) })),
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
