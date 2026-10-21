import { INGREDIENTS } from '../../data/ingredients';
import { Substitute, SUBSTITUTES } from '../../data/substitutes';
import { AllergenTag, DietId } from '../../types';
import { ALLERGENS, DIET_ORDER, DIETS, EatingPrefs } from '../diets';
import {
  addedAllergens,
  convertPart,
  describeSubstitute,
  isSafeSubstitute,
  safeSubstitutes,
  substituteAllergens,
  substituteAmounts,
  substituteParts,
  substituteTags,
} from '../substitutes';

const prefs = (over: Partial<EatingPrefs> = {}): EatingPrefs => ({ diet: 'classic', allergies: [], dislikes: [], ...over });
const ids = (subs: Substitute[]) => subs.map((s) => s.id);
const ALL_IDS = Object.keys(INGREDIENTS);

describe('safeSubstitutes — exhaustive safety sweep', () => {
  // Every catalog ingredient × every allergen × every diet: nothing returned may carry an excluded tag.
  it.each(ALLERGENS.map((a) => a.id))('never returns a substitute containing %s', (allergen: AllergenTag) => {
    DIET_ORDER.forEach((diet) => {
      const banned = new Set([allergen, ...DIETS[diet].excludes]);
      ALL_IDS.forEach((id) =>
        safeSubstitutes(id, prefs({ diet, allergies: [allergen] })).forEach((s) => {
          const hit = [...substituteTags(s)].filter((t) => banned.has(t));
          expect([id, diet, allergen, s.id, hit]).toEqual([id, diet, allergen, s.id, []]);
        })
      );
    });
  });

  it.each(DIET_ORDER)('%s with every allergy at once still returns only safe swaps', (diet: DietId) => {
    const all = ALLERGENS.map((a) => a.id);
    const banned = new Set([...all, ...DIETS[diet].excludes]);
    ALL_IDS.forEach((id) =>
      safeSubstitutes(id, prefs({ diet, allergies: all })).forEach((s) => {
        expect([id, s.id, [...substituteTags(s)].some((t) => banned.has(t))]).toEqual([id, s.id, false]);
      })
    );
  });

  it('never returns a substitute with a disliked ingredient in any part', () => {
    Object.entries(SUBSTITUTES).forEach(([id, subs]) =>
      subs.forEach((s) =>
        substituteParts(s).forEach((p) => {
          const kept = safeSubstitutes(id, prefs({ dislikes: [p.id] }));
          expect(kept.some((k) => substituteParts(k).some((kp) => kp.id === p.id))).toBe(false);
        })
      )
    );
  });
});

describe('safeSubstitutes — behavior', () => {
  it('keeps the catalog order (closest first) when nothing is excluded', () => {
    expect(ids(safeSubstitutes('shrimp', prefs()))).toEqual(ids(SUBSTITUTES.shrimp));
    expect(safeSubstitutes('shrimp', prefs())[0].id).toBe('chicken-breast');
  });

  it('drops swaps that break the diet', () => {
    expect(ids(safeSubstitutes('shrimp', prefs({ diet: 'vegetarian' })))).toEqual(['firm-tofu']);
    expect(ids(safeSubstitutes('sirloin', prefs({ diet: 'flexitarian' })))).toEqual(['chicken-thighs', 'portobello']);
  });

  it('drops swaps with an allergen, including in a composite part', () => {
    expect(ids(safeSubstitutes('butter', prefs({ allergies: ['soy'] })))).not.toContain('margarine');
    expect(safeSubstitutes('buttermilk', prefs({ allergies: ['dairy'] }))).toEqual([]);
    const egg = safeSubstitutes('eggs', prefs({ allergies: ['soy'] }));
    expect(ids(egg)).toEqual(['chia-seeds', 'applesauce', 'banana']);
  });

  it('drops swaps whose added part is disliked', () => {
    const kept = safeSubstitutes('buttermilk', prefs({ dislikes: ['white-vinegar'] }));
    expect(kept.map((s) => s.with?.[0].id)).toEqual(['lemon', 'milk']);
  });

  it('returns nothing for an ingredient with no substitutes or an unknown id', () => {
    expect(safeSubstitutes('yeast', prefs())).toEqual([]);
    expect(safeSubstitutes('not-an-ingredient', prefs())).toEqual([]);
  });

  it('treats a part with an unknown ingredient as unsafe', () => {
    expect(isSafeSubstitute({ id: 'mystery', ratio: 1 }, prefs())).toBe(false);
    expect(isSafeSubstitute({ id: 'milk', ratio: 1, with: [{ id: 'mystery', ratio: 1 }] }, prefs())).toBe(false);
  });

  it('ignores an allergy value it does not recognize instead of crashing', () => {
    expect(ids(safeSubstitutes('lemon', prefs({ allergies: ['bogus' as AllergenTag] })))).toEqual(ids(SUBSTITUTES.lemon));
  });
});

describe('allergen notes', () => {
  it('lists every allergen in the swap, in app order', () => {
    const margarine = SUBSTITUTES.butter.find((s) => s.id === 'margarine')!;
    expect(substituteAllergens(margarine)).toEqual(['dairy', 'soy']);
  });

  it('reports only the allergens the swap adds', () => {
    const margarine = SUBSTITUTES.butter.find((s) => s.id === 'margarine')!;
    expect(addedAllergens('butter', margarine)).toEqual(['soy']);
    expect(addedAllergens('not-an-ingredient', margarine)).toEqual(['dairy', 'soy']);
    const tofu = SUBSTITUTES.shrimp.find((s) => s.id === 'firm-tofu')!;
    expect(addedAllergens('shrimp', tofu)).toEqual(['soy']);
  });
});

describe('amounts', () => {
  it('scales in the original unit when the part has no unit', () => {
    expect(convertPart({ id: 'chicken-breast', ratio: 1 }, 12, 'oz')).toEqual({ id: 'chicken-breast', amount: 12, unit: 'oz' });
  });

  it('converts per base unit when the part names a unit', () => {
    const garlic = SUBSTITUTES.garlic[0];
    expect(convertPart(garlic, 4, 'clove')).toEqual({ id: 'garlic-powder', amount: 0.5, unit: 'tsp' });
    const cream = SUBSTITUTES['cream-cheese'][0];
    expect(convertPart(cream, 1, 'lb').amount).toBeCloseTo(2);
  });

  it('handles composite swaps', () => {
    const buttermilk = SUBSTITUTES.buttermilk[0];
    const [milk, vinegar] = substituteAmounts(buttermilk, 2, 'cup');
    expect(milk).toEqual({ id: 'milk', amount: 2, unit: 'cup' });
    expect(vinegar.unit).toBe('tbsp');
    expect(vinegar.amount).toBeCloseTo(2);
    expect(describeSubstitute(buttermilk, 2, 'cup')).toBe('2 cups milk (or milk alternative) + 2 tbsp white vinegar');
  });

  it('describes counts with plural names', () => {
    const diced = SUBSTITUTES['diced-tomatoes'][0];
    expect(describeSubstitute(diced, 1, 'can')).toBe('3 tomatoes');
    expect(describeSubstitute(SUBSTITUTES.lemon[0], 1, null)).toBe('1 lime');
    expect(describeSubstitute({ id: 'mystery', ratio: 1 }, 1, 'cup')).toBe('1 cup mystery');
  });

  it('self-rising flour becomes flour, baking powder, and salt', () => {
    const [flour, powder, salt] = substituteAmounts(SUBSTITUTES['self-rising-flour'][0], 2, 'cup');
    expect(flour).toEqual({ id: 'all-purpose-flour', amount: 2, unit: 'cup' });
    expect(powder.amount).toBeCloseTo(3);
    expect(salt.amount).toBeCloseTo(0.5);
  });
});
