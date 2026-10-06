import { ingredientById } from '../data/ingredients';
import { Recipe, RecipeIngredient } from '../types';

// "simmer 15 minutes", "bake 20–25 min", "cook 1 hour", "3-4 minutes per side" → minutes for a timer.
// Ranges use the upper bound (better to check early than to burn). Returns null when there's no time.
const DURATION = /(\d+(?:\.\d+)?)(?:\s*(?:–|-|to)\s*(\d+(?:\.\d+)?))?\s*(minutes?|mins?|hours?|hrs?)\b/i;

export function stepMinutes(step: string): number | null {
  const m = step.match(DURATION);
  if (!m) return null;
  const value = Number(m[2] ?? m[1]);
  const minutes = /^h/i.test(m[3]) ? value * 60 : value;
  return minutes > 0 ? Math.round(minutes) : null;
}

const words = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);

// Descriptors that don't identify an ingredient on their own.
const STOP = new Set([
  'fresh', 'plain', 'large', 'whole', 'wheat', 'grain', 'shredded', 'grated', 'cooked', 'light', 'low', 'sodium',
  'dried', 'ground', 'toasted', 'lean', 'mixed', 'baby', 'red', 'green', 'yellow', 'white', 'black', 'dark', 'or',
  'and', 'with', 'in', 'of', 'the', 'can', 'pouch', 'microwave', 'alternative', 'fillets', 'breast', 'sliced', 'deli',
]);
const CHEESES = new Set(['cheddar', 'mozzarella', 'fresh-mozzarella', 'parmesan', 'feta', 'ricotta', 'cottage-cheese', 'cream-cheese']);

const baseName = (id: string) => (ingredientById(id)?.name ?? '').toLowerCase().replace(/\s*\(.*\)/, '').replace(/,.*$/, '');
const significant = (id: string) => words(baseName(id)).filter((w) => w.length > 2 && !STOP.has(w));
const variants = (w: string) => [w, `${w}s`, `${w}es`, w.replace(/s$/, '')];

// Terms that identify an ingredient in prose: its full name/plural, plus any distinctive word of
// its name that no other ingredient in the same recipe shares ("Chicken breast" → "chicken"),
// plus "cheese" when it's the recipe's only cheese.
function matchTerms(ing: RecipeIngredient, recipe: Recipe): string[] {
  const def = ingredientById(ing.id);
  if (!def) return [];
  const others = recipe.ingredients.filter((o) => o.id !== ing.id);
  const otherWords = new Set(others.flatMap((o) => significant(o.id)));
  const names = [baseName(ing.id), (def.plural ?? '').toLowerCase()].filter(Boolean);
  const distinctive = significant(ing.id).filter((w) => !otherWords.has(w)).flatMap(variants);
  const onlyCheese = CHEESES.has(ing.id) && !others.some((o) => CHEESES.has(o.id)) ? ['cheese'] : [];
  return [...names, ...distinctive, ...onlyCheese];
}

// Recipe ingredients mentioned in a step's text, in recipe order.
export function stepIngredients(recipe: Recipe, step: string): RecipeIngredient[] {
  const text = ` ${words(step).join(' ')} `;
  return recipe.ingredients.filter((ing) =>
    matchTerms(ing, recipe).some((term) => text.includes(` ${words(term).join(' ')} `))
  );
}

// "4:05" for a countdown.
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
