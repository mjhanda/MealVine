import { ingredientById } from '../data/ingredients';
import { aisleOrder } from '../theme';
import { Aisle, GroceryLine, GroceryUse, MealPlan, Unit } from '../types';
import { groceryIngredients } from './homemade';
import { recipeById } from './recipeCatalog';
import { fromBase, roundForPurchase, toBase, unitFamily, UnitFamily } from './units';

// Every ingredient uses one unit family across the catalog (enforced by the catalog test),
// so the ingredient id alone identifies a grocery line.
export const groceryKey = (ingredientId: string): string => ingredientId;

interface Accumulator {
  ingredientId: string;
  family: UnitFamily;
  sampleUnit: Unit | null;
  base: number;
  // Per plan entry (keyed by plan item id), in base units.
  uses: Map<string, { recipeId: string; base: number }>;
}

function addUse(acc: Accumulator, planItemId: string, recipeId: string, base: number) {
  const use = acc.uses.get(planItemId);
  if (use) use.base += base;
  else acc.uses.set(planItemId, { recipeId, base });
}

function accumulate(plan: MealPlan): Map<string, Accumulator> {
  const map = new Map<string, Accumulator>();
  plan.items.forEach((item) => {
    const recipe = recipeById(item.recipeId);
    if (!recipe) return;
    // Already scaled to the entry's servings, with from-scratch sauces swapped for their ingredients.
    groceryIngredients(recipe, item.servings, item.storeBought).forEach((ing) => {
      const base = toBase(ing.amount, ing.unit);
      let acc = map.get(ing.id);
      if (!acc) {
        acc = { ingredientId: ing.id, family: unitFamily(ing.unit), sampleUnit: ing.unit, base: 0, uses: new Map() };
        map.set(ing.id, acc);
      }
      acc.base += base;
      addUse(acc, item.id, recipe.id, base);
    });
  });
  return map;
}

function toLine(acc: Accumulator): GroceryLine | null {
  const def = ingredientById(acc.ingredientId);
  if (!def) return null;
  const converted = fromBase(acc.base, acc.family, acc.sampleUnit);
  const unit = converted.unit;
  const amount = roundForPurchase(converted.amount, acc.family);
  const name = unit === null && amount > 1 && def.plural ? def.plural : def.name;
  return {
    key: groceryKey(acc.ingredientId),
    ingredientId: acc.ingredientId,
    name,
    unit,
    amount,
    aisle: def.aisle,
    staple: !!def.staple,
    uses: Array.from(acc.uses, ([planItemId, use]): GroceryUse => ({
      planItemId,
      recipeId: use.recipeId,
      ...fromBase(use.base, acc.family, acc.sampleUnit),
    })),
  };
}

export function groceryLinesFromPlan(plan: MealPlan): GroceryLine[] {
  return Array.from(accumulate(plan).values())
    .map(toLine)
    .filter((line): line is GroceryLine => line !== null);
}

export function groupByAisle<T extends { aisle: Aisle; name: string }>(lines: T[]): Record<Aisle, T[]> {
  const byAisle = Object.fromEntries(aisleOrder.map((a) => [a, [] as T[]])) as Record<Aisle, T[]>;
  lines.forEach((line) => byAisle[line.aisle].push(line));
  Object.values(byAisle).forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)));
  return byAisle;
}

export function groceryItemsFromPlan(plan: MealPlan): Record<Aisle, GroceryLine[]> {
  return groupByAisle(groceryLinesFromPlan(plan));
}

// Drops check-offs for ingredients no recipe in the plan needs any more, so they come back
// unchecked when a later meal needs them again. Manual-item keys are left alone.
export function pruneChecked(
  checked: Record<string, boolean>,
  liveKeys: Set<string>,
  isManualKey: (key: string) => boolean
): Record<string, boolean> {
  const next: Record<string, boolean> = {};
  Object.entries(checked).forEach(([key, value]) => {
    if (value && (isManualKey(key) || liveKeys.has(key))) next[key] = true;
  });
  return next;
}

// Unchecked first, then alphabetical — so what's left to buy stays at the top of each aisle.
export function sortForShopping<T extends { key: string; name: string }>(lines: T[], checked: Record<string, boolean>): T[] {
  return [...lines].sort((a, b) => Number(!!checked[a.key]) - Number(!!checked[b.key]) || a.name.localeCompare(b.name));
}
