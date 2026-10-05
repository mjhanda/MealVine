import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MealPlan, PlanItem } from '../types';
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

export const PLAN_VERSION = 1;

// v0: either the weekly `{ entries }` grid (v1 app) or the list `{ items }` (v2 app, unversioned).
// v1: `{ items }`, versioned.
export function migratePlan(persisted: unknown, fromVersion: number): PersistedPlan {
  if (!isRecord(persisted)) throw new MigrationError('plan: not an object');
  const plan = persisted.plan;
  if (fromVersion === 0) {
    if (!isRecord(plan)) return { plan: { items: [] } };
    if (Array.isArray(plan.items)) return { plan: { items: plan.items as PlanItem[] } };
    return { plan: { items: migrateLegacyPlan(plan as { entries?: LegacyEntries }) } };
  }
  if (!isRecord(plan) || !Array.isArray(plan.items)) throw new MigrationError('plan: missing items');
  return { plan: { items: plan.items as PlanItem[] } };
}

interface PlanState extends PersistedPlan {
  hasHydrated: boolean;
  addItem: (recipeId: string, servings: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      plan: { items: [] },
      hasHydrated: false,
      addItem: (recipeId, servings) =>
        set((state) => ({
          plan: {
            ...state.plan,
            items: [...state.plan.items, { id: newItemId(), recipeId, servings }],
          },
        })),
      removeItem: (id) =>
        set((state) => ({
          plan: { ...state.plan, items: state.plan.items.filter((item) => item.id !== id) },
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
