import { MealType, RecipeSource } from '../types';
import { emptyDraft, IngredientDraft, MAX_RECIPE_SERVINGS, RecipeDraft } from './customRecipes';
import { importIngredientLine } from './ingredientLine';

// Importing a recipe from a web page or pasted text (T48). Pure: the page is fetched elsewhere
// (src/services/recipeFetch.ts). Most recipe sites publish schema.org `Recipe` data as JSON-LD.

export interface ImportedRecipe {
  title: string;
  servings: number | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  ingredientLines: string[];
  steps: string[];
  category: string; // recipeCategory / keywords, used to guess the meal type
  author: string;
  siteName: string;
  url: string;
}

// --- Text helpers -------------------------------------------------------------------

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', frac12: '½', frac14: '¼', frac34: '¾',
  deg: '°', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', eacute: 'é', egrave: 'è',
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z0-9]+);/gi, (m, code: string) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? m;
  });
}

// Plain text from a value that may hold HTML ("<p>Mix &amp; stir</p>" → "Mix & stir").
export const cleanText = (s: string): string =>
  decodeEntities(s.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : v === undefined || v === null ? [] : [v]);
const str = (v: unknown): string => (typeof v === 'string' ? cleanText(v) : typeof v === 'number' ? String(v) : '');

// --- JSON-LD ---------------------------------------------------------------------

// Every JSON-LD block on the page that parses; broken ones are skipped.
export function jsonLdBlocks(html: string): unknown[] {
  const out: unknown[] = [];
  const re = /<script[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const body = m[1].replace(/^\s*<!--/, '').replace(/-->\s*$/, '').replace(/^\s*\/\/<!\[CDATA\[/, '').replace(/\/\/\]\]>\s*$/, '');
    try {
      out.push(JSON.parse(body));
    } catch {
      // A site's malformed block shouldn't hide a good one elsewhere on the page.
    }
  }
  return out;
}

const hasType = (node: Record<string, unknown>, type: string): boolean =>
  asArray(node['@type']).some((t) => typeof t === 'string' && t.toLowerCase() === type.toLowerCase());

// Depth-first search for the first node of a schema.org type (through arrays, @graph, mainEntity, …).
export function findNode(data: unknown, type: string, depth = 0): Record<string, unknown> | null {
  if (depth > 8) return null;
  if (Array.isArray(data)) {
    for (const item of data) {
      const hit = findNode(item, type, depth + 1);
      if (hit) return hit;
    }
    return null;
  }
  if (!isObj(data)) return null;
  if (hasType(data, type)) return data;
  for (const value of Object.values(data)) {
    if (typeof value === 'object') {
      const hit = findNode(value, type, depth + 1);
      if (hit) return hit;
    }
  }
  return null;
}

// "PT1H30M" → 90. Null if it isn't an ISO 8601 duration.
export function parseIsoDuration(v: unknown): number | null {
  if (typeof v !== 'string') return null;
  const m = v.trim().match(/^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i);
  if (!m || v.trim().length <= 2) return null;
  const [, d = '0', h = '0', min = '0', s = '0'] = m;
  return Math.round(Number(d) * 1440 + Number(h) * 60 + Number(min) + Number(s) / 60);
}

// recipeYield: 4, "4", "4 servings", ["4", "4 servings"], "Serves 4-6" → 4. A count of servings,
// slices, or people wins over any other number ("1 loaf (10 slices)" → 10).
const SERVING_COUNT = /(?:serves|servings?:?)\s*(\d+)|(\d+)\s*(?:servings?|slices|portions|people|pieces)/i;
export function parseServings(v: unknown): number | null {
  const texts = asArray(v).map(str);
  for (const t of texts) {
    const m = t.match(SERVING_COUNT);
    if (m) return Number(m[1] ?? m[2]);
  }
  for (const t of texts) {
    const m = t.match(/\d+/);
    if (m && Number(m[0]) > 0) return Number(m[0]);
  }
  return null;
}

// Plain text in "Step 1" style lines: a string (maybe several paragraphs), a list of strings,
// HowToStep, HowToSection (its name leads its first step), or an ItemList.
export function parseInstructions(v: unknown): string[] {
  if (typeof v === 'string') {
    return v
      .split(/<\/p>|<\/li>|<br\s*\/?>|\n+/i)
      .map(cleanText)
      .map(stripStepNumber)
      .filter(Boolean);
  }
  if (Array.isArray(v)) return v.flatMap(parseInstructions);
  if (!isObj(v)) return [];
  if (hasType(v, 'HowToSection') || (v.itemListElement && !v.text)) {
    const steps = parseInstructions(v.itemListElement);
    const name = str(v.name);
    return name && steps.length ? [`${name}: ${steps[0]}`, ...steps.slice(1)] : steps;
  }
  const text = str(v.text) || str(v.name);
  return text ? [stripStepNumber(text)] : [];
}

const stripStepNumber = (s: string) => s.replace(/^(?:step\s*)?\d+[.):]\s+/i, '').trim();

function authorName(v: unknown): string {
  const first = asArray(v)[0];
  return isObj(first) ? str(first.name) : str(first);
}

const metaContent = (html: string, property: string): string => {
  const tag = html.match(new RegExp(`<meta[^>]+(?:property|name)\\s*=\\s*["']${property}["'][^>]*>`, 'i'))?.[0];
  return tag ? cleanText(tag.match(/content\s*=\s*["']([^"']*)["']/i)?.[1] ?? '') : '';
};

export function hostName(url: string): string {
  const m = url.match(/^[a-z]+:\/\/([^/?#:]+)/i);
  return m ? m[1].toLowerCase().replace(/^www\./, '') : '';
}

// The site's name for the credit: og:site_name, the JSON-LD WebSite/Organization, or the host.
function siteNameOf(html: string, blocks: unknown[], url: string): string {
  const fromSchema = blocks.map((b) => str(findNode(b, 'WebSite')?.name) || str(findNode(b, 'Organization')?.name)).find(Boolean);
  return metaContent(html, 'og:site_name') || fromSchema || hostName(url) || 'a website';
}

export type ParseResult = { ok: true; recipe: ImportedRecipe } | { ok: false; reason: 'no-recipe' };

// Reads the schema.org Recipe from a page's HTML.
export function parseRecipeHtml(html: string, url: string): ParseResult {
  const blocks = jsonLdBlocks(html);
  const node = blocks.map((b) => findNode(b, 'Recipe')).find((n) => n !== null);
  if (!node) return { ok: false, reason: 'no-recipe' };
  const ingredients = asArray(node.recipeIngredient ?? node.ingredients).map(str).filter(Boolean);
  const recipe: ImportedRecipe = {
    title: str(node.name) || str(node.headline) || metaContent(html, 'og:title'),
    servings: parseServings(node.recipeYield),
    prepMinutes: parseIsoDuration(node.prepTime),
    cookMinutes: parseIsoDuration(node.cookTime) ?? parseIsoDuration(node.totalTime),
    ingredientLines: ingredients,
    steps: parseInstructions(node.recipeInstructions),
    category: [...asArray(node.recipeCategory), ...asArray(node.keywords)].map(str).join(', '),
    author: authorName(node.author),
    siteName: siteNameOf(html, blocks, url),
    url,
  };
  if (!recipe.title && ingredients.length === 0) return { ok: false, reason: 'no-recipe' };
  return { ok: true, recipe };
}

// --- Pasted text -----------------------------------------------------------------------

const INGREDIENTS_HEADING = /^(?:ingredients?|you(?:'|’)ll need|what you need)\s*:?$/i;
const STEPS_HEADING = /^(?:instructions?|directions?|method|steps|preparation|how to make it)\s*:?$/i;
const SERVINGS_LINE = /^(?:serves|servings|yield|yields|makes)\s*:?\s*(\d+)/i;
const STARTS_WITH_AMOUNT = /^(?:\d|[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/;
const bullet = (s: string) => s.replace(/^[-•*·▢]\s*/, '').trim();

// Pasted recipe text: the first line is the title; "Ingredients" / "Instructions" headings split
// the rest. Without headings, lines that start with an amount are ingredients and the rest steps.
export function parseRecipeText(text: string): ImportedRecipe {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let servings: number | null = null;
  const body = lines.filter((l) => {
    const m = l.match(SERVINGS_LINE);
    if (m) servings = Number(m[1]);
    return !m;
  });
  const titleIsHeading = body[0] !== undefined && (INGREDIENTS_HEADING.test(body[0]) || STEPS_HEADING.test(body[0]));
  const title = titleIsHeading ? '' : (body[0] ?? '');
  const rest = titleIsHeading ? body : body.slice(1);
  const ingAt = rest.findIndex((l) => INGREDIENTS_HEADING.test(l));
  const stepsAt = rest.findIndex((l) => STEPS_HEADING.test(l));
  let ingredientLines: string[];
  let steps: string[];
  if (ingAt >= 0 || stepsAt >= 0) {
    const ingEnd = stepsAt > ingAt ? stepsAt : rest.length;
    ingredientLines = ingAt >= 0 ? rest.slice(ingAt + 1, ingEnd) : rest.slice(0, stepsAt).filter((l) => STARTS_WITH_AMOUNT.test(bullet(l)));
    steps = stepsAt >= 0 ? rest.slice(stepsAt + 1, stepsAt > ingAt ? undefined : ingAt) : [];
  } else {
    ingredientLines = rest.filter((l) => STARTS_WITH_AMOUNT.test(bullet(l)) && !/^\d+[.)]\s/.test(l));
    steps = rest.filter((l) => !ingredientLines.includes(l));
  }
  return {
    title,
    servings,
    prepMinutes: null,
    cookMinutes: null,
    ingredientLines: ingredientLines.map(bullet).filter(Boolean),
    steps: steps.map((s) => stripStepNumber(bullet(s))).filter(Boolean),
    category: '',
    author: '',
    siteName: '',
    url: '',
  };
}

// --- Into the editor ------------------------------------------------------------------------

const MEAL_WORDS: [RegExp, MealType][] = [
  [/\b(dessert|cake|cookie|pie|brownie|pudding|sweet)/i, 'dessert'],
  [/\b(breakfast|brunch)/i, 'breakfast'],
  [/\b(side|sauce|dressing|condiment|dip)/i, 'side'],
  [/\b(snack|appetizer|starter)/i, 'snack'],
  [/\blunch/i, 'lunch'],
];

export const guessMealType = (category: string): MealType => MEAL_WORDS.find(([re]) => re.test(category))?.[1] ?? 'dinner';

const EMOJI: Record<MealType, string> = { breakfast: '🍳', lunch: '🥪', dinner: '🍽️', snack: '🥨', side: '🥗', dessert: '🍰' };

export const WEB_LICENSE = 'Saved from the web for your personal use. Stays on this device; not shared.';

// The editor draft for an imported recipe: ingredients matched to the catalog where we can tell
// (free text otherwise), credit kept when it came from a web page.
export function draftFromImport(r: ImportedRecipe, fallbackServings: number): RecipeDraft {
  const mealType = guessMealType(`${r.category} ${r.title}`);
  const servings = Math.min(MAX_RECIPE_SERVINGS, Math.max(1, r.servings ?? fallbackServings));
  const ingredients: IngredientDraft[] = r.ingredientLines.flatMap(importIngredientLine);
  const source: RecipeSource | undefined = r.url
    ? { kind: 'web', title: r.title || 'Untitled recipe', author: r.author, collection: r.siteName || hostName(r.url), url: r.url, license: WEB_LICENSE }
    : undefined;
  return {
    ...emptyDraft(servings),
    title: r.title,
    emoji: EMOJI[mealType],
    mealType,
    prep: r.prepMinutes === null ? '' : String(r.prepMinutes),
    cook: r.cookMinutes === null ? '' : String(r.cookMinutes),
    ingredients,
    steps: r.steps.length ? r.steps : [''],
    ...(source ? { source } : {}),
  };
}

// What the user typed into "Recipe link" as a URL we'll fetch, or null. Only http(s); a bare
// "example.com/recipe" gets https://.
export function normalizeRecipeUrl(input: string): string | null {
  const t = input.trim();
  if (!t || /\s/.test(t)) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(t) ? t : `https://${t}`;
  if (!/^https?:\/\/[^/?#\s]+\.[^/?#\s]+/i.test(withScheme)) return null;
  return withScheme;
}

// How many ingredients matched the catalog (for "8 of 10 ingredients matched").
export const matchedCount = (d: RecipeDraft): number => d.ingredients.filter((i) => !i.custom).length;
