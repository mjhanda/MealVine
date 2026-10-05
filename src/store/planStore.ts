import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MealPlan, PlanItem } from '../types';
import { recipeById } from '../utils/recipeCatalog';

let itemCounter = 0;

const newItemId = () => `item-${Date.now()}-${itemCounter++}`;

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

interface PlanState {
  plan: MealPlan;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  addItem: (recipeId: string, servings: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      plan: { items: [] },
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
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
    {
      name: 'mealplan:plan',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!state.plan) {
          state.plan = { items: [] };
        } else if (!state.plan.items) {
          state.plan = { items: migrateLegacyPlan(state.plan as { entries?: LegacyEntries }) };
        }
        state.setHasHydrated(true);
      },
    }
  )
);
