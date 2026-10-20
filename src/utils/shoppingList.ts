import { INGREDIENTS } from '../data/ingredients';
import { aisleOrder } from '../theme';
import { Aisle, GroceryLine, ManualGroceryItem, PantryOverride } from '../types';
import { NOT_CHECKED_NOTE } from './customIngredients';
import { sortForShopping } from './grocery';
import { formatQuantity } from './units';

export interface ShoppingRow {
  key: string;
  name: string;
  quantity: string | null; // null for manual items
  checked: boolean;
  ingredientId?: string;
  manualId?: string;
  note?: string; // e.g. "Not checked for allergies" for a free-text ingredient
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
    ...(l.unverified ? { note: NOT_CHECKED_NOTE } : {}),
  });
  const manualRow = (m: ManualGroceryItem): ShoppingRow => {
    const key = manualKey(m.id);
    return { key, name: m.name, quantity: null, checked: !!checked[key], manualId: m.id };
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
