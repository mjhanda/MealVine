import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isUserRecipeId, setUserRecipes } from '../data/userRecipes';
import { Recipe, RecipeIngredient } from '../types';
import { deriveProtein } from '../utils/customRecipes';
import { isRecord, MigrationError, persistOptions } from './persistence';

// The user's own recipes (T47). Every change is pushed to src/data/userRecipes.ts, where the pure
// catalog functions (recipeById, filterRecipes, …) pick them up alongside the built-in catalog.

interface PersistedCustomRecipes {
  recipes: Recipe[];
}

// v2: `proteinAuto` marks a recipe whose protein the editor works out ("Automatic").
export const CUSTOM_RECIPES_VERSION = 2;

const isIngredient = (v: unknown): v is RecipeIngredient =>
  isRecord(v) && typeof v.id === 'string' && typeof v.amount === 'number' && (v.unit === null || typeof v.unit === 'string');

// Keeps a recipe only if every field the app relies on is there; drops it otherwise.
function isRecipe(v: unknown): v is Recipe {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    isUserRecipeId(v.id) &&
    typeof v.title === 'string' &&
    typeof v.mealType === 'string' &&
    typeof v.protein === 'string' &&
    typeof v.servings === 'number' &&
    v.servings > 0 &&
    typeof v.prep === 'number' &&
    typeof v.cook === 'number' &&
    typeof v.emoji === 'string' &&
    (v.proteinAuto === undefined || typeof v.proteinAuto === 'boolean') &&
    Array.isArray(v.ingredients) &&
    v.ingredients.every(isIngredient) &&
    Array.isArray(v.steps) &&
    v.steps.every((s) => typeof s === 'string')
  );
}

// v1 didn't record "Automatic": a protein that matches what the ingredients say is taken as
// Automatic (re-deriving it gives the same answer, so nothing visible changes).
const markAutomatic = (r: Recipe): Recipe =>
  r.proteinAuto === undefined && r.protein === deriveProtein(r.ingredients) ? { ...r, proteinAuto: true } : r;

// Malformed recipes are dropped rather than failing the whole store.
export function migrateCustomRecipes(persisted: unknown, fromVersion: number): PersistedCustomRecipes {
  if (!isRecord(persisted)) throw new MigrationError('customRecipes: not an object');
  if (persisted.recipes !== undefined && !Array.isArray(persisted.recipes)) throw new MigrationError('customRecipes: recipes not a list');
  const recipes = ((persisted.recipes as unknown[] | undefined) ?? []).filter(isRecipe);
  return { recipes: fromVersion < 2 ? recipes.map(markAutomatic) : recipes };
}

interface CustomRecipesState extends PersistedCustomRecipes {
  hasHydrated: boolean;
  // Adds the recipe, or replaces the one with the same id (an edit).
  saveRecipe: (recipe: Recipe) => void;
  removeRecipe: (id: string) => void;
  // Puts a deleted recipe back at its old position (undo); no-op if it's already there.
  restoreRecipe: (recipe: Recipe, index: number) => void;
}

export const useCustomRecipesStore = create<CustomRecipesState>()(
  persist(
    (set) => ({
      recipes: [],
      hasHydrated: false,
      saveRecipe: (recipe) =>
        set((state) => ({
          recipes: state.recipes.some((r) => r.id === recipe.id)
            ? state.recipes.map((r) => (r.id === recipe.id ? recipe : r))
            : [...state.recipes, recipe],
        })),
      removeRecipe: (id) => set((state) => ({ recipes: state.recipes.filter((r) => r.id !== id) })),
      restoreRecipe: (recipe, index) =>
        set((state) => {
          if (state.recipes.some((r) => r.id === recipe.id)) return state;
          const recipes = [...state.recipes];
          recipes.splice(Math.min(Math.max(0, index), recipes.length), 0, recipe);
          return { recipes };
        }),
    }),
    persistOptions<CustomRecipesState, PersistedCustomRecipes>({
      name: 'mealplan:customRecipes',
      version: CUSTOM_RECIPES_VERSION,
      partialize: ({ recipes }) => ({ recipes }),
      migrate: migrateCustomRecipes,
      onHydrated: () => useCustomRecipesStore.setState({ hasHydrated: true }),
    })
  )
);

// Keep the catalog's view in step with the store (rehydration, edits, backup restore).
setUserRecipes(useCustomRecipesStore.getState().recipes);
useCustomRecipesStore.subscribe((state, prev) => {
  if (state.recipes !== prev.recipes) setUserRecipes(state.recipes);
});

// Re-renders a screen whenever your recipes change (the catalog functions read them directly).
export const useUserRecipes = (): Recipe[] => useCustomRecipesStore((s) => s.recipes);
