import { GroceryLine } from '../../types';
import { buildShoppingList, formatShareText, guessAisle, isAllPickedUp, isInPantry } from '../shoppingList';

const manualKey = (id: string) => `manual__${id}`;
const line = (ingredientId: string, aisle: GroceryLine['aisle'], staple = false, amount = 1): GroceryLine => ({
  key: ingredientId,
  ingredientId,
  name: ingredientId,
  unit: null,
  amount,
  aisle,
  staple,
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
