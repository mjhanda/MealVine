import { groceryLinesFromPlan } from '../utils/grocery';
import { useGroceryStore } from './groceryStore';
import { usePlanStore } from './planStore';

// Keeps grocery check-offs in step with the plan: whenever the plan changes after startup,
// check-offs for ingredients nothing needs any more are dropped. Returns the unsubscribe.
export function startPlanGrocerySync(): () => void {
  return usePlanStore.subscribe((state, prev) => {
    if (!state.hasHydrated || !prev.hasHydrated || state.plan === prev.plan) return;
    const liveKeys = new Set(groceryLinesFromPlan(state.plan).map((line) => line.key));
    useGroceryStore.getState().pruneToPlan(liveKeys);
  });
}
