import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { AllergenTag, DietId, Preferences } from '../types';
import { DIET_ORDER, EatingPrefs } from '../utils/diets';
import { isRecord, MigrationError, persistOptions } from './persistence';

export const DEFAULT_PREFERENCES: Preferences = {
  householdSize: 2,
  diet: 'classic',
  allergies: [],
  dislikes: [],
  mealTypes: ['breakfast', 'lunch', 'dinner'],
  onboardingComplete: false,
};

export const PREFERENCES_VERSION = 2;

// v1 diet values → v2 diet ids. 'mixed' was "vegetarian + chicken/turkey/fish, no pork",
// which is exactly flexitarian.
const LEGACY_DIET: Record<string, DietId> = { vegetarian: 'vegetarian', mixed: 'flexitarian' };

const toDiet = (value: unknown): DietId => {
  if (typeof value !== 'string') return DEFAULT_PREFERENCES.diet;
  if ((DIET_ORDER as string[]).includes(value)) return value as DietId;
  return LEGACY_DIET[value] ?? DEFAULT_PREFERENCES.diet;
};

const stringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];

// v0 → v1: no shape change. v1 → v2: diet ids widen to eight diets; adds allergies and dislikes.
export function migratePreferences(persisted: unknown, _fromVersion: number): Preferences {
  if (!isRecord(persisted)) throw new MigrationError('preferences: not an object');
  const merged = { ...DEFAULT_PREFERENCES, ...(persisted as Partial<Preferences>) };
  return {
    ...merged,
    diet: toDiet(persisted.diet),
    allergies: stringArray(persisted.allergies) as AllergenTag[],
    dislikes: stringArray(persisted.dislikes),
  };
}

type EditablePrefs = Omit<Preferences, 'onboardingComplete'>;

interface PreferencesState extends Preferences {
  hasHydrated: boolean;
  completeOnboarding: (prefs: EditablePrefs) => void;
  updatePreferences: (prefs: Partial<EditablePrefs>) => void;
  resetOnboarding: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFERENCES,
      hasHydrated: false,
      completeOnboarding: (prefs) => set({ ...prefs, onboardingComplete: true }),
      updatePreferences: (prefs) => set(prefs),
      resetOnboarding: () => set({ ...DEFAULT_PREFERENCES }),
    }),
    persistOptions<PreferencesState, Preferences>({
      name: 'mealplan:preferences',
      version: PREFERENCES_VERSION,
      partialize: ({ householdSize, diet, allergies, dislikes, mealTypes, onboardingComplete }) => ({
        householdSize,
        diet,
        allergies,
        dislikes,
        mealTypes,
        onboardingComplete,
      }),
      migrate: migratePreferences,
      onHydrated: () => usePreferencesStore.setState({ hasHydrated: true }),
    })
  )
);

// The three fields that decide which recipes a user can see (shallow-compared, so it's render-stable).
export const useEatingPrefs = (): EatingPrefs =>
  usePreferencesStore(useShallow((s) => ({ diet: s.diet, allergies: s.allergies, dislikes: s.dislikes })));
