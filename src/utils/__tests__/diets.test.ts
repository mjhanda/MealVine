import { INGREDIENTS } from '../../data/ingredients';
import { RECIPES } from '../../data/recipes';
import { IngredientTag, Recipe } from '../../types';
import {
  ALLERGENS,
  describeConflicts,
  DIET_ORDER,
  DIETS,
  dietsFor,
  fitsDiet,
  hasAnyConflict,
  isExcluded,
  recipeConflicts,
} from '../diets';
import { filterRecipes } from '../recipeCatalog';

const tagsOf = (r: Recipe) => new Set<IngredientTag>(r.ingredients.flatMap((i) => INGREDIENTS[i.id].tags));
const hasIngredient = (r: Recipe, ...ids: string[]) => r.ingredients.some((i) => ids.includes(i.id));

describe('diets, catalog-wide', () => {
  it.each(DIET_ORDER)('%s: no recipe that fits contains an excluded tag', (diet) => {
    RECIPES.filter((r) => fitsDiet(r, diet)).forEach((r) => {
      const tags = tagsOf(r);
      DIETS[diet].excludes.forEach((t) => expect([r.id, t, tags.has(t)]).toEqual([r.id, t, false]));
    });
  });

  it.each(DIET_ORDER)('%s has at least 10 recipes and 10 dinners', (diet) => {
    expect(RECIPES.filter((r) => fitsDiet(r, diet)).length).toBeGreaterThanOrEqual(10);
    expect(RECIPES.filter((r) => r.mealType === 'dinner' && fitsDiet(r, diet)).length).toBeGreaterThanOrEqual(10);
  });

  it('keeps at least 15 weeknight dinners at 20 minutes or less', () => {
    expect(RECIPES.filter((r) => r.mealType === 'dinner' && r.prep + r.cook <= 20).length).toBeGreaterThanOrEqual(15);
  });

  it('vegan shows nothing with dairy, egg, honey, meat, or fish ingredients', () => {
    const banned = ['greek-yogurt', 'milk', 'eggs', 'honey', 'feta', 'parmesan', 'chicken-breast', 'salmon', 'shrimp', 'chicken-broth', 'granola', 'caesar-dressing'];
    RECIPES.filter((r) => fitsDiet(r, 'vegan')).forEach((r) => expect([r.id, hasIngredient(r, ...banned)]).toEqual([r.id, false]));
  });

  it('classic fits everything', () => expect(RECIPES.every((r) => fitsDiet(r, 'classic'))).toBe(true));

  it('diets nest: vegan ⊂ vegetarian ⊂ pescetarian ⊂ flexitarian, keto ⊂ low-carb', () => {
    RECIPES.forEach((r) => {
      if (fitsDiet(r, 'vegan')) expect(fitsDiet(r, 'vegetarian')).toBe(true);
      if (fitsDiet(r, 'vegetarian')) expect(fitsDiet(r, 'pescetarian')).toBe(true);
      if (fitsDiet(r, 'pescetarian')) expect(fitsDiet(r, 'flexitarian')).toBe(true);
      if (fitsDiet(r, 'keto')) expect(fitsDiet(r, 'low-carb')).toBe(true);
    });
  });

  it('dietsFor lists exactly the fitting diets', () => {
    const r = RECIPES[0];
    expect(dietsFor(r)).toEqual(DIET_ORDER.filter((d) => fitsDiet(r, d)));
  });
});

describe('allergens, catalog-wide', () => {
  it.each(ALLERGENS.map((a) => a.id))('excluding %s hides every recipe with a tagged ingredient', (allergen) => {
    const shown = filterRecipes({ mealType: 'all', query: '', prefs: { diet: 'classic', allergies: [allergen], dislikes: [] }, showAllDiets: true });
    shown.forEach((r) => expect([r.id, tagsOf(r).has(allergen)]).toEqual([r.id, false]));
  });

  // Spot checks that common hidden sources are tagged (conservative tagging).
  it.each([
    ['soy-sauce', 'gluten'],
    ['rolled-oats', 'gluten'],
    ['caesar-dressing', 'fish'],
    ['pesto', 'tree-nut'],
    ['hummus', 'sesame'],
    ['zaatar', 'sesame'],
    ['dark-chocolate-chips', 'dairy'],
    ['egg-noodles', 'egg'],
    ['mixed-nuts', 'peanut'],
    ['peanut-sauce', 'soy'],
    ['curry-powder', 'mustard'],
    ['dried-cranberries', 'sulfite'],
  ] as const)('%s is tagged %s', (id, tag) => expect(INGREDIENTS[id].tags).toContain(tag));
});

describe('recipeConflicts', () => {
  const r95 = RECIPES.find((r) => r.id === 'r95')!; // one-pot chicken & rice
  it('reports diet, allergens, and dislikes separately', () => {
    const prefs = { diet: 'vegetarian' as const, allergies: ['gluten' as const], dislikes: ['carrot'] };
    const c = recipeConflicts(r95, prefs);
    expect(c.diet).toBe(true);
    expect(c.dislikes).toEqual(['carrot']);
    expect(hasAnyConflict(c)).toBe(true);
    expect(isExcluded(c)).toBe(true);
    expect(describeConflicts(c, prefs)).toEqual(['Has carrot', 'Not vegetarian']);
  });
  it('no conflicts for a fitting recipe', () => {
    const c = recipeConflicts(r95, { diet: 'classic', allergies: [], dislikes: [] });
    expect(hasAnyConflict(c)).toBe(false);
  });
});
