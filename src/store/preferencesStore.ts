import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DietPref, MealType, Preferences } from '../types';
import { isRecord, MigrationError, persistOptions } from './persistence';

const defaults: Preferences = {
  householdSize: 2,
  diet: 'mixed',
  mealTypes: ['breakfast', 'lunch', 'dinner'],
  onboardingComplete: false,
};

export const PREFERENCES_VERSION = 1;

// v0 → v1: no shape change; establishes versioning and fills any missing fields with defaults.
export function migratePreferences(persisted: unknown, _fromVersion: number): Preferences {
  if (!isRecord(persisted)) throw new MigrationError('preferences: not an object');
  return { ...defaults, ...(persisted as Partial<Preferences>) };
}

interface PreferencesState extends Preferences {
  hasHydrated: boolean;
  completeOnboarding: (prefs: { householdSize: number; diet: DietPref; mealTypes: MealType[] }) => void;
  updatePreferences: (prefs: Partial<Pick<Preferences, 'householdSize' | 'diet' | 'mealTypes'>>) => void;
  resetOnboarding: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...defaults,
      hasHydrated: false,
      completeOnboarding: (prefs) => set({ ...prefs, onboardingComplete: true }),
      updatePreferences: (prefs) => set((state) => ({ ...state, ...prefs })),
      resetOnboarding: () => set({ ...defaults }),
    }),
    persistOptions<PreferencesState, Preferences>({
      name: 'mealplan:preferences',
      version: PREFERENCES_VERSION,
      partialize: ({ householdSize, diet, mealTypes, onboardingComplete }) => ({
        householdSize,
        diet,
        mealTypes,
        onboardingComplete,
      }),
      migrate: migratePreferences,
      onHydrated: () => usePreferencesStore.setState({ hasHydrated: true }),
    })
  )
);
