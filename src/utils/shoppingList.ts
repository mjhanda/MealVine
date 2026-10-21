import { INGREDIENTS } from '../data/ingredients';
import { aisleOrder } from '../theme';
import { Aisle, GroceryLine, GroceryUse, ManualGroceryItem, PantryOverride } from '../types';
import { NOT_CHECKED_NOTE } from './customIngredients';
import { sortForShopping } from './grocery';
import { recipeById } from './recipeCatalog';
import { formatQuantity, fromBase, toBase, unitFamily } from './units';

// One planned meal that needs a grocery item. Entries of the same recipe are combined ("×2").
export interface MealUse {
  recipeId: string;
  planItemId: string; // the first entry, for opening the recipe at that entry's servings
  title: string;
  count: number;
  quantity: string;
}

export interface ShoppingRow {
  key: string;
  name: string;
  quantity: string | null; // null for manual items
  checked: boolean;
  ingredientId?: string;
  manualId?: string;
  meals: MealUse[]; // empty for manual items
  note?: string; // e.g. "Not checked for allergies" for a free-text ingredient
}

// Groups a line's per-entry uses by recipe (plan order kept), summing amounts within the unit family.
export function mealUses(uses: GroceryUse[]): MealUse[] {
  const byRecipe = new Map<string, { first: GroceryUse; count: number; base: number }>();
  uses.forEach((use) => {
    const group = byRecipe.get(use.recipeId);
    if (group) {
      group.count += 1;
      group.base += toBase(use.amount, use.unit);
    } else {
      byRecipe.set(use.recipeId, { first: use, count: 1, base: toBase(use.amount, use.unit) });
    }
  });
  return Array.from(byRecipe.values()).map(({ first, count, base }) => {
    const total = fromBase(base, unitFamily(first.unit), first.unit);
    return {
      recipeId: first.recipeId,
      planItemId: first.planItemId,
      title: recipeById(first.recipeId)?.title ?? 'Removed recipe',
      count,
      quantity: formatQuantity(total.amount, total.unit),
    };
  });
}

export const mealName = (meal: Pick<MealUse, 'title' | 'count'>): string =>
  meal.count > 1 ? `${meal.title} ×${meal.count}` : meal.title;

// One-line subtitle: up to two meal names, then "+ N more".
export function mealSummary(meals: MealUse[]): string {
  const names = meals.slice(0, 2).map(mealName).join(', ');
  const rest = meals.length - 2;
  return rest > 0 ? `${names} + ${rest} more` : names;
}

// For screen readers: "Shrimp Scampi and Lemon Salmon", "A, B, and C".
export function mealsSpoken(meals: MealUse[]): string {
  const names = meals.map(mealName);
  if (names.length <= 2) return names.join(' and ');
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

// "Garlic, 5 cloves, for Shrimp Scampi and Lemon Salmon"
export function rowAccessibilityLabel(row: Pick<ShoppingRow, 'name' | 'quantity' | 'meals' | 'note'>): string {
  const parts = [row.name];
  if (row.quantity) parts.push(row.quantity);
  if (row.note) parts.push(row.note);
  if (row.meals.length > 0) parts.push(`for ${mealsSpoken(row.meals)}`);
  return parts.join(', ');
}

export interface ShoppingSection {
  aisle: Aisle;
  rows: ShoppingRow[];
}

export interface ShoppingList {
  sections: ShoppingSection[]; // only non-empty aisles, in store-walk order
  pantry: ShoppingRow[]; // staples and "I have this" items, collapsed in the UI
  total: number; // excludes pantry
  checkedCount: number; // excludes pantry
}

export function isInPantry(line: Pick<GroceryLine, 'ingredientId' | 'staple'>, pantry: Record<string, PantryOverride>): boolean {
  const override = pantry[line.ingredientId];
  if (override) return override === 'have';
  return line.staple;
}

interface Input {
  lines: GroceryLine[];
  manualItems: ManualGroceryItem[];
  checked: Record<string, boolean>;
  pantry: Record<string, PantryOverride>;
  manualKey: (id: string) => string;
}

export function buildShoppingList({ lines, manualItems, checked, pantry, manualKey }: Input): ShoppingList {
  const recipeRow = (l: GroceryLine): ShoppingRow => ({
    key: l.key,
    name: l.name,
    quantity: formatQuantity(l.amount, l.unit),
    checked: !!checked[l.key],
    ingredientId: l.ingredientId,
    meals: mealUses(l.uses),
    ...(l.unverified ? { note: NOT_CHECKED_NOTE } : {}),
  });
  const manualRow = (m: ManualGroceryItem): ShoppingRow => {
    const key = manualKey(m.id);
    return { key, name: m.name, quantity: null, checked: !!checked[key], manualId: m.id, meals: [] };
  };

  const toBuy = lines.filter((l) => !isInPantry(l, pantry));
  const pantryRows = lines
    .filter((l) => isInPantry(l, pantry))
    .map(recipeRow)
    .sort((a, b) => a.name.localeCompare(b.name));

  const sections = aisleOrder
    .map((aisle) => ({
      aisle,
      rows: sortForShopping(
        [...toBuy.filter((l) => l.aisle === aisle).map(recipeRow), ...manualItems.filter((m) => m.aisle === aisle).map(manualRow)],
        checked
      ),
    }))
    .filter((s) => s.rows.length > 0);

  const all = sections.flatMap((s) => s.rows);
  return { sections, pantry: pantryRows, total: all.length, checkedCount: all.filter((r) => r.checked).length };
}

// Everything on the list is checked (pantry rows don't count). An empty list is never "done".
export function isAllPickedUp(list: Pick<ShoppingList, 'total' | 'checkedCount'>): boolean {
  return list.total > 0 && list.checkedCount === list.total;
}

// Plain text for the share sheet: unchecked items only, grouped by aisle.
export function formatShareText(list: ShoppingList): string {
  const blocks = list.sections
    .map((s) => ({ aisle: s.aisle, rows: s.rows.filter((r) => !r.checked) }))
    .filter((s) => s.rows.length > 0)
    .map((s) => [s.aisle.toUpperCase(), ...s.rows.map((r) => `- ${r.name}${r.quantity ? ` (${r.quantity})` : ''}`)].join('\n'));
  return ['Grocery list', ...blocks].join('\n\n');
}

// Keyword fallbacks for things that aren't recipe ingredients.
const AISLE_KEYWORDS: [RegExp, Aisle][] = [
  [/\b(soap|detergent|paper towel|toilet|tissue|foil|plastic wrap|trash|bag|sponge|bleach|batter(y|ies)|light ?bulb|napkin)/i, 'Household'],
  [/\b(coffee|tea|juice|soda|sparkling|water|beer|wine|kombucha|seltzer)\b/i, 'Beverages'],
  [/\b(ice cream|frozen|popsicle|waffles)\b/i, 'Frozen'],
  [/\b(milk|cheese|yogurt|butter|cream|egg)/i, 'Dairy & Eggs'],
  [/\b(bread|bagel|bun|roll|tortilla|muffin|croissant)/i, 'Bakery & Bread'],
  [/\b(chicken|beef|pork|turkey|fish|salmon|shrimp|bacon|sausage|steak|lamb)/i, 'Meat & Seafood'],
  [/\b(apple|banana|lettuce|onion|potato|tomato|berr|fruit|vegetable|herb|lemon|lime|avocado|grape|orange|pepper)/i, 'Produce'],
  [/\b(pasta|rice|noodle|oat|cereal|quinoa|flour)/i, 'Pasta, Rice & Grains'],
  [/\b(chips|crackers|nuts|cookies|pretzel|popcorn|granola bar)/i, 'Snacks & Nuts'],
  [/\b(sugar|salt|spice|baking|vanilla|cinnamon)/i, 'Spices & Baking'],
  [/\b(sauce|ketchup|mustard|mayo|oil|vinegar|dressing|syrup|jam|honey)/i, 'Oils & Condiments'],
  [/\b(cans?|canned|beans|soups?|broth)\b/i, 'Canned & Jarred'],
];

// Best guess for a typed item: exact canonical match first, then keywords, else 'Other'.
export function guessAisle(name: string): Aisle {
  const q = name.trim().toLowerCase();
  if (!q) return 'Other';
  const exact = Object.values(INGREDIENTS).find((d) => d.name.toLowerCase() === q || d.plural?.toLowerCase() === q);
  if (exact) return exact.aisle;
  const hit = AISLE_KEYWORDS.find(([re]) => re.test(q));
  if (hit) return hit[1];
  const partial = Object.values(INGREDIENTS).find((d) => d.name.toLowerCase().includes(q));
  return partial ? partial.aisle : 'Other';
}
