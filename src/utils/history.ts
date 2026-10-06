import { CookedEntry } from '../types';

export interface CookStats {
  times: number;
  lastCookedAt: number;
}

// Per-recipe cook counts and last-cooked time from the history (newest first or any order).
export function cookStats(history: CookedEntry[]): Map<string, CookStats> {
  const stats = new Map<string, CookStats>();
  history.forEach((e) => {
    const s = stats.get(e.recipeId);
    if (s) {
      s.times += 1;
      s.lastCookedAt = Math.max(s.lastCookedAt, e.cookedAt);
    } else {
      stats.set(e.recipeId, { times: 1, lastCookedAt: e.cookedAt });
    }
  });
  return stats;
}
