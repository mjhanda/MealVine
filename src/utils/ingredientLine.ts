import { ingredientById, INGREDIENTS } from '../data/ingredients';
import { Unit } from '../types';
import { customIngredientId } from './customIngredients';
import { allowedUnits, amountText, defaultUnit, FRACTION_CHARS, IngredientDraft, newDraftKey, parseAmount } from './customRecipes';
import { formatQuantity } from './units';

// Imported ingredient lines (T48): "1 1/2 cups all-purpose flour, sifted" → amount, unit, name,
// prep, and the catalog ingredient it is (if we can tell). Anything we can't match stays free text.

// --- Units ----------------------------------------------------------------------

// Words for units we use directly, plus common ones converted into ours (metric, quarts, dashes).
// Case matters only for "T" (tablespoon) vs "t" (teaspoon).
const UNIT_WORDS: Record<string, { unit: Unit; factor: number }> = {
  pinch: { unit: 'pinch', factor: 1 }, pinches: { unit: 'pinch', factor: 1 },
  dash: { unit: 'pinch', factor: 2 }, dashes: { unit: 'pinch', factor: 2 },
  teaspoon: { unit: 'tsp', factor: 1 }, teaspoons: { unit: 'tsp', factor: 1 }, tsp: { unit: 'tsp', factor: 1 }, tsps: { unit: 'tsp', factor: 1 }, t: { unit: 'tsp', factor: 1 },
  tablespoon: { unit: 'tbsp', factor: 1 }, tablespoons: { unit: 'tbsp', factor: 1 }, tbsp: { unit: 'tbsp', factor: 1 }, tbsps: { unit: 'tbsp', factor: 1 },
  tbs: { unit: 'tbsp', factor: 1 }, tbl: { unit: 'tbsp', factor: 1 }, T: { unit: 'tbsp', factor: 1 },
  cup: { unit: 'cup', factor: 1 }, cups: { unit: 'cup', factor: 1 }, c: { unit: 'cup', factor: 1 },
  pint: { unit: 'cup', factor: 2 }, pints: { unit: 'cup', factor: 2 }, pt: { unit: 'cup', factor: 2 },
  quart: { unit: 'cup', factor: 4 }, quarts: { unit: 'cup', factor: 4 }, qt: { unit: 'cup', factor: 4 },
  ml: { unit: 'tsp', factor: 0.202884 }, milliliter: { unit: 'tsp', factor: 0.202884 }, milliliters: { unit: 'tsp', factor: 0.202884 },
  l: { unit: 'cup', factor: 4.22675 }, liter: { unit: 'cup', factor: 4.22675 }, liters: { unit: 'cup', factor: 4.22675 }, litre: { unit: 'cup', factor: 4.22675 }, litres: { unit: 'cup', factor: 4.22675 },
  oz: { unit: 'oz', factor: 1 }, ounce: { unit: 'oz', factor: 1 }, ounces: { unit: 'oz', factor: 1 },
  lb: { unit: 'lb', factor: 1 }, lbs: { unit: 'lb', factor: 1 }, pound: { unit: 'lb', factor: 1 }, pounds: { unit: 'lb', factor: 1 },
  g: { unit: 'oz', factor: 0.035274 }, gram: { unit: 'oz', factor: 0.035274 }, grams: { unit: 'oz', factor: 0.035274 },
  kg: { unit: 'lb', factor: 2.20462 }, kilogram: { unit: 'lb', factor: 2.20462 }, kilograms: { unit: 'lb', factor: 2.20462 },
  can: { unit: 'can', factor: 1 }, cans: { unit: 'can', factor: 1 },
  clove: { unit: 'clove', factor: 1 }, cloves: { unit: 'clove', factor: 1 },
  stalk: { unit: 'stalk', factor: 1 }, stalks: { unit: 'stalk', factor: 1 },
  head: { unit: 'head', factor: 1 }, heads: { unit: 'head', factor: 1 },
  bunch: { unit: 'bunch', factor: 1 }, bunches: { unit: 'bunch', factor: 1 },
  slice: { unit: 'slice', factor: 1 }, slices: { unit: 'slice', factor: 1 },
};
// Units that also come after the name: "2 garlic cloves", "3 celery stalks".
const TRAILING_UNITS = new Set(['clove', 'cloves', 'stalk', 'stalks', 'head', 'heads', 'bunch', 'bunches', 'slice', 'slices']);

function unitFor(word: string | undefined): { unit: Unit; factor: number } | undefined {
  if (!word) return undefined;
  const w = word.replace(/\.$/, '');
  if (w === 'T' || w === 't') return UNIT_WORDS[w];
  return UNIT_WORDS[w.toLowerCase()];
}

// --- Parsing --------------------------------------------------------------------

export interface ParsedLine {
  amount: number | null; // null = not given ("salt to taste")
  unit: Unit | null;
  name: string;
  prep: string;
  quantityText: string; // the amount and unit as written, e.g. "1 lb"
}

const AMOUNT_TOKEN = new RegExp(`^(?:\\d+(?:[./]\\d+)?|\\.\\d+|[${FRACTION_CHARS}]|\\d+[${FRACTION_CHARS}]|-|–|to)$`);

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

export function parseIngredientLine(raw: string): ParsedLine {
  // "1 (15 oz) can beans" → the can is the unit; bullets and parentheticals aren't part of the name.
  const line = clean(raw.replace(/^[-•*·▢]\s*/, '').replace(/\([^)]*\)/g, ' ').replace(/\bfl\.?\s*oz\b/gi, 'floz'));
  const tokens = line.replace(new RegExp(`(\\d)([${FRACTION_CHARS}])`, 'g'), '$1 $2').replace(/(\d)-(\d)/g, '$1 - $2').split(' ');
  let i = 0;
  while (i < tokens.length && AMOUNT_TOKEN.test(tokens[i])) i++;
  // A trailing "-" or "to" belongs to the name, not the amount.
  while (i > 0 && /^(-|–|to)$/.test(tokens[i - 1])) i--;
  let amount = i > 0 ? parseAmount(tokens.slice(0, i).join(' ')) : null;
  // "Pinch of salt", "dash of hot sauce": the unit word is the amount.
  if (i === 0 && /^(pinch|dash)$/i.test(tokens[0] ?? '') && tokens.length > 1) amount = 1;
  let unit: Unit | null = null;
  let quantity = tokens.slice(0, i);
  const fluid = tokens[i]?.toLowerCase() === 'floz';
  const u = fluid ? { unit: 'tbsp' as Unit, factor: 2 } : unitFor(tokens[i]);
  if (u && amount !== null) {
    unit = u.unit;
    amount *= u.factor;
    quantity = [...quantity, fluid ? 'fl oz' : tokens[i]];
    i++;
  }
  const rest = tokens.slice(i).join(' ').replace(/^of\s+/i, '');
  const comma = rest.indexOf(',');
  let name = clean(comma >= 0 ? rest.slice(0, comma) : rest);
  const prep = clean(comma >= 0 ? rest.slice(comma + 1) : '');
  const nameWords = name.split(' ');
  const last = nameWords[nameWords.length - 1]?.toLowerCase();
  if (unit === null && amount !== null && nameWords.length > 1 && TRAILING_UNITS.has(last)) {
    unit = UNIT_WORDS[last].unit;
    name = nameWords.slice(0, -1).join(' ');
    quantity = [...quantity, last];
  }
  return { amount, unit, name, prep, quantityText: quantity.join(' ') };
}

// --- Catalog matching ----------------------------------------------------------------

// Words that don't change which ingredient it is ("2 large eggs", "extra-virgin olive oil").
// Removed from both the line and catalog names before comparing.
const DESCRIPTORS = new Set([
  'a', 'an', 'the', 'of', 'and', 'or', 'to', 'for', 'about', 'plus', 'more', 'optional', 'divided', 'taste',
  'fresh', 'freshly', 'dried', 'ground', 'large', 'medium', 'small', 'extra', 'virgin', 'boneless', 'skinless',
  'kosher', 'sea', 'fine', 'coarse', 'granulated', 'packed', 'light', 'low', 'sodium', 'reduced', 'lean', 'plain',
  'toasted', 'unsalted', 'salted', 'whole', 'raw', 'ripe', 'organic', 'shredded', 'grated', 'sliced', 'diced',
  'chopped', 'minced', 'peeled', 'cooked', 'uncooked', 'prepared', 'frozen', 'canned', 'can', 'jar', 'sharp',
  'pure', 'unsweetened', 'fillet', 'deli', 'thinly', 'finely', 'roughly', 'coarsely', 'room', 'temperature',
  'crumbled', 'melted', 'softened', 'beaten', 'mashed', 'sifted', 'cubed', 'halved', 'quartered', 'drained', 'rinsed',
  // Kinds of the same product, and counts written into the name ("slices bread", "store-bought").
  'store', 'bought', 'storebought', 'homemade', 'stale', 'day', 'old', 'slice', 'piece',
]);

// Common names that don't line up word-for-word with a catalog name (keys are normalized cores).
const ALIASES: Record<string, string> = {
  onion: 'yellow-onion',
  scallion: 'green-onion',
  'spring onion': 'green-onion',
  egg: 'eggs',
  flour: 'all-purpose-flour',
  pepper: 'black-pepper',
  'chicken stock': 'chicken-broth',
  'vegetable stock': 'vegetable-broth',
  'ground turkey': 'ground-turkey',
  'ground chicken': 'ground-chicken',
  feta: 'feta',
  mozzarella: 'mozzarella',
  'mozzarella cheese': 'mozzarella',
  cheddar: 'cheddar',
  'cheddar cheese': 'cheddar',
  parmesan: 'parmesan',
  'parmesan cheese': 'parmesan',
  'parmigiano reggiano': 'parmesan',
  'gruyere': 'gruyere',
  'ricotta cheese': 'ricotta',
  pea: 'green-peas',
  'green pea': 'green-peas',
  spaghetti: 'pasta',
  penne: 'pasta',
  linguine: 'pasta',
  fettuccine: 'pasta',
  rigatoni: 'pasta',
  macaroni: 'pasta',
  rice: 'white-rice',
  'white rice': 'white-rice',
  'vanilla': 'vanilla-extract',
  'confectioner sugar': 'powdered-sugar',
  'icing sugar': 'powdered-sugar',
  'baking cocoa': 'cocoa-powder',
  'cocoa': 'cocoa-powder',
  'bread crumb': 'breadcrumbs',
  breadcrumb: 'breadcrumbs',
  panko: 'breadcrumbs',
  'panko breadcrumb': 'breadcrumbs',
  'panko bread crumb': 'breadcrumbs',
  bread: 'white-bread',
  'sandwich bread': 'white-bread',
  'yellow mustard': 'mustard',
  'brown mustard': 'mustard',
  'spicy brown mustard': 'mustard',
  'deli mustard': 'mustard',
};

const stem = (w: string): string => {
  if (/(oes|ches|shes|sses|xes)$/.test(w)) return w.slice(0, -2);
  if (/ies$/.test(w) && w.length > 4) return `${w.slice(0, -3)}y`;
  if (/[^s]s$/.test(w) && w.length > 3) return w.slice(0, -1);
  return w;
};

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const allWords = (s: string): string[] => fold(s).replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean).map(stem);
const core = (s: string): string[] => [...new Set(allWords(s).filter((w) => !DESCRIPTORS.has(w)))].sort();
// Catalog names carry notes we don't compare: "Black beans (15 oz can)", "Shrimp, peeled".
const catalogBase = (name: string) => name.replace(/\([^)]*\)/g, ' ').replace(/,.*$/, '');

interface CatalogEntry {
  id: string;
  core: string;
  words: Set<string>;
  size: number;
}
let catalog: CatalogEntry[] | null = null;
const catalogEntries = (): CatalogEntry[] =>
  (catalog ??= Object.values(INGREDIENTS).flatMap((d) =>
    [d.name, d.plural].filter((n): n is string => !!n).map((n) => {
      const words = allWords(catalogBase(n));
      return { id: d.id, core: core(catalogBase(n)).join(' '), words: new Set(words), size: words.length };
    })
  ));

// The catalog ingredient a name means, or null. Conservative on purpose: the two must have the same
// identifying words (descriptors aside), so "peanut butter" never matches "butter" and "garlic
// powder" never matches "garlic". Ties go to the name sharing the most words, then the shorter one.
// Aliases match the words as written ("ground turkey"), or, for aliases without descriptors, the
// identifying words in any order ("shredded mozzarella cheese" → "mozzarella cheese").
const ALIAS_PLAIN = new Map(Object.entries(ALIASES).map(([k, v]) => [allWords(k).join(' '), v]));
const ALIAS_CORE = new Map(
  Object.entries(ALIASES)
    .filter(([k]) => allWords(k).every((w) => !DESCRIPTORS.has(w)))
    .map(([k, v]) => [core(k).join(' '), v])
);

export function matchIngredient(name: string): string | null {
  const key = core(name).join(' ');
  if (!key) return null;
  const words = allWords(name);
  const plain = ALIAS_PLAIN.get(words.join(' '));
  if (plain) return plain;
  const overlap = (e: CatalogEntry) => words.filter((w) => e.words.has(w)).length;
  const [best, next] = catalogEntries()
    .filter((e) => e.core === key)
    .sort((a, b) => overlap(b) - overlap(a) || a.size - b.size || a.id.localeCompare(b.id));
  // A clear winner ("fresh mozzarella"); otherwise the usual meaning ("mozzarella" → shredded).
  const clear = best && (!next || next.id === best.id || overlap(best) > overlap(next));
  return (clear ? best.id : ALIAS_CORE.get(key) ?? best?.id) ?? null;
}

// --- Into the editor ---------------------------------------------------------------------

const joinPrep = (...parts: string[]) => parts.filter(Boolean).join(', ');

const TO_TASTE = /,?\s*\bto taste\b/i;

// One parsed line as an editor row. Matched lines use the catalog ingredient; a unit that doesn't
// fit it (a weight for something we measure by the cup) leaves the amount blank for the user, with
// the original quantity in the prep note. Unmatched lines stay free text, as written.
function draftLine(p: ParsedLine, toTaste: string): IngredientDraft {
  const id = matchIngredient(p.name);
  const amount = p.amount === null ? '1' : amountText(p.amount);
  if (!id) {
    const unit = p.amount === null ? null : p.unit;
    return { key: newDraftKey(), id: customIngredientId(p.name), custom: p.name, amount, unit, prep: joinPrep(p.prep, toTaste) };
  }
  if (p.amount !== null && !allowedUnits(id).includes(p.unit)) {
    const note = `${p.quantityText} in the original`;
    return { key: newDraftKey(), id, amount: '', unit: defaultUnit(id), prep: joinPrep(p.prep, note) };
  }
  const unit = p.amount === null ? defaultUnit(id, 'pinch') : p.unit;
  return { key: newDraftKey(), id, amount, unit, prep: joinPrep(p.prep, toTaste) };
}

// An imported ingredient line as editor rows (usually one). "Salt and pepper to taste" becomes
// two rows when both halves are catalog ingredients.
export function importIngredientLine(raw: string): IngredientDraft[] {
  const toTaste = TO_TASTE.test(raw) ? 'to taste' : '';
  const p = parseIngredientLine(raw.replace(TO_TASTE, ''));
  if (!p.name) return [];
  const pair = p.amount === null ? p.name.split(/\s+and\s+/i) : [];
  if (pair.length === 2 && !matchIngredient(p.name) && pair.every((n) => matchIngredient(n))) {
    return pair.map((name) => draftLine({ ...p, name }, toTaste));
  }
  return [draftLine(p, toTaste)];
}

// For tests and the editor: "2 cups flour" style description of a draft line.
export const describeDraftLine = (d: IngredientDraft): string =>
  `${d.amount ? formatQuantity(parseAmount(d.amount) ?? 0, d.unit) : '?'} ${ingredientById(d.id)?.name ?? d.custom ?? d.id}`;
