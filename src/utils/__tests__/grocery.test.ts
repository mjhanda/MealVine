import { RECIPES } from '../../data/recipes';
import { aisleOrder } from '../../theme';
import { groceryItemsFromPlan, groceryLinesFromPlan, pruneChecked, sortForShopping } from '../grocery';
import { recipeById } from '../recipeCatalog';

const planOf = (...entries: [string, number][]) => ({
  items: entries.map(([recipeId, servings], i) => ({ id: `i${i}`, recipeId, servings })),
});
const line = (plan: ReturnType<typeof planOf>, ingredientId: string) =>
  groceryLinesFromPlan(plan).find((l) => l.ingredientId === ingredientId);

describe('groceryLinesFromPlan', () => {
  it('is empty for an empty plan', () => {
    expect(groceryLinesFromPlan({ items: [] })).toEqual([]);
  });

  it('scales each entry by its own servings', () => {
    const r1 = recipeById('r1')!; // 2 cups greek yogurt for 2 servings
    expect(line(planOf(['r1', r1.servings * 2]), 'greek-yogurt')).toMatchObject({ amount: 4, unit: 'cup' });
  });

  it('merges the same ingredient across entries into one line', () => {
    const lines = groceryLinesFromPlan(planOf(['r1', 2], ['r1', 2])).filter((l) => l.ingredientId === 'greek-yogurt');
    expect(lines).toHaveLength(1);
    expect(lines[0].amount).toBeCloseTo(4);
  });

  it('converts across units in the same family (cup + tbsp → cups)', () => {
    const cupRecipe = RECIPES.find((r) => r.ingredients.some((i) => i.id === 'greek-yogurt' && i.unit === 'cup'))!;
    const tbspRecipe = RECIPES.find((r) => r.ingredients.some((i) => i.id === 'greek-yogurt' && i.unit === 'tbsp'))!;
    const cups = cupRecipe.ingredients.find((i) => i.id === 'greek-yogurt')!.amount;
    const tbsp = tbspRecipe.ingredients.find((i) => i.id === 'greek-yogurt')!.amount;
    const merged = line(planOf([cupRecipe.id, cupRecipe.servings], [tbspRecipe.id, tbspRecipe.servings]), 'greek-yogurt')!;
    expect(merged.unit).toBe('cup');
    expect(merged.amount).toBeCloseTo(cups + tbsp / 16);
  });

  it('uses the plural name for counts above one', () => {
    expect(line(planOf(['r2', 4]), 'bell-pepper')).toMatchObject({ name: 'Bell peppers', amount: 2 });
  });

  it('skips unknown recipe ids', () => {
    expect(groceryLinesFromPlan(planOf(['gone', 2]))).toEqual([]);
  });

  it('never produces two lines for the same food across the whole catalog', () => {
    const lines = groceryLinesFromPlan(planOf(...RECIPES.map((r) => [r.id, r.servings] as [string, number])));
    const names = lines.map((l) => l.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
    expect(new Set(lines.map((l) => l.key)).size).toBe(lines.length);
  });
});

describe('groceryItemsFromPlan', () => {
  it('groups by aisle, every aisle present, sorted by name', () => {
    const grouped = groceryItemsFromPlan(planOf(['r2', 2], ['r1', 2]));
    expect(Object.keys(grouped)).toEqual(aisleOrder);
    Object.values(grouped).forEach((lines) => {
      const names = lines.map((l) => l.name);
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    });
    expect(grouped['Dairy & Eggs'].map((l) => l.ingredientId)).toEqual(expect.arrayContaining(['eggs', 'greek-yogurt']));
  });
});

describe('pruneChecked / sortForShopping', () => {

  it('keeps live and manual keys, drops the rest and false values', () => {
    const out = pruneChecked({ eggs: true, garlic: true, salt: false, manual__1: true }, new Set(['eggs', 'salt']), (k) => k.startsWith('manual__'));
    expect(out).toEqual({ eggs: true, manual__1: true });
  });
  it('puts checked items last, alphabetical within each group', () => {
    const lines = [{ key: 'a', name: 'Apple' }, { key: 'b', name: 'Banana' }, { key: 'c', name: 'Cherry' }];
    expect(sortForShopping(lines, { a: true }).map((l) => l.key)).toEqual(['b', 'c', 'a']);
  });
});

describe('purchase rounding in the grocery list', () => {
  it('half a cucumber is bought as one', () => {
    const r83 = recipeById('r83')!; // poke bowl: ½ cucumber
    expect(line(planOf(['r83', r83.servings]), 'cucumber')).toMatchObject({ amount: 1, name: 'Cucumber' });
  });
  it('every count/discrete line across the full catalog is a whole number', () => {
    groceryLinesFromPlan(planOf(...RECIPES.map((r) => [r.id, r.servings] as [string, number])))
      .filter((l) => l.unit !== null && !['tsp', 'tbsp', 'cup', 'oz', 'lb'].includes(l.unit) || l.unit === null)
      .forEach((l) => expect([l.ingredientId, Number.isInteger(l.amount)]).toEqual([l.ingredientId, true]));
  });
});
