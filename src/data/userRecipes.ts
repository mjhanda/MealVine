import { Recipe } from '../types';

// The user's own recipes (T47), as the catalog sees them. The persisted copy lives in
// src/store/customRecipesStore.ts, which pushes every change here; the pure catalog functions in
// src/utils/recipeCatalog.ts read from here so they never import a store.

// User recipe ids start with this; catalog ids are r1, r2, … so the two never clash.
export const USER_RECIPE_PREFIX = 'u-';

export const isUserRecipeId = (id: string): boolean => id.startsWith(USER_RECIPE_PREFIX);

let userRecipes: Recipe[] = [];

export function setUserRecipes(recipes: Recipe[]): void {
  userRecipes = recipes;
}

export const getUserRecipes = (): Recipe[] => userRecipes;
