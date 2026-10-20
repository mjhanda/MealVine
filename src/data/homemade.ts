import { Unit } from '../types';

// Store-bought sauces and dressings our recipes call for, each with a Dishcart recipe to make it
// from scratch (T46). `yields` is what one batch of that recipe makes, in the same unit family the
// bottled ingredient uses across the catalog (enforced by test), so a plan entry knows how many
// batches to make.
export interface HomemadeOption {
  recipeId: string;
  yields: { amount: number; unit: Unit };
}

export const HOMEMADE: Record<string, HomemadeOption> = {
  'caesar-dressing': { recipeId: 'r134', yields: { amount: 0.75, unit: 'cup' } },
  'peanut-sauce': { recipeId: 'r135', yields: { amount: 0.75, unit: 'cup' } },
  pesto: { recipeId: 'r136', yields: { amount: 0.75, unit: 'cup' } },
  marinara: { recipeId: 'r137', yields: { amount: 3, unit: 'cup' } },
  salsa: { recipeId: 'r138', yields: { amount: 1.5, unit: 'cup' } },
  'enchilada-sauce': { recipeId: 'r139', yields: { amount: 2, unit: 'cup' } },
  'cocktail-sauce': { recipeId: 'r140', yields: { amount: 0.5, unit: 'cup' } },
  'balsamic-glaze': { recipeId: 'r141', yields: { amount: 0.25, unit: 'cup' } },
};
