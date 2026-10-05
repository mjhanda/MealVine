import AsyncStorage from '@react-native-async-storage/async-storage';
import { migrateFavorites, useFavoritesStore } from '../favoritesStore';
import { migrateGrocery, useGroceryStore } from '../groceryStore';
import { MigrationError, useStorageHealth } from '../persistence';
import { migratePlan, usePlanStore } from '../planStore';
import { migratePreferences, usePreferencesStore } from '../preferencesStore';
import { favoritesV0, groceryV0, listPlanV0, preferencesV0, weeklyPlanV0 } from './fixtures';

afterEach(() => jest.restoreAllMocks());

const seed = (key: string, value: unknown) =>
  AsyncStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));

beforeEach(async () => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  await AsyncStorage.clear();
  useStorageHealth.setState({ failedStores: [] });
});

describe('pure migrations', () => {
  it('plan v0 weekly grid → list', () => {
    const { plan } = migratePlan(weeklyPlanV0.state, 0);
    expect(plan.items.map((i) => i.recipeId)).toEqual(['r1', 'r2', 'r3']);
  });

  it('plan v0 list passes through unchanged', () => {
    expect(migratePlan(listPlanV0.state, 0).plan.items).toEqual(listPlanV0.state.plan.items);
  });

  it('plan v0 with no plan yields empty list', () => {
    expect(migratePlan({}, 0).plan.items).toEqual([]);
  });

  it('rejects non-object blobs', () => {
    expect(() => migratePlan('nope', 0)).toThrow(MigrationError);
    expect(() => migratePreferences(null, 0)).toThrow(MigrationError);
    expect(() => migrateFavorites(42, 0)).toThrow(MigrationError);
    expect(() => migrateGrocery([], 0)).toThrow(MigrationError);
  });

  it('preferences fill missing fields with defaults', () => {
    const prefs = migratePreferences({ householdSize: 5 }, 0);
    expect(prefs.householdSize).toBe(5);
    expect(prefs.mealTypes.length).toBeGreaterThan(0);
    expect(prefs.onboardingComplete).toBe(false);
  });

  it('favorites drop non-string ids', () => {
    expect(migrateFavorites({ favorites: ['r1', 3, null] }, 0).favorites).toEqual(['r1']);
  });
});

describe('rehydration from real storage', () => {
  it('upgrades a v1-app weekly plan and rewrites it at the current version', async () => {
    await seed('mealplan:plan', weeklyPlanV0);
    await usePlanStore.persist.rehydrate();
    const state = usePlanStore.getState();
    expect(state.hasHydrated).toBe(true);
    expect(state.plan.items).toHaveLength(3);
    const saved = JSON.parse((await AsyncStorage.getItem('mealplan:plan'))!);
    expect(saved.version).toBe(1);
    expect(saved.state.hasHydrated).toBeUndefined();
  });

  it('keeps every other store intact across the upgrade', async () => {
    await Promise.all([
      seed('mealplan:preferences', preferencesV0),
      seed('mealplan:grocery', groceryV0),
      seed('mealplan:favorites', favoritesV0),
    ]);
    await Promise.all([
      usePreferencesStore.persist.rehydrate(),
      useGroceryStore.persist.rehydrate(),
      useFavoritesStore.persist.rehydrate(),
    ]);
    expect(usePreferencesStore.getState()).toMatchObject({ householdSize: 4, diet: 'vegetarian', onboardingComplete: true });
    expect(useGroceryStore.getState().manualItems).toHaveLength(1);
    expect(useGroceryStore.getState().checked).toEqual({ Garlic__clove: true });
    expect(useFavoritesStore.getState().favorites).toEqual(['r1', 'r7']);
  });

  it('a corrupt blob still finishes hydrating, reports, and backs up the raw data', async () => {
    usePlanStore.setState({ hasHydrated: false });
    await seed('mealplan:plan', '{not json');
    await usePlanStore.persist.rehydrate();
    // backup + onHydrated run after an async getItem/setItem pair
    await new Promise((r) => setTimeout(r, 0));
    expect(usePlanStore.getState().hasHydrated).toBe(true);
    expect(useStorageHealth.getState().failedStores).toContain('mealplan:plan');
    const keys = await AsyncStorage.getAllKeys();
    const backup = keys.find((k) => k.startsWith('mealplan:plan:backup:'));
    expect(backup).toBeDefined();
    expect(await AsyncStorage.getItem(backup!)).toBe('{not json');
  });

  it('a structurally invalid blob is treated the same as a corrupt one', async () => {
    usePlanStore.setState({ hasHydrated: false });
    await seed('mealplan:plan', { state: 'garbage', version: 0 });
    await usePlanStore.persist.rehydrate();
    await new Promise((r) => setTimeout(r, 0));
    expect(usePlanStore.getState().hasHydrated).toBe(true);
    expect(useStorageHealth.getState().failedStores).toContain('mealplan:plan');
  });
});
