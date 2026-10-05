import { categoryOrder, mealTypeOrder } from '../../theme';
import { RECIPES } from '../recipes';

describe('recipe catalog integrity', () => {
  it('has unique ids', () => {
    const ids = RECIPES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(RECIPES.map((r) => [r.id, r] as const))('%s is well-formed', (_id, recipe) => {
    expect(recipe.title.trim()).not.toBe('');
    expect(mealTypeOrder).toContain(recipe.mealType);
    expect(recipe.servings).toBeGreaterThan(0);
    expect(recipe.prep + recipe.cook).toBeGreaterThan(0);
    expect(recipe.ingredients.length).toBeGreaterThan(0);
    expect(recipe.steps.length).toBeGreaterThan(0);
    recipe.ingredients.forEach((ing) => {
      expect(ing.amount).toBeGreaterThan(0);
      expect(categoryOrder).toContain(ing.category);
    });
  });
});
