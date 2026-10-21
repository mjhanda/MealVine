import { ingredientById, INGREDIENTS } from '../data/ingredients';
import { AllergenTag, DietId, IngredientTag, Recipe } from '../types';
import { customIngredientNames } from './customIngredients';
import { homemadeSauceIngredientIds, homemadeSauceTags } from './homemade';

// Any animal flesh. A recipe with none of these is vegetarian.
export const MEAT_TAGS: IngredientTag[] = ['poultry', 'red-meat', 'pork', 'fish', 'shellfish'];

interface DietDef {
  label: string;
  description: string;
  excludes: IngredientTag[];
}

// Diets are derived from ingredient tags, never hand-tagged per recipe.
export const DIETS: Record<DietId, DietDef> = {
  classic: { label: 'Classic', description: 'Everything — meat, fish, and plants', excludes: [] },
  flexitarian: {
    label: 'Flexitarian',
    description: 'Mostly plants, with poultry and fish — no red meat or pork',
    excludes: ['red-meat', 'pork'],
  },
  pescetarian: { label: 'Pescetarian', description: 'Vegetarian, plus fish and seafood', excludes: ['poultry', 'red-meat', 'pork'] },
  vegetarian: { label: 'Vegetarian', description: 'No meat or fish', excludes: MEAT_TAGS },
  vegan: { label: 'Vegan', description: 'No animal products at all', excludes: [...MEAT_TAGS, 'dairy', 'egg', 'honey'] },
  'low-carb': {
    label: 'Low carb',
    description: 'No grains, starchy vegetables, or added sugar',
    excludes: ['grain', 'starchy', 'added-sugar'],
  },
  keto: {
    label: 'Keto',
    description: 'Very low carb: also no legumes or sweet fruit',
    excludes: ['grain', 'starchy', 'added-sugar', 'fruit-sugar', 'legume'],
  },
  paleo: {
    label: 'Paleo',
    description: 'No grains, legumes, dairy, or added sugar',
    excludes: ['grain', 'legume', 'dairy', 'added-sugar'],
  },
};

export const DIET_ORDER: DietId[] = ['classic', 'flexitarian', 'pescetarian', 'vegetarian', 'vegan', 'low-carb', 'keto', 'paleo'];

export const ALLERGENS: { id: AllergenTag; label: string }[] = [
  { id: 'gluten', label: 'Gluten' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'egg', label: 'Egg' },
  { id: 'peanut', label: 'Peanut' },
  { id: 'tree-nut', label: 'Tree nut' },
  { id: 'soy', label: 'Soy' },
  { id: 'sesame', label: 'Sesame' },
  { id: 'fish', label: 'Fish' },
  { id: 'shellfish', label: 'Shellfish' },
  { id: 'mustard', label: 'Mustard' },
  { id: 'sulfite', label: 'Sulfites' },
  { id: 'nightshade', label: 'Nightshades' },
];

export const allergenLabel = (tag: AllergenTag) => ALLERGENS.find((a) => a.id === tag)?.label ?? tag;

// Includes the from-scratch versions of any bottled sauce (src/data/homemade.ts): the user picks
// make or buy per plan entry, so a recipe is flagged if either version conflicts.
export function recipeTags(recipe: Recipe): Set<IngredientTag> {
  const tags = homemadeSauceTags(recipe);
  recipe.ingredients.forEach((ing) => ingredientById(ing.id)?.tags.forEach((t) => tags.add(t)));
  return tags;
}

export function fitsDiet(recipe: Recipe, diet: DietId): boolean {
  const tags = recipeTags(recipe);
  return !DIETS[diet].excludes.some((t) => tags.has(t));
}

export function dietsFor(recipe: Recipe): DietId[] {
  return DIET_ORDER.filter((d) => fitsDiet(recipe, d));
}

export interface EatingPrefs {
  diet: DietId;
  allergies: AllergenTag[];
  dislikes: string[]; // ingredient ids
}

export interface Conflicts {
  diet: boolean;
  allergens: AllergenTag[];
  dislikes: string[]; // ingredient ids present in the recipe
  // Free-text ingredients (your own recipes) we can't check: never silently counted as safe.
  unverified: string[];
}

export function recipeConflicts(recipe: Recipe, prefs: EatingPrefs): Conflicts {
  const tags = recipeTags(recipe);
  // Like the tags, avoided ingredients count in either version of a bottled sauce.
  const ids = new Set([...recipe.ingredients.map((i) => i.id), ...homemadeSauceIngredientIds(recipe)]);
  return {
    diet: !fitsDiet(recipe, prefs.diet),
    allergens: prefs.allergies.filter((a) => tags.has(a)),
    dislikes: prefs.dislikes.filter((d) => ids.has(d)),
    unverified: customIngredientNames(recipe),
  };
}

// Whether unchecked free-text ingredients matter to this user (any allergy, avoid list, or diet).
const hasRestrictions = (prefs: EatingPrefs): boolean =>
  prefs.allergies.length > 0 || prefs.dislikes.length > 0 || prefs.diet !== 'classic';

// Allergens and dislikes always exclude; the diet can be relaxed with "show all diets".
export function isExcluded(c: Conflicts): boolean {
  return c.allergens.length > 0 || c.dislikes.length > 0;
}

export function hasAnyConflict(c: Conflicts): boolean {
  return c.diet || isExcluded(c);
}

export function describeConflicts(c: Conflicts, prefs: EatingPrefs): string[] {
  const out: string[] = [];
  if (c.allergens.length) out.push(`Contains ${c.allergens.map(allergenLabel).join(', ').toLowerCase()}`);
  if (c.dislikes.length) out.push(`Has ${c.dislikes.map((id) => INGREDIENTS[id]?.name.toLowerCase() ?? id).join(', ')}`);
  if (c.diet) out.push(`Not ${DIETS[prefs.diet].label.toLowerCase()}`);
  if (c.unverified.length && hasRestrictions(prefs)) out.push(`Not checked for allergies or diet: ${c.unverified.join(', ')}`);
  return out;
}
