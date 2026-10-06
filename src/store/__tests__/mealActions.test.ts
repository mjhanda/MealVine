import { cookedAgo } from '../../utils/dates';
import { groceryLinesFromPlan } from '../../utils/grocery';
import { useHistoryStore } from '../historyStore';
import { conflictingPlanItems, cookAgain, markCooked, resetAllData, undoCooked } from '../mealActions';
import { useFavoritesStore } from '../favoritesStore';
import { useGroceryStore } from '../groceryStore';
import { usePreferencesStore } from '../preferencesStore';
import { usePlanStore } from '../planStore';

beforeEach(() => {
  usePlanStore.setState({ plan: { items: [] }, hasHydrated: true });
  useHistoryStore.setState({ cooked: [] });
});

describe('markCooked', () => {
  it('moves the entry from the plan into history, newest first', () => {
    const a = usePlanStore.getState().addItem('r1', 2);
    const b = usePlanStore.getState().addItem('r95', 6);
    markCooked(a, 1000);
    markCooked(b, 2000);
    expect(usePlanStore.getState().plan.items).toEqual([]);
    expect(useHistoryStore.getState().cooked).toEqual([
      { id: b, recipeId: 'r95', servings: 6, cookedAt: 2000 },
      { id: a, recipeId: 'r1', servings: 2, cookedAt: 1000 },
    ]);
  });

  it("removes the meal's ingredients from the grocery list", () => {
    const a = usePlanStore.getState().addItem('r95', 4);
    usePlanStore.getState().addItem('r1', 2);
    markCooked(a);
    const ids = groceryLinesFromPlan(usePlanStore.getState().plan).map((l) => l.ingredientId);
    expect(ids).not.toContain('chicken-breast');
    expect(ids).toContain('greek-yogurt');
  });

  it('is a no-op for an unknown entry', () => {
    expect(markCooked('nope')).toBeUndefined();
    expect(useHistoryStore.getState().cooked).toEqual([]);
  });

  it('undo puts the same entry back and clears it from history', () => {
    const a = usePlanStore.getState().addItem('r1', 3);
    const removed = markCooked(a)!;
    undoCooked(removed);
    expect(usePlanStore.getState().plan.items).toEqual([{ id: a, recipeId: 'r1', servings: 3 }]);
    expect(useHistoryStore.getState().cooked).toEqual([]);
    undoCooked(removed); // double undo doesn't duplicate
    expect(usePlanStore.getState().plan.items).toHaveLength(1);
  });
});

describe('cookAgain', () => {
  it('re-adds with the same servings and returns the new id', () => {
    const id = cookAgain('r95', 6);
    expect(usePlanStore.getState().plan.items).toEqual([{ id, recipeId: 'r95', servings: 6 }]);
  });
});

describe('cookedAgo', () => {
  const day = 24 * 60 * 60 * 1000;
  it.each([
    [0, 'Today'],
    [day, 'Yesterday'],
    [3 * day, '3 days ago'],
    [8 * day, '1 week ago'],
    [15 * day, '2 weeks ago'],
  ])('%i ms → %s', (ago, label) => expect(cookedAgo(100 * day - ago, 100 * day)).toBe(label));
});

describe('conflictingPlanItems / resetAllData', () => {

  it('finds planned meals that break the new preferences', () => {
    const chicken = usePlanStore.getState().addItem('r95', 4);
    usePlanStore.getState().addItem('r1', 2); // parfait: vegetarian, has dairy + honey
    expect(conflictingPlanItems({ diet: 'vegetarian', allergies: [], dislikes: [] }).map((i) => i.id)).toEqual([chicken]);
    expect(conflictingPlanItems({ diet: 'classic', allergies: [], dislikes: [] })).toEqual([]);
    expect(conflictingPlanItems({ diet: 'classic', allergies: ['dairy'], dislikes: [] }).map((i) => i.recipeId)).toEqual(['r1']);
  });
});

describe('resetAllData', () => {
  it('returns every store to a fresh install', () => {
    usePlanStore.getState().addItem('r1', 2);
    markCooked(usePlanStore.getState().addItem('r2', 2));
    useFavoritesStore.setState({ favorites: ['r1'] });
    useGroceryStore.setState({ checked: { eggs: true }, manualItems: [{ id: 'm', name: 'Foil', aisle: 'Household' }], pantry: { salt: 'need' } });
    usePreferencesStore.setState({ onboardingComplete: true, diet: 'vegan', allergies: ['peanut'] });
    resetAllData();
    expect(usePlanStore.getState().plan.items).toEqual([]);
    expect(useHistoryStore.getState().cooked).toEqual([]);
    expect(useFavoritesStore.getState().favorites).toEqual([]);
    expect(useGroceryStore.getState()).toMatchObject({ checked: {}, manualItems: [], pantry: {} });
    expect(usePreferencesStore.getState()).toMatchObject({ onboardingComplete: false, diet: 'classic', allergies: [] });
  });
});
