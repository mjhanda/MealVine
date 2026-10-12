import { INGREDIENTS } from '../../data/ingredients';
import { INGREDIENT_SOURCES, NUTRIENTS_PER_100G } from '../../data/nutrition/nutritionData';
import { RECIPES } from '../../data/recipes';
import { gramsFor, recipeNutrition, roundForLabel } from '../nutrition';

describe('nutrition data coverage', () => {
  it('every canonical ingredient has nutrients and a source', () => {
    Object.keys(INGREDIENTS).forEach((id) => {
      expect([id, !!NUTRIENTS_PER_100G[id], !!INGREDIENT_SOURCES[id]]).toEqual([id, true, true]);
    });
  });

  it('every ingredient/unit used in the catalog converts to grams', () => {
    const failures = RECIPES.flatMap((r) => r.ingredients.filter((i) => gramsFor(i.id, i.amount, i.unit) === null).map((i) => `${r.id}:${i.id}:${i.unit}`));
    expect(failures).toEqual([]);
  });

  it('every recipe has a complete nutrition calculation', () => {
    RECIPES.forEach((r) => expect([r.id, recipeNutrition(r).approximate.unconverted]).toEqual([r.id, []]));
  });
});

describe('gramsFor', () => {
  it('weights convert directly', () => {
    expect(gramsFor('chicken-breast', 1, 'lb')).toBeCloseTo(453.6, 0);
    expect(gramsFor('chicken-breast', 4, 'oz')).toBeCloseTo(113.4, 0);
  });
  it('derives tbsp/tsp from a cup value and vice versa', () => {
    expect(gramsFor('greek-yogurt', 1, 'tbsp')).toBeCloseTo(245 / 16);
    expect(gramsFor('olive-oil', 1, 'cup')).toBeCloseTo(13.5 * 16);
  });
  it('counts and discrete units use the table', () => {
    expect(gramsFor('eggs', 2, null)).toBe(100);
    expect(gramsFor('garlic', 3, 'clove')).toBe(9);
  });
  it('returns null for an unknown pairing', () => {
    expect(gramsFor('eggs', 1, 'cup')).toBeNull();
  });
});

describe('recipeNutrition', () => {
  it('Veggie Egg Scramble (r2) is in a sensible range per serving', () => {
    const n = recipeNutrition(RECIPES.find((r) => r.id === 'r2')!).perServing;
    expect(n.kcal).toBeGreaterThan(150);
    expect(n.kcal).toBeLessThan(350);
    expect(n.protein).toBeGreaterThan(10);
  });

  it('calories roughly agree with 4/4/9 kcal per g of protein/carbs/fat for every recipe', () => {
    RECIPES.forEach((r) => {
      const { kcal, protein, carbs, fat } = recipeNutrition(r).perServing;
      const atwater = 4 * protein + 4 * carbs + 9 * fat;
      expect([r.id, Math.abs(kcal - atwater) / Math.max(kcal, 1) < 0.2]).toEqual([r.id, true]);
    });
  });

  it('edamame in pods only counts the edible half', () => {
    const r = RECIPES.find((x) => x.ingredients.some((i) => i.id === 'edamame-pods'))!;
    const row = recipeNutrition(r).rows.find((x) => x.ingredient.id === 'edamame-pods')!;
    const raw = gramsFor('edamame-pods', row.ingredient.amount / r.servings, row.ingredient.unit)!;
    expect(row.grams).toBeCloseTo(raw * 0.5);
  });

  it('flags estimated, proxy, and composite ingredients', () => {
    const r = RECIPES.find((x) => x.ingredients.some((i) => i.id === 'balsamic-glaze'))!;
    expect(recipeNutrition(r).approximate.estimated).toContain('balsamic-glaze');
  });
});

describe('roundForLabel', () => {
  it.each([
    ['kcal', 347, 350],
    ['kcal', 42, 40],
    ['protein', 12.4, 12],
    ['fat', 3.3, 3.5],
    ['sodium', 512, 510],
    ['sodium', 87, 85],
  ] as const)('%s %p → %p', (k, v, out) => expect(roundForLabel(k, v)).toBe(out));
});
