import { HOMEMADE } from '../../data/homemade';
import { INGREDIENTS } from '../../data/ingredients';
import { RECIPES } from '../../data/recipes';
import { recipeConflicts } from '../diets';
import { groceryLinesFromPlan } from '../grocery';
import {
  batchesNeeded,
  bottledSauceIds,
  cookingSteps,
  homemadeSauceIngredientIds,
  groceryIngredients,
  homemadeSauceTags,
  recipeAsCooked,
  sauceOptions,
  saucesToMake,
} from '../homemade';
import { recipeById } from '../recipeCatalog';
import { unitFamily } from '../units';

const r8 = recipeById('r8')!; // Grilled Chicken Caesar Salad: 3 tbsp Caesar dressing, serves 2
const r22 = recipeById('r22')!; // 2 cups marinara, serves 3

describe('homemade sauce catalog', () => {
  it.each(Object.entries(HOMEMADE))('%s links to a batch side recipe in the same unit family', (id, option) => {
    expect(INGREDIENTS[id]).toBeDefined();
    const sauce = recipeById(option.recipeId)!;
    expect(sauce).toBeDefined();
    expect(sauce.mealType).toBe('side');
    expect(sauce.batch).toBe(true);
    const families = new Set(RECIPES.flatMap((r) => r.ingredients.filter((i) => i.id === id).map((i) => unitFamily(i.unit))));
    expect([...families]).toEqual([unitFamily(option.yields.unit)]);
  });

  it('every recipe using a bottled sauce offers to make it', () => {
    const uses = RECIPES.filter((r) => r.ingredients.some((i) => HOMEMADE[i.id]));
    expect(uses.length).toBeGreaterThanOrEqual(21);
    uses.forEach((r) => expect(sauceOptions(r).length).toBeGreaterThan(0));
  });
});

describe('sauceOptions / bottledSauceIds', () => {
  it('finds the bottled sauce and its recipe', () => {
    expect(sauceOptions(r8).map((o) => [o.ingredient.id, o.sauce.id])).toEqual([['caesar-dressing', 'r134']]);
    expect(bottledSauceIds(r8)).toEqual(['caesar-dressing']);
  });

  it('is empty for recipes without bottled sauces, or none at all', () => {
    expect(sauceOptions(recipeById('r1')!)).toEqual([]);
    expect(bottledSauceIds(undefined)).toEqual([]);
  });
});

describe('batchesNeeded', () => {
  it('makes at least one batch', () => {
    expect(batchesNeeded('caesar-dressing', 3, 'tbsp')).toBe(1);
  });

  it('makes enough whole batches to cover the amount', () => {
    expect(batchesNeeded('marinara', 3, 'cup')).toBe(1); // exactly one batch
    expect(batchesNeeded('marinara', 5, 'cup')).toBe(2);
  });

  it('is zero for an ingredient with no recipe', () => {
    expect(batchesNeeded('olive-oil', 1, 'tbsp')).toBe(0);
  });
});

describe('saucesToMake', () => {
  it('makes every sauce not marked store-bought', () => {
    expect(saucesToMake(r8, 2).map((s) => s.sauce.id)).toEqual(['r134']);
    expect(saucesToMake(r8, 2, ['caesar-dressing'])).toEqual([]);
  });

  it('scales batches with servings', () => {
    expect(saucesToMake(r22, 3)[0].batches).toBe(1); // 2 cups
    expect(saucesToMake(r22, 6)[0].batches).toBe(2); // 4 cups > one 3-cup batch
  });
});

describe('recipeAsCooked', () => {
  it('returns the recipe itself when nothing changes', () => {
    expect(recipeAsCooked(r8, 2, ['caesar-dressing'])).toBe(r8);
  });

  it('puts the sauce steps first and appends its ingredients', () => {
    const cooked = recipeAsCooked(r8, 2);
    expect(cooked.steps[0]).toMatch(/^Make the Caesar Dressing first\. /);
    expect(cooked.steps).toHaveLength(recipeById('r134')!.steps.length + r8.steps.length);
    expect(cooked.ingredients.map((i) => i.id)).toEqual(expect.arrayContaining(['caesar-dressing', 'mayonnaise', 'parmesan']));
  });

  it('scales the recipe to the servings and multiplies sauce batches', () => {
    const cooked = recipeAsCooked(r22, 6);
    expect(cooked.servings).toBe(6);
    expect(cooked.ingredients.find((i) => i.id === 'marinara')!.amount).toBe(4);
    expect(cooked.steps[0]).toContain('(2 batches)');
    const tomatoes = cooked.ingredients.filter((i) => i.id === 'diced-tomatoes');
    expect(tomatoes.at(-1)!.amount).toBe(4); // 2 cans × 2 batches
  });

  it('scales without sauces too', () => {
    const r1 = recipeById('r1')!;
    expect(recipeAsCooked(r1, r1.servings * 2).ingredients[0].amount).toBe(r1.ingredients[0].amount * 2);
  });
});

describe('groceryIngredients and the grocery list', () => {
  it('swaps the bottled sauce for its ingredients when making it', () => {
    const ids = groceryIngredients(r8, 2).map((i) => i.id);
    expect(ids).not.toContain('caesar-dressing');
    expect(ids).toContain('mayonnaise');
  });

  it('keeps the bottled sauce when buying it', () => {
    const ids = groceryIngredients(r8, 2, ['caesar-dressing']).map((i) => i.id);
    expect(ids).toContain('caesar-dressing');
    expect(ids).not.toContain('mayonnaise');
  });

  it('flows through to the grocery list per plan entry', () => {
    const make = groceryLinesFromPlan({ items: [{ id: 'a', recipeId: 'r8', servings: 2, storeBought: [] }] });
    const buy = groceryLinesFromPlan({ items: [{ id: 'a', recipeId: 'r8', servings: 2, storeBought: ['caesar-dressing'] }] });
    expect(make.map((l) => l.ingredientId)).not.toContain('caesar-dressing');
    expect(make.map((l) => l.ingredientId)).toContain('worcestershire-sauce');
    expect(buy.map((l) => l.ingredientId)).toContain('caesar-dressing');
  });
});

describe('allergy and diet checks', () => {
  it('include the homemade version of a sauce', () => {
    expect(homemadeSauceTags(r8).has('soy')).toBe(true); // mayonnaise in the homemade dressing
    const prefs = { diet: 'classic' as const, allergies: ['soy' as const], dislikes: [] };
    expect(recipeConflicts(r8, prefs).allergens).toEqual(['soy']);
  });
});

describe('cookingSteps', () => {
  it('starts with the sauce and keeps each part\'s ingredients separate', () => {
    const steps = cookingSteps(r8, 2);
    const sauceSteps = recipeById('r134')!.steps.length;
    expect(steps).toHaveLength(sauceSteps + r8.steps.length);
    expect(steps[0].text).toMatch(/^Make the Caesar Dressing first\. /);
    steps.forEach((s) => expect(new Set(s.ingredients.map((i) => i.id)).size).toBe(s.ingredients.length));
    expect(steps[0].ingredients.map((i) => i.id)).toEqual(['lemon', 'garlic']);
  });

  it('scales the sauce by batches and the dish by servings', () => {
    const steps = cookingSteps(r22, 6);
    const tomatoStep = steps.find((s) => s.ingredients.some((i) => i.id === 'diced-tomatoes'))!;
    expect(tomatoStep.ingredients.find((i) => i.id === 'diced-tomatoes')!.amount).toBe(4);
  });

  it('is just the recipe when buying', () => {
    expect(cookingSteps(r8, 2, ['caesar-dressing']).map((s) => s.text)).toEqual(r8.steps);
  });
});

describe('avoided ingredients', () => {
  it('count in the homemade sauce too', () => {
    expect(homemadeSauceIngredientIds(r8)).toContain('mayonnaise');
    const prefs = { diet: 'classic' as const, allergies: [], dislikes: ['mayonnaise'] };
    expect(recipeConflicts(r8, prefs).dislikes).toEqual(['mayonnaise']);
  });
});
