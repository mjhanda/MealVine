import { categoryOrder, days } from '../theme';
import { recipeById } from './planGenerator';
import { Day, GroceryLine, MealPlan } from '../types';
import { scaleAmount } from './units';

export const groceryKey = (name: string, unit: string | null): string => `${name}__${unit || 'unit'}`;

export function groceryItemsFromPlan(plan: MealPlan, servings: number): Record<string, GroceryLine[]> {
  const map = new Map<string, GroceryLine>();

  (days as readonly Day[]).forEach((day) => {
    const entries = plan.entries[day] || {};
    Object.values(entries).forEach((recipeId) => {
      const recipe = recipeById(recipeId);
      if (!recipe) return;
      recipe.ingredients.forEach((ing) => {
        const key = groceryKey(ing.name, ing.unit);
        const scaled = scaleAmount(ing.amount, recipe.servings, servings);
        const existing = map.get(key);
        if (existing) {
          existing.amount += scaled;
        } else {
          map.set(key, { name: ing.name, unit: ing.unit, amount: scaled, category: ing.category });
        }
      });
    });
  });

  const byCategory: Record<string, GroceryLine[]> = {};
  categoryOrder.forEach((c) => (byCategory[c] = []));
  Array.from(map.values()).forEach((item) => {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  });
  Object.values(byCategory).forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)));
  return byCategory;
}
