import { PlanItem } from '../types';
import { useHistoryStore } from './historyStore';
import { usePlanStore } from './planStore';

// Cross-store actions live here so screens never reach into two stores' internals themselves.

// Moves a plan entry into cooking history. Returns the removed entry so the caller can offer undo.
export function markCooked(planItemId: string, now: number = Date.now()): PlanItem | undefined {
  const item = usePlanStore.getState().plan.items.find((i) => i.id === planItemId);
  if (!item) return undefined;
  useHistoryStore.getState().record({ id: item.id, recipeId: item.recipeId, servings: item.servings, cookedAt: now });
  usePlanStore.getState().removeItem(item.id);
  return item;
}

// Reverses markCooked: the entry goes back into the plan (same id and servings) and leaves history.
export function undoCooked(item: PlanItem): void {
  useHistoryStore.getState().remove(item.id);
  usePlanStore.getState().restoreItem(item);
}

// Re-adds a cooked meal to the plan; returns the new entry's id.
export function cookAgain(recipeId: string, servings: number): string {
  return usePlanStore.getState().addItem(recipeId, servings);
}
