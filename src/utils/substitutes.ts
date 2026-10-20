import { INGREDIENTS } from '../data/ingredients';
import { Substitute, SubstitutePart, SUBSTITUTES } from '../data/substitutes';
import { AllergenTag, IngredientTag, Unit } from '../types';
import { ALLERGENS, DIETS, EatingPrefs } from './diets';
import { formatQuantity, toBase } from './units';

// Pure rules over src/data/substitutes.ts (T38). The UI (T39) must only ever show what
// `safeSubstitutes` returns, and must show `substituteAllergens` next to each one.

const ALLERGEN_IDS = new Set<IngredientTag>(ALLERGENS.map((a) => a.id));

// The main ingredient first, then any `with` additions.
export const substituteParts = (sub: Substitute): SubstitutePart[] => [sub, ...(sub.with ?? [])];

// Every tag of every ingredient in the swap. An unknown id has no tags we can trust, so the safety
// check below treats it as unsafe rather than tag-free.
export function substituteTags(sub: Substitute): Set<IngredientTag> {
  const tags = new Set<IngredientTag>();
  substituteParts(sub).forEach((p) => INGREDIENTS[p.id]?.tags.forEach((t) => tags.add(t)));
  return tags;
}

// Allergens the swap contains, in the app's allergen order — always shown with the suggestion.
export function substituteAllergens(sub: Substitute): AllergenTag[] {
  const tags = substituteTags(sub);
  return ALLERGENS.map((a) => a.id).filter((id) => tags.has(id));
}

// Allergens the swap brings in that the original ingredient didn't have.
export function addedAllergens(originalId: string, sub: Substitute): AllergenTag[] {
  const original = new Set(INGREDIENTS[originalId]?.tags ?? []);
  return substituteAllergens(sub).filter((a) => !original.has(a));
}

// True when the swap is fine for these preferences: no part is unknown or disliked, no tag is one of
// the user's allergens, and no tag is excluded by their diet. Unlike browsing, the diet is never
// relaxed here — a swap you didn't choose shouldn't break how you eat.
export function isSafeSubstitute(sub: Substitute, prefs: EatingPrefs): boolean {
  const parts = substituteParts(sub);
  if (parts.some((p) => !INGREDIENTS[p.id] || prefs.dislikes.includes(p.id))) return false;
  const tags = substituteTags(sub);
  const banned: IngredientTag[] = [...prefs.allergies.filter((a) => ALLERGEN_IDS.has(a)), ...DIETS[prefs.diet].excludes];
  return !banned.some((t) => tags.has(t));
}

// Substitutes for an ingredient that fit the user's allergies, diet, and dislikes, closest first.
export function safeSubstitutes(ingredientId: string, prefs: EatingPrefs): Substitute[] {
  return (SUBSTITUTES[ingredientId] ?? []).filter((s) => isSafeSubstitute(s, prefs));
}

export interface SubstituteAmount {
  id: string;
  amount: number;
  unit: Unit | null;
}

// How much of one part replaces `amount unit` of the original. No `unit` on the part: same unit,
// scaled. Otherwise the ratio is per base unit of the original (tsp, oz, or one item).
export function convertPart(part: SubstitutePart, amount: number, unit: Unit | null): SubstituteAmount {
  if (part.unit === undefined) return { id: part.id, amount: amount * part.ratio, unit };
  return { id: part.id, amount: toBase(amount, unit) * part.ratio, unit: part.unit };
}

export const substituteAmounts = (sub: Substitute, amount: number, unit: Unit | null): SubstituteAmount[] =>
  substituteParts(sub).map((p) => convertPart(p, amount, unit));

// "12 oz chicken breast", "1 cup milk + 1 tbsp white vinegar".
export function describeSubstitute(sub: Substitute, amount: number, unit: Unit | null): string {
  return substituteAmounts(sub, amount, unit)
    .map((a) => `${formatQuantity(a.amount, a.unit)} ${partName(a).toLowerCase()}`)
    .join(' + ');
}

// A plain count of more than one reads as the plural ("3 tomatoes"); measured amounts don't ("2 cups milk").
function partName({ id, amount, unit }: SubstituteAmount): string {
  const def = INGREDIENTS[id];
  if (!def) return id;
  return unit === null && amount > 1 && def.plural ? def.plural : def.name;
}
