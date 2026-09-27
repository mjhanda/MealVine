import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Day, DietPref, MealPlan, MealType } from '../types';
import { generatePlan, setMealInPlan, swapMeal } from '../utils/planGenerator';

interface PlanState {
  plan: MealPlan | null;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  regenerate: (mealTypes: MealType[], diet: DietPref) => void;
  swap: (day: Day, mealType: MealType, diet: DietPref) => void;
  setMeal: (day: Day, mealType: MealType, recipeId: string) => void;
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      plan: null,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      regenerate: (mealTypes, diet) => set({ plan: generatePlan(mealTypes, diet) }),
      swap: (day, mealType, diet) => {
        const current = get().plan;
        if (!current) return;
        set({ plan: swapMeal(current, day, mealType, diet) });
      },
      setMeal: (day, mealType, recipeId) => {
        const current = get().plan;
        if (!current) return;
        set({ plan: setMealInPlan(current, day, mealType, recipeId) });
      },
    }),
    {
      name: 'mealplan:plan',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
