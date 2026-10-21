import { ingredientById } from '../data/ingredients';
import { RECIPES } from '../data/recipes';
import { getUserRecipes, isUserRecipeId } from '../data/userRecipes';
import { MealType, Recipe, RecipeIngredient } from '../types';
import { ingredientLabel } from './customIngredients';
import { describeConflicts, EatingPrefs, isExcluded, recipeConflicts } from './diets';
import { caloriesPerServing } from './nutrition';

// "2 Carrots, diced" — plural for counts above one, prep note appended.
export function ingredientDisplayName(ing: RecipeIngredient, scaledAmount: number): string {
  const def = ingredientById(ing.id);
  const name = def && ing.unit === null && scaledAmount > 1 && def.plural ? def.plural : ingredientLabel(ing);
  return ing.prep ? `${name}, ${ing.prep}` : name;
}

// The catalog plus the user's own recipes (src/data/userRecipes.ts).
export function allRecipes(): Recipe[] {
  const mine = getUserRecipes();
  return mine.length ? [...RECIPES, ...mine] : RECIPES;
}

export function recipeById(id: string | undefined): Recipe | undefined {
  if (!id) return undefined;
  return (isUserRecipeId(id) ? getUserRecipes() : RECIPES).find((r) => r.id === id);
}

// "Quick meals": a breakfast, lunch, or dinner ready in 30 minutes or less, prep + cook.
export const QUICK_MINUTES = 30;
const QUICK_MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];
// 'mine' = the user's own recipes.
export type MealFilter = MealType | 'all' | 'quick' | 'mine';

export const isQuickMeal = (r: Recipe): boolean => QUICK_MEAL_TYPES.includes(r.mealType) && r.prep + r.cook <= QUICK_MINUTES;

function matchesMealFilter(r: Recipe, f: MealFilter): boolean {
  if (f === 'all') return true;
  if (f === 'quick') return isQuickMeal(r);
  if (f === 'mine') return isUserRecipeId(r.id);
  return r.mealType === f;
}

export interface RecipeFilter {
  mealType: MealFilter;
  query: string;
  prefs: EatingPrefs;
  // Relaxes the diet only — allergies and dislikes always exclude.
  showAllDiets?: boolean;
  maxMinutes?: number | null; // prep + cook
  maxKcal?: number | null; // per serving
  onlyIds?: Set<string> | null; // e.g. favorites
  excludeIds?: Set<string> | null; // e.g. already planned
}

function matchesQuery(recipe: Recipe, query: string): boolean {
  if (!query) return true;
  if (recipe.title.toLowerCase().includes(query)) return true;
  return recipe.ingredients.some((ing) => {
    const def = ingredientById(ing.id);
    return [ingredientLabel(ing), def?.plural ?? ''].some((n) => n.toLowerCase().includes(query));
  });
}

export const totalMinutes = (r: Recipe) => r.prep + r.cook;

// Servings for a new plan entry: the household, except batch recipes (a cake, a jar of sauce),
// which you make whole.
export const defaultServings = (r: Recipe, householdSize: number): number => (r.batch ? r.servings : householdSize);

export function filterRecipes(f: RecipeFilter): Recipe[] {
  const q = f.query.trim().toLowerCase();
  return allRecipes().filter((r) => {
    if (!matchesMealFilter(r, f.mealType)) return false;
    if (f.maxMinutes && totalMinutes(r) > f.maxMinutes) return false;
    if (f.maxKcal && caloriesPerServing(r) > f.maxKcal) return false;
    if (f.onlyIds && !f.onlyIds.has(r.id)) return false;
    if (f.excludeIds?.has(r.id)) return false;
    // Under "My recipes" your own recipes always show; conflicts are flagged, not hidden.
    if (f.mealType !== 'mine') {
      const conflicts = recipeConflicts(r, f.prefs);
      if (isExcluded(conflicts)) return false;
      if (!f.showAllDiets && conflicts.diet) return false;
    }
    return matchesQuery(r, q);
  });
}

// For a card in the browse list: what about your own recipe conflicts with your allergies or
// avoided ingredients ("Contains peanut"). Only your recipes can show despite these.
export function ownRecipeWarning(r: Recipe, prefs: EatingPrefs): string | undefined {
  if (!isUserRecipeId(r.id)) return undefined;
  const c = recipeConflicts(r, prefs);
  if (!isExcluded(c)) return undefined;
  return describeConflicts({ ...c, diet: false, unverified: [] }, prefs).join(' · ');
}

export type RelaxableFilter = 'query' | 'mealType' | 'diet' | 'maxMinutes' | 'maxKcal' | 'favorites' | 'hidePlanned';

// For an empty result: which single filter, if dropped, would bring recipes back (and how many).
// Allergies/dislikes are never suggested.
export function relaxSuggestions(f: RecipeFilter): { filter: RelaxableFilter; count: number }[] {
  const candidates: [RelaxableFilter, boolean, RecipeFilter][] = [
    ['query', !!f.query.trim(), { ...f, query: '' }],
    ['mealType', f.mealType !== 'all', { ...f, mealType: 'all' }],
    ['diet', !f.showAllDiets && f.prefs.diet !== 'classic' && f.mealType !== 'mine', { ...f, showAllDiets: true }],
    ['maxMinutes', !!f.maxMinutes, { ...f, maxMinutes: null }],
    ['maxKcal', !!f.maxKcal, { ...f, maxKcal: null }],
    ['favorites', !!f.onlyIds, { ...f, onlyIds: null }],
    ['hidePlanned', !!f.excludeIds?.size, { ...f, excludeIds: null }],
  ];
  return candidates
    .filter(([, active]) => active)
    .map(([filter, , relaxed]) => ({ filter, count: filterRecipes(relaxed).length }))
    .filter((s) => s.count > 0);
}
