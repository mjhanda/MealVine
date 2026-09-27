import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DietPref, MealType, Preferences } from '../types';

interface PreferencesState extends Preferences {
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  completeOnboarding: (prefs: { householdSize: number; diet: DietPref; mealTypes: MealType[] }) => void;
  updatePreferences: (prefs: Partial<Pick<Preferences, 'householdSize' | 'diet' | 'mealTypes'>>) => void;
  resetOnboarding: () => void;
}

const defaults: Preferences = {
  householdSize: 2,
  diet: 'mixed',
  mealTypes: ['breakfast', 'lunch', 'dinner'],
  onboardingComplete: false,
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...defaults,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      completeOnboarding: (prefs) => set({ ...prefs, onboardingComplete: true }),
      updatePreferences: (prefs) => set((state) => ({ ...state, ...prefs })),
      resetOnboarding: () => set({ ...defaults }),
    }),
    {
      name: 'mealplan:preferences',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
