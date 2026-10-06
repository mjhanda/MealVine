import { INGREDIENTS } from '../../data/ingredients';
import { RECIPES } from '../../data/recipes';
import { EatingPrefs, fitsDiet } from '../diets';
import { filterRecipes, ingredientDisplayName, recipeById } from '../recipeCatalog';

const classic: EatingPrefs = { diet: 'classic', allergies: [], dislikes: [] };

describe('recipeById', () => {
  it('finds a recipe', () => expect(recipeById('r1')?.id).toBe('r1'));
  it('returns undefined for unknown or missing ids', () => {
    expect(recipeById('nope')).toBeUndefined();
    expect(recipeById(undefined)).toBeUndefined();
  });
});

describe('ingredientDisplayName', () => {
  it('uses the canonical name', () => expect(ingredientDisplayName({ id: 'garlic', amount: 2, unit: 'clove' }, 2)).toBe('Garlic'));
  it('pluralizes counts above one', () => expect(ingredientDisplayName({ id: 'carrot', amount: 2, unit: null }, 2)).toBe('Carrots'));
  it('keeps singular for one', () => expect(ingredientDisplayName({ id: 'carrot', amount: 1, unit: null }, 1)).toBe('Carrot'));
  it('appends prep', () =>
    expect(ingredientDisplayName({ id: 'eggs', amount: 2, unit: null, prep: 'hard-boiled' }, 2)).toBe('Eggs, hard-boiled'));
});

describe('filterRecipes', () => {
  it('returns the whole catalog for classic with no filters', () => {
    expect(filterRecipes({ mealType: 'all', query: '', prefs: classic })).toHaveLength(RECIPES.length);
  });
  it('filters by meal type', () => {
    expect(filterRecipes({ mealType: 'dinner', query: '', prefs: classic }).every((r) => r.mealType === 'dinner')).toBe(true);
  });
  it('applies the diet unless showAllDiets', () => {
    const veg: EatingPrefs = { ...classic, diet: 'vegetarian' };
    expect(filterRecipes({ mealType: 'all', query: '', prefs: veg }).every((r) => fitsDiet(r, 'vegetarian'))).toBe(true);
    expect(filterRecipes({ mealType: 'all', query: '', prefs: veg, showAllDiets: true })).toHaveLength(RECIPES.length);
  });
  it('allergies exclude even with showAllDiets', () => {
    const prefs: EatingPrefs = { ...classic, allergies: ['peanut'] };
    const results = filterRecipes({ mealType: 'all', query: '', prefs, showAllDiets: true });
    expect(results.length).toBeLessThan(RECIPES.length);
    results.forEach((r) => r.ingredients.forEach((i) => expect(INGREDIENTS[i.id].tags).not.toContain('peanut')));
  });
  it('dislikes exclude', () => {
    const prefs: EatingPrefs = { ...classic, dislikes: ['firm-tofu'] };
    expect(filterRecipes({ mealType: 'all', query: '', prefs }).some((r) => r.ingredients.some((i) => i.id === 'firm-tofu'))).toBe(false);
  });
  it('matches canonical ingredient names, case-insensitively', () => {
    const results = filterRecipes({ mealType: 'all', query: '  CHICKPEAS ', prefs: classic });
    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => expect(r.title.toLowerCase().includes('chickpea') || r.ingredients.some((i) => i.id === 'chickpeas')).toBe(true));
  });
  it('matches plural names', () => {
    expect(filterRecipes({ mealType: 'all', query: 'tomatoes', prefs: classic }).some((r) => r.ingredients.some((i) => i.id === 'tomato'))).toBe(true);
  });
});
