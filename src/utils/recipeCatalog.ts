import { ingredientById } from '../data/ingredients';
import { RECIPES } from '../data/recipes';
import { DietPref, MealType, Recipe, RecipeIngredient } from '../types';

// "2 Carrots, diced" — plural for counts above one, prep note appended.
export function ingredientDisplayName(ing: RecipeIngredient, scaledAmount: number): string {
  const def = ingredientById(ing.id);
  if (!def) return ing.id;
  const name = ing.unit === null && scaledAmount > 1 && def.plural ? def.plural : def.name;
  return ing.prep ? `${name}, ${ing.prep}` : name;
}

export function recipeById(id: string | undefined): Recipe | undefined {
  if (!id) return undefined;
  return RECIPES.find((r) => r.id === id);
}

export function filterRecipes(
  mealType: MealType | 'all',
  dietPref: DietPref,
  search: string
): Recipe[] {
  let pool = RECIPES;
  if (mealType !== 'all') pool = pool.filter((r) => r.mealType === mealType);
  if (dietPref === 'vegetarian') pool = pool.filter((r) => r.diet === 'vegetarian');
  const query = search.trim().toLowerCase();
  if (query) {
    pool = pool.filter(
      (r) =>
        r.title.toLowerCase().includes(query) ||
        r.ingredients.some((ing) => {
          const def = ingredientById(ing.id);
          return !!def && [def.name, def.plural ?? ''].some((n) => n.toLowerCase().includes(query));
        })
    );
  }
  return pool;
}
