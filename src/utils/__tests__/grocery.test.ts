import { RECIPES } from '../../data/recipes';
import { aisleOrder } from '../../theme';
import { groceryItemsFromPlan, groceryLinesFromPlan, pruneChecked, sortForShopping } from '../grocery';
import { Unit } from '../../types';
import { groceryIngredients } from '../homemade';
import { recipeById } from '../recipeCatalog';
import { toBase, unitFamily } from '../units';

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

describe('per-meal uses (which meals each line is for)', () => {
  const baseSum = (uses: { amount: number; unit: Unit | null }[]) => uses.reduce((t, u) => t + toBase(u.amount, u.unit), 0);
  const fullCatalogPlan = () => planOf(...RECIPES.map((r) => [r.id, r.servings] as [string, number]));

  it('lists every entry that uses the ingredient, in plan order, converting across units', () => {
    const cupRecipe = RECIPES.find((r) => r.ingredients.some((i) => i.id === 'greek-yogurt' && i.unit === 'cup'))!;
    const tbspRecipe = RECIPES.find((r) => r.ingredients.some((i) => i.id === 'greek-yogurt' && i.unit === 'tbsp'))!;
    const merged = line(planOf([cupRecipe.id, cupRecipe.servings], [tbspRecipe.id, tbspRecipe.servings]), 'greek-yogurt')!;
    expect(merged.uses.map((u) => [u.planItemId, u.recipeId, u.unit])).toEqual([
      ['i0', cupRecipe.id, 'cup'],
      ['i1', tbspRecipe.id, 'tbsp'],
    ]);
    expect(baseSum(merged.uses)).toBeCloseTo(toBase(merged.amount, merged.unit));
  });

  it('keeps two entries of the same recipe apart, each scaled to its own servings', () => {
    const r1 = recipeById('r1')!; // 2 cups greek yogurt
    expect(line(planOf(['r1', r1.servings], ['r1', r1.servings * 2]), 'greek-yogurt')!.uses).toEqual([
      { planItemId: 'i0', recipeId: 'r1', amount: 2, unit: 'cup' },
      { planItemId: 'i1', recipeId: 'r1', amount: 4, unit: 'cup' },
    ]);
  });

  it('attributes pantry staples too', () => {
    const staples = groceryLinesFromPlan(planOf(['r8', 2])).filter((l) => l.staple);
    expect(staples.length).toBeGreaterThan(0);
    staples.forEach((l) => expect(l.uses.map((u) => u.recipeId)).toEqual(['r8']));
  });

  it("credits a homemade sauce's ingredients to the meal it's made for", () => {
    const entry = { id: 'a', recipeId: 'r8', servings: 2, storeBought: [] as string[] };
    const lines = groceryLinesFromPlan({ items: [entry] });
    expect(lines.find((l) => l.ingredientId === 'mayonnaise')!.uses.map((u) => [u.planItemId, u.recipeId])).toEqual([['a', 'r8']]);
    // Parmesan is in both the salad and the dressing: still one use, holding the whole amount.
    const parmesan = lines.find((l) => l.ingredientId === 'parmesan')!;
    expect(parmesan.uses).toHaveLength(1);
    expect(baseSum(parmesan.uses)).toBeCloseTo(toBase(parmesan.amount, parmesan.unit));
    const bought = groceryLinesFromPlan({ items: [{ ...entry, storeBought: ['caesar-dressing'] }] });
    expect(bought.find((l) => l.ingredientId === 'mayonnaise')).toBeUndefined();
  });

  it('across the whole catalog, uses cover exactly the entries that need each line and add up to it', () => {
    const plan = fullCatalogPlan();
    groceryLinesFromPlan(plan).forEach((l) => {
      const expected = plan.items
        .filter((item) => groceryIngredients(recipeById(item.recipeId)!, item.servings).some((i) => i.id === l.ingredientId))
        .map((item) => item.id);
      expect([l.ingredientId, l.uses.map((u) => u.planItemId)]).toEqual([l.ingredientId, expected]);
      const sum = baseSum(l.uses);
      const total = toBase(l.amount, l.unit);
      const family = unitFamily(l.unit);
      const shown = family === 'volume' || family === 'weight' ? sum : Math.max(1, Math.ceil(sum - 1e-6)); // counts round up to buy
      expect([l.ingredientId, shown]).toEqual([l.ingredientId, expect.closeTo(total, 5)]);
    });
  });
});
