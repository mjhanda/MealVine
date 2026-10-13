import { ingredientById } from '../data/ingredients';
import { RECIPES } from '../data/recipes';
import { MealType, Recipe, RecipeIngredient } from '../types';
import { EatingPrefs, isExcluded, recipeConflicts } from './diets';
import { caloriesPerServing } from './nutrition';

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
    return !!def && [def.name, def.plural ?? ''].some((n) => n.toLowerCase().includes(query));
  });
}

export const totalMinutes = (r: Recipe) => r.prep + r.cook;

// Servings for a new plan entry: the household, except batch recipes (a cake, a jar of sauce),
// which you make whole.
export const defaultServings = (r: Recipe, householdSize: number): number => (r.batch ? r.servings : householdSize);

export function filterRecipes(f: RecipeFilter): Recipe[] {
  const q = f.query.trim().toLowerCase();
  return RECIPES.filter((r) => {
    if (f.mealType !== 'all' && r.mealType !== f.mealType) return false;
    if (f.maxMinutes && totalMinutes(r) > f.maxMinutes) return false;
    if (f.maxKcal && caloriesPerServing(r) > f.maxKcal) return false;
    if (f.onlyIds && !f.onlyIds.has(r.id)) return false;
    if (f.excludeIds?.has(r.id)) return false;
    const conflicts = recipeConflicts(r, f.prefs);
    if (isExcluded(conflicts)) return false;
    if (!f.showAllDiets && conflicts.diet) return false;
    return matchesQuery(r, q);
  });
}

export type RelaxableFilter = 'query' | 'mealType' | 'diet' | 'maxMinutes' | 'maxKcal' | 'favorites' | 'hidePlanned';

// For an empty result: which single filter, if dropped, would bring recipes back (and how many).
// Allergies/dislikes are never suggested.
export function relaxSuggestions(f: RecipeFilter): { filter: RelaxableFilter; count: number }[] {
  const candidates: [RelaxableFilter, boolean, RecipeFilter][] = [
    ['query', !!f.query.trim(), { ...f, query: '' }],
    ['mealType', f.mealType !== 'all', { ...f, mealType: 'all' }],
    ['diet', !f.showAllDiets && f.prefs.diet !== 'classic', { ...f, showAllDiets: true }],
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
