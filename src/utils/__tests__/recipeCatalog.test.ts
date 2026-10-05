import { RECIPES } from '../../data/recipes';
import { filterRecipes, recipeById } from '../recipeCatalog';

describe('recipeById', () => {
  it('finds a recipe', () => expect(recipeById('r1')?.id).toBe('r1'));
  it('returns undefined for unknown or missing ids', () => {
    expect(recipeById('nope')).toBeUndefined();
    expect(recipeById(undefined)).toBeUndefined();
  });
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
  it('matches by ingredient, case-insensitively', () => {
    const results = filterRecipes('all', 'mixed', '  CHICKPEAS ');
    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) =>
      expect(
        r.title.toLowerCase().includes('chickpeas') ||
          r.ingredients.some((i) => i.name.toLowerCase().includes('chickpeas'))
      ).toBe(true)
    );
  });
});
