import { Recipe } from '../types';

export const CMU_ARCHIVE = 'CMU Recipe Archive (rec.food.cooking)';
export const CMU_LICENSE =
  'No license stated by the archive. Ingredients and method adapted; instructions rewritten for Dishcart.';
export const CMU_LICENSE_AS_POSTED =
  'No license stated by the archive. Shared with credit to the original poster; not rewritten by Dishcart.';
export const CMU_AS_POSTED_CHANGES =
  'Instructions as originally posted, lightly cleaned. Amounts converted to Dishcart units; nutrition calculated by Dishcart.';

// One-line credit for the recipe page.
export function sourceCredit(recipe: Recipe): string {
  const s = recipe.source;
  if (!s) return 'Dishcart original recipe.';
  const when = s.posted ? `, ${s.posted.slice(0, 4)}` : '';
  if (s.kind === 'as-posted') return `“${s.title}” by ${s.author}, as posted (${s.collection}${when}).`;
  return `Adapted from “${s.title}” by ${s.author} (${s.collection}${when}).`;
}
