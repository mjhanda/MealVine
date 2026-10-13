import { Recipe } from '../types';

export const CMU_ARCHIVE = 'CMU Recipe Archive (rec.food.cooking)';
export const CMU_LICENSE =
  'No license stated by the archive. Ingredients and method adapted; instructions rewritten for Dishcart.';

// One-line credit for the recipe page.
export function sourceCredit(recipe: Recipe): string {
  const s = recipe.source;
  if (!s) return 'Dishcart original recipe.';
  const when = s.posted ? `, ${s.posted.slice(0, 4)}` : '';
  return `Adapted from “${s.title}” by ${s.author} (${s.collection}${when}).`;
}
