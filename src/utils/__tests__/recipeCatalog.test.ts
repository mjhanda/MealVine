import { RECIPES } from '../../data/recipes';
import { filterRecipes, ingredientDisplayName, recipeById } from '../recipeCatalog';

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
  it('returns the whole catalog with no filters', () => {
    expect(filterRecipes('all', 'mixed', '')).toHaveLength(RECIPES.length);
  });
  it('filters by meal type', () => {
    expect(filterRecipes('dinner', 'mixed', '').every((r) => r.mealType === 'dinner')).toBe(true);
  });
  it('vegetarian pref excludes meat and fish', () => {
    expect(filterRecipes('all', 'vegetarian', '').every((r) => r.diet === 'vegetarian')).toBe(true);
  });
  it('matches canonical ingredient names, case-insensitively', () => {
    const results = filterRecipes('all', 'mixed', '  CHICKPEAS ');
    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => expect(r.title.toLowerCase().includes('chickpea') || r.ingredients.some((i) => i.id === 'chickpeas')).toBe(true));
  });
  it('matches plural names', () => {
    expect(filterRecipes('all', 'mixed', 'tomatoes').some((r) => r.ingredients.some((i) => i.id === 'tomato'))).toBe(true);
  });
});
