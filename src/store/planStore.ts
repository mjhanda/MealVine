import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MealPlan, PlanItem } from '../types';
import { bottledSauceIds } from '../utils/homemade';
import { recipeById } from '../utils/recipeCatalog';
import { isRecord, MigrationError, persistOptions } from './persistence';

let itemCounter = 0;

export const newItemId = () => `item-${Date.now()}-${itemCounter++}`;

// Legacy weekly-plan shape: Record<Day, Partial<Record<MealType, string>>>
type LegacyEntries = Record<string, Record<string, string | undefined> | undefined>;

export function migrateLegacyPlan(plan: { entries?: LegacyEntries } | null): PlanItem[] {
  if (!plan?.entries) return [];
  const items: PlanItem[] = [];
  Object.values(plan.entries).forEach((dayEntries) => {
    if (!dayEntries) return;
    Object.values(dayEntries).forEach((recipeId) => {
      if (!recipeId) return;
      const recipe = recipeById(recipeId);
      items.push({ id: newItemId(), recipeId, servings: recipe?.servings ?? 2 });
    });
  });
  return items;
}

interface PersistedPlan {
  plan: MealPlan;
}

export const PLAN_VERSION = 2;

// Entries from before make-it-yourself sauces keep buying them, so an update doesn't change
// anyone's grocery list.
const keepBuyingSauces = (items: PlanItem[]): PlanItem[] =>
  items.map((item) => (item.storeBought ? item : { ...item, storeBought: bottledSauceIds(recipeById(item.recipeId)) }));

function itemsBeforeV2(plan: unknown, fromVersion: number): PlanItem[] {
  if (fromVersion === 0) {
    if (!isRecord(plan)) return [];
    if (Array.isArray(plan.items)) return plan.items as PlanItem[];
    return migrateLegacyPlan(plan as { entries?: LegacyEntries });
  }
  if (!isRecord(plan) || !Array.isArray(plan.items)) throw new MigrationError('plan: missing items');
  return plan.items as PlanItem[];
}

// v0: either the weekly `{ entries }` grid (v1 app) or the list `{ items }` (v2 app, unversioned).
// v1: `{ items }`, versioned.
// v2: items may carry `storeBought`; v0/v1 items get their recipe's bottled sauces there.
export function migratePlan(persisted: unknown, fromVersion: number): PersistedPlan {
  if (!isRecord(persisted)) throw new MigrationError('plan: not an object');
  const items = itemsBeforeV2(persisted.plan, fromVersion);
  return { plan: { items: fromVersion < 2 ? keepBuyingSauces(items) : items } };
}

interface PlanState extends PersistedPlan {
  hasHydrated: boolean;
  // Returns the new entry's id. `storeBought`: bottled sauces to buy rather than make (default: make all).
  addItem: (recipeId: string, servings: number, storeBought?: string[]) => string;
  removeItem: (id: string) => void;
  // Puts a previously removed entry back (undo); no-op if an entry with that id exists.
  restoreItem: (item: PlanItem) => void;
  updateServings: (id: string, servings: number) => void;
  // Make a bottled sauce from scratch (buy = false) or buy it (buy = true) for one entry.
  setStoreBought: (id: string, ingredientId: string, buy: boolean) => void;
  // Swaps the recipe of an entry in place (same id, position, and servings).
  replaceRecipe: (id: string, recipeId: string) => void;
  clear: () => void;
}

export const MIN_SERVINGS = 1;
export const MAX_SERVINGS = 12;
const clampServings = (n: number) => Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, Math.round(n)));

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      plan: { items: [] },
      hasHydrated: false,
      addItem: (recipeId, servings, storeBought = []) => {
        const id = newItemId();
        set((state) => ({
          plan: { ...state.plan, items: [...state.plan.items, { id, recipeId, servings, storeBought }] },
        }));
        return id;
      },
      removeItem: (id) =>
        set((state) => ({
          plan: { ...state.plan, items: state.plan.items.filter((item) => item.id !== id) },
        })),
      restoreItem: (item) =>
        set((state) =>
          state.plan.items.some((i) => i.id === item.id)
            ? state
            : { plan: { ...state.plan, items: [...state.plan.items, item] } }
        ),
      updateServings: (id, servings) =>
        set((state) => ({
          plan: {
            ...state.plan,
            items: state.plan.items.map((item) =>
              item.id === id ? { ...item, servings: clampServings(servings) } : item
            ),
          },
        })),
      setStoreBought: (id, ingredientId, buy) =>
        set((state) => ({
          plan: {
            ...state.plan,
            items: state.plan.items.map((item) => {
              if (item.id !== id) return item;
              const others = (item.storeBought ?? []).filter((x) => x !== ingredientId);
              return { ...item, storeBought: buy ? [...others, ingredientId] : others };
            }),
          },
        })),
      // A swapped-in recipe has its own sauces, so the make/buy choices start over.
      replaceRecipe: (id, recipeId) =>
        set((state) => ({
          plan: {
            ...state.plan,
            items: state.plan.items.map((item) => (item.id === id ? { ...item, recipeId, storeBought: [] } : item)),
          },
        })),
      clear: () => set({ plan: { items: [] } }),
    }),
    persistOptions<PlanState, PersistedPlan>({
      name: 'mealplan:plan',
      version: PLAN_VERSION,
      partialize: ({ plan }) => ({ plan }),
      migrate: migratePlan,
      onHydrated: () => usePlanStore.setState({ hasHydrated: true }),
    })
  )
);
