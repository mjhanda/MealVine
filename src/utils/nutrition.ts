import { TSP_PER } from './units';
import { INGREDIENT_SOURCES, NUTRIENTS_PER_100G } from '../data/nutrition/nutritionData';
import { IngredientSource, NutrientValues } from '../data/nutrition/types';
import { GRAMS } from '../data/nutrition/usdaMap';
import { Recipe, RecipeIngredient, Unit } from '../types';

const OZ_G = 28.3495;
const LB_G = 453.592;

export const NUTRIENT_KEYS: (keyof NutrientValues)[] = ['kcal', 'protein', 'fat', 'satFat', 'carbs', 'fiber', 'sugar', 'sodium'];
const zero = (): NutrientValues => ({ kcal: 0, protein: 0, fat: 0, satFat: 0, carbs: 0, fiber: 0, sugar: 0, sodium: 0 });

// Grams for `amount` of an ingredient in `unit`, or null when we can't convert it.
export function gramsFor(ingredientId: string, amount: number, unit: Unit | null): number | null {
  if (unit === 'oz') return amount * OZ_G;
  if (unit === 'lb') return amount * LB_G;
  const table = GRAMS[ingredientId] ?? {};
  const key = unit ?? 'null';
  const direct = table[key];
  if (direct !== undefined) return amount * direct;
  // Volume: derive from whichever volume unit the table has.
  if (unit && unit in TSP_PER) {
    const known = Object.keys(TSP_PER).find((u) => table[u] !== undefined);
    if (known) return amount * (table[known]! / TSP_PER[known]) * TSP_PER[unit];
  }
  return null;
}

export interface NutritionRow {
  ingredient: RecipeIngredient;
  grams: number | null; // edible grams per serving; null if it couldn't be converted
  values: NutrientValues; // per serving
  source: IngredientSource | undefined;
}

export interface RecipeNutrition {
  perServing: NutrientValues;
  rows: NutritionRow[];
  // Anything that makes the total less exact, for the footnote.
  approximate: { estimated: string[]; proxy: string[]; composite: string[]; unconverted: string[]; missing: string[] };
}

export function recipeNutrition(recipe: Recipe): RecipeNutrition {
  const perServing = zero();
  const approximate: RecipeNutrition['approximate'] = { estimated: [], proxy: [], composite: [], unconverted: [], missing: [] };
  const rows = recipe.ingredients.map((ing) => {
    const source = INGREDIENT_SOURCES[ing.id];
    const per100 = NUTRIENTS_PER_100G[ing.id];
    const raw = gramsFor(ing.id, ing.amount / recipe.servings, ing.unit);
    const grams = raw === null ? null : raw * (1 - (source?.refuse ?? 0));
    const values = zero();
    if (grams === null || !per100) {
      approximate.unconverted.push(ing.id);
    } else {
      NUTRIENT_KEYS.forEach((k) => {
        values[k] = (per100[k] * grams) / 100;
        perServing[k] += values[k];
      });
    }
    if (source?.basis === 'estimate') approximate.estimated.push(ing.id);
    if (source?.basis === 'proxy') approximate.proxy.push(ing.id);
    if (source?.basis === 'composite') approximate.composite.push(ing.id);
    if (source?.missing?.length) approximate.missing.push(ing.id);
    return { ingredient: ing, grams, values, source };
  });
  return { perServing, rows, approximate };
}

// Cached per recipe id: the catalog is static, and Browse filters on calories for every recipe.
const cache = new Map<string, NutrientValues>();
export function caloriesPerServing(recipe: Recipe): number {
  let v = cache.get(recipe.id);
  if (!v) {
    v = recipeNutrition(recipe).perServing;
    cache.set(recipe.id, v);
  }
  return v.kcal;
}

// Display rounding (FDA label conventions, simplified): kcal to 5/10, grams to 1 (or 0.5 under 5), sodium to 5/10 mg.
export function roundForLabel(key: keyof NutrientValues, value: number): number {
  if (key === 'kcal') return value < 50 ? Math.round(value / 5) * 5 : Math.round(value / 10) * 10;
  if (key === 'sodium') return value < 140 ? Math.round(value / 5) * 5 : Math.round(value / 10) * 10;
  return value < 5 ? Math.round(value * 2) / 2 : Math.round(value);
}
