import { GroceryLine, GroceryUse, Unit } from '../../types';
import { recipeById } from '../recipeCatalog';
import {
  buildShoppingList,
  formatShareText,
  guessAisle,
  isAllPickedUp,
  isInPantry,
  mealName,
  mealsSpoken,
  mealSummary,
  mealUses,
  rowAccessibilityLabel,
} from '../shoppingList';

const manualKey = (id: string) => `manual__${id}`;
const line = (ingredientId: string, aisle: GroceryLine['aisle'], staple = false, amount = 1): GroceryLine => ({
  key: ingredientId,
  ingredientId,
  name: ingredientId,
  unit: null,
  amount,
  aisle,
  staple,
  uses: [],
});

const lines = [line('carrot', 'Produce'), line('olive-oil', 'Oils & Condiments', true), line('salt', 'Spices & Baking', true), line('eggs', 'Dairy & Eggs', false, 6)];

describe('isInPantry', () => {
  it('uses the staple default unless overridden', () => {
    expect(isInPantry(line('salt', 'Spices & Baking', true), {})).toBe(true);
    expect(isInPantry(line('salt', 'Spices & Baking', true), { salt: 'need' })).toBe(false);
    expect(isInPantry(line('carrot', 'Produce'), { carrot: 'have' })).toBe(true);
    expect(isInPantry(line('carrot', 'Produce'), {})).toBe(false);
  });
});

describe('buildShoppingList', () => {
  const build = (over: Partial<Parameters<typeof buildShoppingList>[0]> = {}) =>
    buildShoppingList({ lines, manualItems: [], checked: {}, pantry: {}, manualKey, ...over });

  it('moves staples into the pantry section and out of the counts', () => {
    const list = build();
    expect(list.pantry.map((r) => r.ingredientId)).toEqual(['olive-oil', 'salt']);
    expect(list.total).toBe(2);
    expect(list.sections.map((s) => s.aisle)).toEqual(['Produce', 'Dairy & Eggs']);
  });

  it('respects "need" and "have" overrides', () => {
    const list = build({ pantry: { salt: 'need', carrot: 'have' } });
    expect(list.pantry.map((r) => r.ingredientId).sort()).toEqual(['carrot', 'olive-oil']);
    expect(list.sections.flatMap((s) => s.rows.map((r) => r.ingredientId ?? r.manualId))).toEqual(['eggs', 'salt']);
  });

  it('merges manual items into their aisle and counts checks', () => {
    const list = build({
      manualItems: [{ id: 'm1', name: 'Paper towels', aisle: 'Household' }, { id: 'm2', name: 'Oat milk', aisle: 'Dairy & Eggs' }],
      checked: { eggs: true, manual__m1: true },
    });
    expect(list.total).toBe(4);
    expect(list.checkedCount).toBe(2);
    const dairy = list.sections.find((s) => s.aisle === 'Dairy & Eggs')!;
    expect(dairy.rows.map((r) => r.name)).toEqual(['Oat milk', 'eggs']); // checked sinks
    expect(dairy.rows[0].quantity).toBeNull();
  });
});

describe('formatShareText', () => {
  it('lists unchecked items by aisle with quantities, skipping empty aisles', () => {
    const list = buildShoppingList({
      lines,
      manualItems: [{ id: 'm1', name: 'Foil', aisle: 'Household' }],
      checked: { carrot: true },
      pantry: {},
      manualKey,
    });
    expect(formatShareText(list)).toBe('Grocery list\n\nDAIRY & EGGS\n- eggs (6)\n\nHOUSEHOLD\n- Foil');
  });
});

describe('guessAisle', () => {
  it.each([
    ['Milk', 'Dairy & Eggs'],
    ['oat milk', 'Dairy & Eggs'],
    ['Feta cheese', 'Dairy & Eggs'],
    ['Dish soap', 'Household'],
    ['paper towels', 'Household'],
    ['Coffee', 'Beverages'],
    ['ice cream', 'Frozen'],
    ['sourdough bread', 'Bakery & Bread'],
    ['Avocado', 'Produce'],
    ['Avocados', 'Produce'],
    ['chickpeas', 'Canned & Jarred'],
    ['ground beef', 'Meat & Seafood'],
    ['tortilla chips', 'Bakery & Bread'],
    ['birthday candles', 'Other'],
    ['', 'Other'],
  ])('%p → %p', (name, aisle) => expect(guessAisle(name)).toBe(aisle));
});

describe('isAllPickedUp', () => {
  it('is true only when every counted item is checked', () => {
    expect(isAllPickedUp({ total: 3, checkedCount: 3 })).toBe(true);
    expect(isAllPickedUp({ total: 3, checkedCount: 2 })).toBe(false);
  });

  it('is false for an empty list', () => {
    expect(isAllPickedUp({ total: 0, checkedCount: 0 })).toBe(false);
  });
});

describe('meals each item is for', () => {
  const r1 = recipeById('r1')!;
  const r2 = recipeById('r2')!;
  const r8 = recipeById('r8')!;
  const use = (planItemId: string, recipeId: string, amount: number, unit: Unit | null = 'tbsp'): GroceryUse => ({ planItemId, recipeId, amount, unit });

  it('combines entries of the same recipe ("×2") with the summed amount, keeping plan order', () => {
    const meals = mealUses([use('a', 'r1', 2), use('b', 'r2', 1), use('c', 'r1', 2)]);
    expect(meals).toEqual([
      { recipeId: 'r1', planItemId: 'a', title: r1.title, count: 2, quantity: '¼ cup' },
      { recipeId: 'r2', planItemId: 'b', title: r2.title, count: 1, quantity: '1 tbsp' },
    ]);
    expect(mealName(meals[0])).toBe(`${r1.title} ×2`);
  });

  it('formats counts and unknown recipes', () => {
    expect(mealUses([use('a', 'gone', 3, null)])).toEqual([{ recipeId: 'gone', planItemId: 'a', title: 'Removed recipe', count: 1, quantity: '3' }]);
  });

  it('summarizes up to two meal names, then "+ N more"', () => {
    const meals = mealUses([use('a', 'r1', 1), use('b', 'r2', 1), use('c', 'r8', 1)]);
    expect(mealSummary(meals.slice(0, 1))).toBe(r1.title);
    expect(mealSummary(meals.slice(0, 2))).toBe(`${r1.title}, ${r2.title}`);
    expect(mealSummary(meals)).toBe(`${r1.title}, ${r2.title} + 1 more`);
  });

  it('reads the meals out in the accessibility label', () => {
    const meals = mealUses([use('a', 'r1', 1), use('b', 'r2', 1), use('c', 'r8', 1)]);
    expect(rowAccessibilityLabel({ name: 'Garlic', quantity: '5 cloves', meals: meals.slice(0, 2) })).toBe(
      `Garlic, 5 cloves, for ${r1.title} and ${r2.title}`
    );
    expect(mealsSpoken(meals)).toBe(`${r1.title}, ${r2.title}, and ${r8.title}`);
    expect(rowAccessibilityLabel({ name: 'Foil', quantity: null, meals: [] })).toBe('Foil');
  });

  it('puts meals on recipe rows (pantry included) and none on manual rows', () => {
    const withUses = [{ ...line('carrot', 'Produce'), uses: [use('a', 'r2', 1, null)] }, { ...line('salt', 'Spices & Baking', true), uses: [use('a', 'r2', 1, 'tsp')] }];
    const list = buildShoppingList({ lines: withUses, manualItems: [{ id: 'm1', name: 'Foil', aisle: 'Household' }], checked: { carrot: true }, pantry: {}, manualKey });
    const rows = list.sections.flatMap((s) => s.rows);
    expect(rows.find((r) => r.ingredientId === 'carrot')!.meals.map((m) => m.recipeId)).toEqual(['r2']);
    expect(rows.find((r) => r.manualId === 'm1')!.meals).toEqual([]);
    expect(list.pantry[0].meals.map((m) => m.quantity)).toEqual(['1 tsp']);
  });
});
