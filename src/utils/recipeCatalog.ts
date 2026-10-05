import { RECIPES } from '../data/recipes';
import { DietPref, MealType, Recipe } from '../types';

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
        r.ingredients.some((ing) => ing.name.toLowerCase().includes(query))
    );
  }
  return pool;
}
