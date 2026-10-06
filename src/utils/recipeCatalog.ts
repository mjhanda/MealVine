import { ingredientById } from '../data/ingredients';
import { RECIPES } from '../data/recipes';
import { MealType, Recipe, RecipeIngredient } from '../types';
import { EatingPrefs, isExcluded, recipeConflicts } from './diets';

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

export interface RecipeFilter {
  mealType: MealType | 'all';
  query: string;
  prefs: EatingPrefs;
  // Relaxes the diet only — allergies and dislikes always exclude.
  showAllDiets?: boolean;
}

function matchesQuery(recipe: Recipe, query: string): boolean {
  if (!query) return true;
  if (recipe.title.toLowerCase().includes(query)) return true;
  return recipe.ingredients.some((ing) => {
    const def = ingredientById(ing.id);
    return !!def && [def.name, def.plural ?? ''].some((n) => n.toLowerCase().includes(query));
  });
}

export function filterRecipes({ mealType, query, prefs, showAllDiets = false }: RecipeFilter): Recipe[] {
  const q = query.trim().toLowerCase();
  return RECIPES.filter((r) => {
    if (mealType !== 'all' && r.mealType !== mealType) return false;
    const conflicts = recipeConflicts(r, prefs);
    if (isExcluded(conflicts)) return false;
    if (!showAllDiets && conflicts.diet) return false;
    return matchesQuery(r, q);
  });
}
