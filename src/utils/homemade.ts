import { ingredientById } from '../data/ingredients';
import { HOMEMADE } from '../data/homemade';
import { RECIPES } from '../data/recipes';
import { IngredientTag, Recipe, RecipeIngredient } from '../types';
import { stepIngredients } from './cooking';
import { scaleAmount, toBase } from './units';

// Imports data only (not recipeCatalog/diets), so diets.ts can use it without an import cycle.
const RECIPE_BY_ID = new Map(RECIPES.map((r) => [r.id, r]));

export interface SauceOption {
  ingredient: RecipeIngredient; // the bottled ingredient as the recipe lists it
  sauce: Recipe; // the make-it-yourself recipe
}

// Bottled sauces in a recipe that have a make-it-yourself recipe, in recipe order.
export function sauceOptions(recipe: Recipe): SauceOption[] {
  return recipe.ingredients.flatMap((ingredient) => {
    const sauce = HOMEMADE[ingredient.id] && RECIPE_BY_ID.get(HOMEMADE[ingredient.id].recipeId);
    return sauce ? [{ ingredient, sauce }] : [];
  });
}

// Ids of a recipe's bottled sauces — what a plan entry marks store-bought to keep today's behavior.
export const bottledSauceIds = (recipe: Recipe | undefined): string[] =>
  recipe ? sauceOptions(recipe).map((o) => o.ingredient.id) : [];

// Whole batches of the sauce recipe that cover `amount` of the bottled ingredient (at least one:
// you make a jar, not a teaspoon).
export function batchesNeeded(ingredientId: string, amount: number, unit: RecipeIngredient['unit']): number {
  const option = HOMEMADE[ingredientId];
  if (!option) return 0;
  const ratio = toBase(amount, unit) / toBase(option.yields.amount, option.yields.unit);
  return Math.max(1, Math.ceil(ratio - 1e-9));
}

export interface CookedSauce extends SauceOption {
  batches: number;
}

// The sauces a plan entry makes from scratch: every option not marked store-bought.
export function saucesToMake(recipe: Recipe, servings: number, storeBought: string[] = []): CookedSauce[] {
  return sauceOptions(recipe)
    .filter((o) => !storeBought.includes(o.ingredient.id))
    .map((o) => {
      const amount = scaleAmount(o.ingredient.amount, recipe.servings, servings);
      return { ...o, batches: batchesNeeded(o.ingredient.id, amount, o.ingredient.unit) };
    });
}

const timesBatches = (ing: RecipeIngredient, batches: number): RecipeIngredient => ({ ...ing, amount: ing.amount * batches });

const sauceStepText = ({ sauce, batches }: CookedSauce, step: string, i: number): string =>
  i === 0 ? `Make the ${sauce.title}${batches > 1 ? ` (${batches} batches)` : ''} first. ${step}` : step;

// The recipe as you'd cook it for `servings`: amounts already scaled (so the result's `servings`
// is `servings`), each from-scratch sauce's ingredients appended and its steps first. The bottled
// ingredient stays listed (it says how much of the homemade sauce to use).
export function recipeAsCooked(recipe: Recipe, servings: number, storeBought: string[] = []): Recipe {
  const sauces = saucesToMake(recipe, servings, storeBought);
  if (sauces.length === 0 && servings === recipe.servings) return recipe;
  const scaled = recipe.ingredients.map((ing) => ({ ...ing, amount: scaleAmount(ing.amount, recipe.servings, servings) }));
  const sauceSteps = sauces.flatMap((s) => s.sauce.steps.map((step, i) => sauceStepText(s, step, i)));
  return {
    ...recipe,
    servings,
    ingredients: [...scaled, ...sauces.flatMap(({ sauce, batches }) => sauce.ingredients.map((i) => timesBatches(i, batches)))],
    steps: [...sauceSteps, ...recipe.steps],
  };
}

export interface CookStep {
  text: string;
  ingredients: RecipeIngredient[]; // already scaled to the servings being cooked
}

// Cooking mode's steps: from-scratch sauces first, then the recipe. Each step's ingredients come
// from its own part only, so garlic in both the sauce and the dish isn't listed twice.
export function cookingSteps(recipe: Recipe, servings: number, storeBought: string[] = []): CookStep[] {
  const main: Recipe = {
    ...recipe,
    servings,
    ingredients: recipe.ingredients.map((ing) => ({ ...ing, amount: scaleAmount(ing.amount, recipe.servings, servings) })),
  };
  const sauceSteps = saucesToMake(recipe, servings, storeBought).flatMap((s) => {
    const batch: Recipe = { ...s.sauce, ingredients: s.sauce.ingredients.map((i) => timesBatches(i, s.batches)) };
    return s.sauce.steps.map((step, i) => ({ text: sauceStepText(s, step, i), ingredients: stepIngredients(batch, step) }));
  });
  return [...sauceSteps, ...main.steps.map((step) => ({ text: step, ingredients: stepIngredients(main, step) }))];
}

// What to shop for: the recipe as cooked, minus the bottled sauces you're making yourself.
export function groceryIngredients(recipe: Recipe, servings: number, storeBought: string[] = []): RecipeIngredient[] {
  const made = new Set(saucesToMake(recipe, servings, storeBought).map((s) => s.ingredient.id));
  return recipeAsCooked(recipe, servings, storeBought).ingredients.filter((i) => !made.has(i.id));
}

// Ingredient ids of every sauce option's from-scratch recipe (for the avoided-ingredients check).
export const homemadeSauceIngredientIds = (recipe: Recipe): string[] =>
  sauceOptions(recipe).flatMap(({ sauce }) => sauce.ingredients.map((i) => i.id));

// Allergen/diet tags of every sauce option's from-scratch ingredients. Allergy and diet checks add
// these to the recipe's own tags, so a recipe is flagged if either the bottled or the homemade
// version conflicts, whichever the user picks later.
export function homemadeSauceTags(recipe: Recipe): Set<IngredientTag> {
  const tags = new Set<IngredientTag>();
  sauceOptions(recipe).forEach(({ sauce }) =>
    sauce.ingredients.forEach((ing) => ingredientById(ing.id)?.tags.forEach((t) => tags.add(t)))
  );
  return tags;
}
