import { ingredientById } from '../data/ingredients';
import { Recipe, RecipeIngredient, Unit } from '../types';

// Free-text ingredients in the user's own recipes: anything not in the catalog. They have an id of
// `custom:<slug>` (so code that looks ingredients up by id simply finds nothing) and keep the name
// as written in `custom`. No aisle, allergen tags, or nutrition: shown as "not checked for allergies".
// Imports data only, so cooking/diets/grocery can all use it without an import cycle.

export const CUSTOM_PREFIX = 'custom:';

export const isCustomIngredient = (ing: Pick<RecipeIngredient, 'id'>): boolean => ing.id.startsWith(CUSTOM_PREFIX);

const slug = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';

export const customIngredientId = (name: string): string => `${CUSTOM_PREFIX}${slug(name)}`;

export function customIngredient(name: string, amount: number, unit: Unit | null, prep?: string): RecipeIngredient {
  const ing: RecipeIngredient = { id: customIngredientId(name), custom: name.trim(), amount, unit };
  return prep ? { ...ing, prep } : ing;
}

// The ingredient's name: the catalog's, or the free text the user wrote.
export function ingredientLabel(ing: Pick<RecipeIngredient, 'id' | 'custom'>): string {
  return ingredientById(ing.id)?.name ?? ing.custom ?? ing.id;
}

// Names of the free-text ingredients in a recipe (unique, in recipe order).
export function customIngredientNames(recipe: Recipe): string[] {
  return [...new Set(recipe.ingredients.filter(isCustomIngredient).map(ingredientLabel))];
}

export const NOT_CHECKED_NOTE = 'Not checked for allergies';
