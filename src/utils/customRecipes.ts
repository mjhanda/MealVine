import { EDITOR_ONLY_UNITS, ingredientById, INGREDIENTS } from '../data/ingredients';
import { RECIPES } from '../data/recipes';
import { USER_RECIPE_PREFIX } from '../data/userRecipes';
import { IngredientDef, MealType, Protein, Recipe, RecipeIngredient, RecipeSource, Unit } from '../types';
import { customIngredientId, isCustomIngredient } from './customIngredients';
import { unitFamily, UnitFamily } from './units';

// The recipe editor's pure side (T47): drafts, validation, units, ingredient search.

// --- Units --------------------------------------------------------------------

export const ALL_UNITS: (Unit | null)[] = [null, 'pinch', 'tsp', 'tbsp', 'cup', 'oz', 'lb', 'can', 'clove', 'stalk', 'head', 'bunch', 'slice'];

// Each catalog ingredient is measured in one unit family across the catalog (enforced by the
// catalog test). Your own recipes keep to it, so the grocery list can add amounts together and
// nutrition can convert them.
let unitCounts: Map<string, Map<Unit | null, number>> | null = null;
function catalogUnits(ingredientId: string): Map<Unit | null, number> | undefined {
  if (!unitCounts) {
    unitCounts = new Map();
    RECIPES.forEach((r) =>
      r.ingredients.forEach((ing) => {
        const counts = unitCounts!.get(ing.id) ?? new Map<Unit | null, number>();
        counts.set(ing.unit, (counts.get(ing.unit) ?? 0) + 1);
        unitCounts!.set(ing.id, counts);
      })
    );
    Object.entries(EDITOR_ONLY_UNITS).forEach(([id, unit]) => unitCounts!.set(id, new Map([[unit, 1]])));
  }
  return unitCounts.get(ingredientId);
}

export function catalogUnitFamily(ingredientId: string): UnitFamily | undefined {
  const counts = catalogUnits(ingredientId);
  return counts ? unitFamily([...counts.keys()][0]) : undefined;
}

// Units the editor offers for an ingredient: its family for catalog ingredients, anything for free text.
export function allowedUnits(ingredientId: string): (Unit | null)[] {
  const family = isCustomIngredient({ id: ingredientId }) ? undefined : catalogUnitFamily(ingredientId);
  return family ? ALL_UNITS.filter((u) => unitFamily(u) === family) : ALL_UNITS;
}

// The unit a newly picked ingredient starts with: the current one if it still fits, else the one
// our recipes use most for it (cups of lentils, tbsp of oil), else the first allowed.
export function defaultUnit(ingredientId: string, current: Unit | null = null): Unit | null {
  const allowed = allowedUnits(ingredientId);
  if (allowed.includes(current)) return current;
  const counts = catalogUnits(ingredientId);
  if (counts) return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  return allowed[0];
}

// --- Amounts ------------------------------------------------------------------

const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 1 / 2, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 1 / 4, '¾': 3 / 4, '⅕': 1 / 5, '⅖': 2 / 5, '⅗': 3 / 5, '⅘': 4 / 5,
  '⅙': 1 / 6, '⅚': 5 / 6, '⅛': 1 / 8, '⅜': 3 / 8, '⅝': 5 / 8, '⅞': 7 / 8,
};
export const FRACTION_CHARS = Object.keys(UNICODE_FRACTIONS).join('');

// One quantity: "2", "1.5", "1/2", "1 1/2", "½", "1½".
function parseSingle(text: string): number | null {
  const t = text.trim().replace(new RegExp(`([${FRACTION_CHARS}])`, 'g'), ' $1').trim();
  const parts = t.split(/\s+/);
  let total = 0;
  for (const part of parts) {
    if (UNICODE_FRACTIONS[part] !== undefined) total += UNICODE_FRACTIONS[part];
    else if (/^\d+\/\d+$/.test(part)) {
      const [n, d] = part.split('/').map(Number);
      if (d === 0) return null;
      total += n / d;
    } else if (/^\d*\.?\d+$/.test(part)) total += Number(part);
    else return null;
  }
  return parts.length ? total : null;
}

// An amount as typed or written in a recipe. Ranges ("2-3", "2 to 3") use the larger amount
// (better a little extra on the grocery list than too little). Null if it isn't a number.
export function parseAmount(text: string): number | null {
  const t = text.trim();
  if (!t) return null;
  const range = t.split(/\s*(?:-|–|—|\bto\b|\bor\b)\s*/);
  const values = range.map(parseSingle);
  if (values.some((v) => v === null)) return null;
  const max = Math.max(...(values as number[]));
  return max > 0 ? max : null;
}

// Fractions cooks write, for the editor's amount field. parseAmount reads them back.
const TEXT_FRACTIONS: [number, string][] = [
  [1 / 8, '1/8'], [1 / 4, '1/4'], [1 / 3, '1/3'], [3 / 8, '3/8'], [1 / 2, '1/2'],
  [5 / 8, '5/8'], [2 / 3, '2/3'], [3 / 4, '3/4'], [7 / 8, '7/8'],
];
const FRACTION_TOLERANCE = 0.002; // 0.333 and 0.3333 are both a third

// An amount for an editable text field: "2", "1/3", "1 1/4"; anything else as a short decimal
// ("0.4", never "1.4999999").
export function amountText(n: number): string {
  let whole = Math.floor(n);
  let rest = n - whole;
  if (1 - rest < FRACTION_TOLERANCE) {
    whole += 1;
    rest = 0;
  }
  if (rest < FRACTION_TOLERANCE) return String(whole);
  const fraction = TEXT_FRACTIONS.find(([v]) => Math.abs(v - rest) < FRACTION_TOLERANCE)?.[1];
  if (!fraction) return String(Math.round(n * 1000) / 1000);
  return whole ? `${whole} ${fraction}` : fraction;
}

// --- Drafts -------------------------------------------------------------------

export interface IngredientDraft {
  key: string; // stable React key while editing
  id: string; // catalog id, or custom:<slug>
  custom?: string; // free-text name
  amount: string;
  unit: Unit | null;
  prep: string;
}

export interface RecipeDraft {
  id?: string; // set when editing an existing recipe
  title: string;
  emoji: string;
  mealType: MealType;
  servings: number;
  prep: string; // minutes, as typed
  cook: string;
  protein: Protein | null; // null = work it out from the ingredients
  ingredients: IngredientDraft[];
  steps: string[];
  source?: RecipeSource;
}

export const DEFAULT_EMOJI = '🍽️';
export const MAX_RECIPE_SERVINGS = 24;

let draftKeyCounter = 0;
export const newDraftKey = (): string => `ing-${Date.now().toString(36)}-${draftKeyCounter++}`;

export function emptyDraft(servings = 2): RecipeDraft {
  return { title: '', emoji: DEFAULT_EMOJI, mealType: 'dinner', servings, prep: '', cook: '', protein: null, ingredients: [], steps: [''] };
}

export function ingredientDraft(ing: RecipeIngredient): IngredientDraft {
  return { key: newDraftKey(), id: ing.id, custom: ing.custom, amount: amountText(ing.amount), unit: ing.unit, prep: ing.prep ?? '' };
}

export function draftFromRecipe(recipe: Recipe): RecipeDraft {
  return {
    id: recipe.id,
    title: recipe.title,
    emoji: recipe.emoji,
    mealType: recipe.mealType,
    servings: recipe.servings,
    prep: String(recipe.prep),
    cook: String(recipe.cook),
    protein: recipe.proteinAuto ? null : recipe.protein,
    ingredients: recipe.ingredients.map(ingredientDraft),
    steps: recipe.steps.length ? [...recipe.steps] : [''],
    source: recipe.source,
  };
}

// Swaps the ingredient on a draft line (catalog pick or free text), keeping the amount and prep
// and moving the unit into the new ingredient's family if it has to.
export function withIngredient(line: IngredientDraft, pick: { id: string } | { custom: string }): IngredientDraft {
  if ('custom' in pick) {
    const name = pick.custom.trim();
    return { ...line, id: customIngredientId(name), custom: name };
  }
  const { custom: _dropped, ...rest } = line;
  return { ...rest, id: pick.id, unit: defaultUnit(pick.id, line.unit) };
}

const minutes = (text: string): number | null => {
  const t = text.trim();
  if (!t) return 0;
  return /^\d+$/.test(t) ? Number(t) : null;
};

// Problems that block saving, in plain words. Empty = OK to save.
export function validateDraft(d: RecipeDraft): string[] {
  const errors: string[] = [];
  if (!d.title.trim()) errors.push('Give your recipe a name.');
  if (d.servings < 1 || d.servings > MAX_RECIPE_SERVINGS || !Number.isInteger(d.servings)) {
    errors.push(`Servings must be a whole number from 1 to ${MAX_RECIPE_SERVINGS}.`);
  }
  if (minutes(d.prep) === null || minutes(d.cook) === null) errors.push('Prep and cook times are whole minutes.');
  if (d.ingredients.length === 0) errors.push('Add at least one ingredient.');
  d.ingredients.forEach((ing) => {
    const name = ing.custom ?? ingredientById(ing.id)?.name ?? ing.id;
    if (isCustomIngredient(ing) && !ing.custom?.trim()) errors.push('An ingredient is missing its name.');
    else if (!isCustomIngredient(ing) && !ingredientById(ing.id)) errors.push(`${name} isn't in the ingredient list.`);
    if (parseAmount(ing.amount) === null) errors.push(`Enter an amount for ${name} (like 2, 1.5, or 1 1/2).`);
    if (!allowedUnits(ing.id).includes(ing.unit)) errors.push(`${name} can't be measured in ${ing.unit ?? 'a count'}.`);
  });
  if (!d.steps.some((s) => s.trim())) errors.push('Add at least one step.');
  return errors;
}

const PROTEIN_BY_TAG: [IngredientDef['tags'][number], Protein][] = [
  ['fish', 'fish'],
  ['shellfish', 'fish'],
  ['pork', 'pork'],
  ['red-meat', 'beef'],
  ['poultry', 'chicken'],
];

// The recipe card's protein label, worked out from catalog ingredients' tags.
export function deriveProtein(ingredients: Pick<RecipeIngredient, 'id'>[]): Protein {
  const tags = new Set(ingredients.flatMap((i) => INGREDIENTS[i.id]?.tags ?? []));
  return PROTEIN_BY_TAG.find(([tag]) => tags.has(tag))?.[1] ?? 'vegetarian';
}

let idCounter = 0;
export const newUserRecipeId = (now: number = Date.now()): string => `${USER_RECIPE_PREFIX}${now.toString(36)}-${idCounter++}`;

function toIngredient(line: IngredientDraft): RecipeIngredient {
  const base: RecipeIngredient = { id: line.id, amount: parseAmount(line.amount) ?? 1, unit: line.unit };
  const withName = isCustomIngredient(line) ? { ...base, custom: line.custom?.trim() } : base;
  return line.prep.trim() ? { ...withName, prep: line.prep.trim() } : withName;
}

// A validated draft as a Recipe. `id` is the draft's own (editing) or a new user id.
export function recipeFromDraft(d: RecipeDraft, id: string = d.id ?? newUserRecipeId()): Recipe {
  const ingredients = d.ingredients.map(toIngredient);
  const recipe: Recipe = {
    id,
    title: d.title.trim(),
    mealType: d.mealType,
    protein: d.protein ?? deriveProtein(ingredients),
    prep: minutes(d.prep) ?? 0,
    cook: minutes(d.cook) ?? 0,
    servings: d.servings,
    emoji: d.emoji.trim() || DEFAULT_EMOJI,
    ingredients,
    steps: d.steps.map((s) => s.trim()).filter(Boolean),
  };
  if (d.protein === null) recipe.proteinAuto = true;
  return d.source ? { ...recipe, source: d.source } : recipe;
}

// --- Ingredient search ----------------------------------------------------------

const ALL_DEFS = Object.values(INGREDIENTS);

// Catalog ingredients whose name or plural contains the query; names that start with it first.
export function searchIngredients(query: string, limit = 8): IngredientDef[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const names = (d: IngredientDef) => [d.name.toLowerCase(), (d.plural ?? '').toLowerCase()];
  const hits = ALL_DEFS.filter((d) => names(d).some((n) => n.includes(q)));
  const rank = (d: IngredientDef) => (names(d).some((n) => n === q) ? 0 : names(d).some((n) => n.startsWith(q)) ? 1 : 2);
  return hits.sort((a, b) => rank(a) - rank(b) || a.name.length - b.name.length || a.name.localeCompare(b.name)).slice(0, limit);
}
