import AsyncStorage from '@react-native-async-storage/async-storage';
import { migrateFavorites, useFavoritesStore } from '../favoritesStore';
import { migrateGrocery, useGroceryStore } from '../groceryStore';
import { MigrationError, useStorageHealth } from '../persistence';
import { migrateHistory } from '../historyStore';
import { migratePlan, usePlanStore } from '../planStore';
import { migratePreferences, usePreferencesStore } from '../preferencesStore';
import { favoritesV0, groceryV0, groceryV1, listPlanV0, planV1, preferencesV0, weeklyPlanV0 } from './fixtures';

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

  it('plan v0 list keeps its entries (no bottled sauces to keep buying in r5)', () => {
    expect(migratePlan(listPlanV0.state, 0).plan.items).toEqual([{ ...listPlanV0.state.plan.items[0], storeBought: [] }]);
  });

  it('plan v1 → v2 keeps buying each entry\'s bottled sauces', () => {
    const items = migratePlan(planV1.state, 1).plan.items;
    expect(items.map((i) => [i.recipeId, i.storeBought])).toEqual([
      ['r8', ['caesar-dressing']],
      ['r22', ['marinara']],
      ['r1', []],
    ]);
  });

  it('plan v2 passes through unchanged', () => {
    const v2 = { plan: { items: [{ id: 'a', recipeId: 'r8', servings: 2, storeBought: [] }] } };
    expect(migratePlan(v2, 2)).toEqual(v2);
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

  it('preferences v1 → v2: mixed → flexitarian, vegetarian stays, adds empty allergies/dislikes', () => {
    expect(migratePreferences({ ...preferencesV0.state, diet: 'mixed' }, 1)).toMatchObject({ diet: 'flexitarian', allergies: [], dislikes: [] });
    expect(migratePreferences(preferencesV0.state, 0).diet).toBe('vegetarian');
    expect(migratePreferences({ diet: 'nonsense' }, 1).diet).toBe('classic');
  });

  it('preferences v2 keeps allergies and dislikes, drops junk entries', () => {
    const p = migratePreferences({ diet: 'keto', allergies: ['peanut', 7], dislikes: ['tofu'] }, 2);
    expect(p).toMatchObject({ diet: 'keto', allergies: ['peanut'], dislikes: ['tofu'] });
  });

  it('preferences fill missing fields with defaults', () => {
    const prefs = migratePreferences({ householdSize: 5 }, 0);
    expect(prefs.householdSize).toBe(5);
    expect(prefs.mealTypes.length).toBeGreaterThan(0);
    expect(prefs.onboardingComplete).toBe(false);
  });

  it('grocery v1 → v2 remaps checked keys to ingredient ids and categories to aisles', () => {
    const grocery = migrateGrocery(groceryV1.state, 1);
    expect(grocery.checked).toEqual({ 'greek-yogurt': true, salt: true, 'manual__manual-9': true });
    expect(grocery.manualItems).toEqual([{ id: 'manual-9', name: 'Dish soap', aisle: 'Other' }]);
    expect(grocery.pantry).toEqual({});
  });

  it('grocery v2 → v3 adds an empty pantry; v3 passes through', () => {
    const v2 = { checked: { garlic: true }, manualItems: [{ id: 'm', name: 'Milk', aisle: 'Dairy & Eggs' }] };
    expect(migrateGrocery(v2, 2)).toEqual({ ...v2, pantry: {} });
    const v3 = { ...v2, pantry: { salt: 'need' } };
    expect(migrateGrocery(v3, 3)).toEqual(v3);
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
    expect(saved.version).toBe(2);
    expect(saved.state.hasHydrated).toBeUndefined();
  });

  it('upgrades a v1 plan to v2 without changing what it buys', async () => {
    await seed('mealplan:plan', planV1);
    await usePlanStore.persist.rehydrate();
    expect(usePlanStore.getState().plan.items[0].storeBought).toEqual(['caesar-dressing']);
    const saved = JSON.parse((await AsyncStorage.getItem('mealplan:plan'))!);
    expect(saved.version).toBe(2);
    expect(saved.state.plan.items[1].storeBought).toEqual(['marinara']);
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
    expect(useGroceryStore.getState().manualItems).toEqual([{ id: 'manual-1', name: 'Paper towels', aisle: 'Other' }]);
    expect(useGroceryStore.getState().checked).toEqual({ garlic: true });
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

describe('history store', () => {

  it('accepts a valid blob and rejects a broken one', () => {
    expect(migrateHistory({ cooked: [] }, 0)).toEqual({ cooked: [] });
    expect(() => migrateHistory({}, 0)).toThrow(MigrationError);
  });
});
