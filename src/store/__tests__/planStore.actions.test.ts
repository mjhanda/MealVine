import { groceryLinesFromPlan } from '../../utils/grocery';
import { MAX_SERVINGS, MIN_SERVINGS, usePlanStore } from '../planStore';

beforeEach(() => usePlanStore.setState({ plan: { items: [] }, hasHydrated: true }));

describe('updateServings', () => {
  it('changes only the targeted entry', () => {
    usePlanStore.getState().addItem('r2', 2);
    usePlanStore.getState().addItem('r2', 2);
    const [a, b] = usePlanStore.getState().plan.items;
    usePlanStore.getState().updateServings(a.id, 6);
    const items = usePlanStore.getState().plan.items;
    expect(items.find((i) => i.id === a.id)!.servings).toBe(6);
    expect(items.find((i) => i.id === b.id)!.servings).toBe(2);
  });

  it('clamps to the allowed range', () => {
    usePlanStore.getState().addItem('r2', 2);
    const [a] = usePlanStore.getState().plan.items;
    usePlanStore.getState().updateServings(a.id, 0);
    expect(usePlanStore.getState().plan.items[0].servings).toBe(MIN_SERVINGS);
    usePlanStore.getState().updateServings(a.id, 99);
    expect(usePlanStore.getState().plan.items[0].servings).toBe(MAX_SERVINGS);
  });

  it('scales the grocery list (2 → 6 servings triples the onions)', () => {
    usePlanStore.getState().addItem('r95', 4); // 1 yellow onion for 4
    const [a] = usePlanStore.getState().plan.items;
    usePlanStore.getState().updateServings(a.id, 12);
    const onion = groceryLinesFromPlan(usePlanStore.getState().plan).find((l) => l.ingredientId === 'yellow-onion')!;
    expect(onion.amount).toBe(3);
  });
});

describe('replaceRecipe / restoreItem', () => {
  it('swaps the recipe in place, keeping id, position, and servings', () => {
    const a = usePlanStore.getState().addItem('r1', 2);
    const b = usePlanStore.getState().addItem('r2', 5);
    usePlanStore.getState().addItem('r3', 2);
    usePlanStore.getState().replaceRecipe(b, 'r95');
    expect(usePlanStore.getState().plan.items.map((i) => [i.id, i.recipeId, i.servings])).toEqual([
      [a, 'r1', 2],
      [b, 'r95', 5],
      [expect.any(String), 'r3', 2],
    ]);
  });

  it('restoreItem re-adds a removed entry once', () => {
    const a = usePlanStore.getState().addItem('r1', 2);
    const item = usePlanStore.getState().plan.items[0];
    usePlanStore.getState().removeItem(a);
    usePlanStore.getState().restoreItem(item);
    usePlanStore.getState().restoreItem(item);
    expect(usePlanStore.getState().plan.items).toEqual([item]);
  });
});
