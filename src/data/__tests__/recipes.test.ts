import { aisleOrder, mealTypeOrder } from '../../theme';
import { MEAT_TAGS } from '../../utils/diets';
import { unitFamily } from '../../utils/units';
import { INGREDIENTS } from '../ingredients';
import { LEGACY_INGREDIENT_NAMES } from '../legacyIngredientNames';
import { RECIPES } from '../recipes';

const allUses = RECIPES.flatMap((r) => r.ingredients.map((ing) => ({ recipe: r, ing })));

describe('canonical ingredient catalog', () => {
  it('has unique, case-insensitive names', () => {
    const names = Object.values(INGREDIENTS).map((d) => d.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it('uses only known aisles', () => {
    Object.values(INGREDIENTS).forEach((d) => expect(aisleOrder).toContain(d.aisle));
  });

  it('has no unused entries', () => {
    const used = new Set(allUses.map(({ ing }) => ing.id));
    expect(Object.keys(INGREDIENTS).filter((id) => !used.has(id))).toEqual([]);
  });

  it('legacy name map only points at real ingredients', () => {
    Object.values(LEGACY_INGREDIENT_NAMES).forEach((id) => expect(INGREDIENTS[id]).toBeDefined());
  });
});

describe('recipe catalog integrity', () => {
  it('has unique recipe ids', () => {
    const ids = RECIPES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every recipe ingredient resolves to a canonical id', () => {
    const unknown = allUses.filter(({ ing }) => !INGREDIENTS[ing.id]).map(({ recipe, ing }) => `${recipe.id}:${ing.id}`);
    expect(unknown).toEqual([]);
  });

  it('each ingredient is used in exactly one unit family across the catalog', () => {
    const families = new Map<string, Set<string>>();
    allUses.forEach(({ ing }) => {
      const set = families.get(ing.id) ?? new Set();
      set.add(unitFamily(ing.unit));
      families.set(ing.id, set);
    });
    const mixed = [...families.entries()].filter(([, s]) => s.size > 1).map(([id, s]) => `${id}: ${[...s].join('/')}`);
    expect(mixed).toEqual([]);
  });

  it.each(RECIPES.map((r) => [r.id, r] as const))('%s is well-formed', (_id, recipe) => {
    expect(recipe.title.trim()).not.toBe('');
    expect(mealTypeOrder).toContain(recipe.mealType);
    expect(recipe.servings).toBeGreaterThan(0);
    expect(recipe.prep + recipe.cook).toBeGreaterThan(0);
    expect(recipe.ingredients.length).toBeGreaterThan(0);
    expect(recipe.steps.length).toBeGreaterThan(0);
    const ids = recipe.ingredients.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    recipe.ingredients.forEach((ing) => expect(ing.amount).toBeGreaterThan(0));
  });

  it('protein label matches ingredients', () => {
    const tagsOf = (r: (typeof RECIPES)[number]) => new Set(r.ingredients.flatMap((i) => INGREDIENTS[i.id]?.tags ?? []));
    const wrong = RECIPES.filter((r) => {
      const tags = tagsOf(r);
      if (r.protein === 'vegetarian') return MEAT_TAGS.some((t) => tags.has(t));
      if (r.protein === 'fish') return !tags.has('fish') && !tags.has('shellfish');
      if (r.protein === 'chicken' || r.protein === 'turkey') return !tags.has('poultry');
      if (r.protein === 'beef' || r.protein === 'lamb') return !tags.has('red-meat');
      if (r.protein === 'pork') return !tags.has('pork');
      return false;
    }).map((r) => `${r.id} (${r.protein})`);
    expect(wrong).toEqual([]);
  });
});

describe('recipe sources', () => {
  const adapted = RECIPES.filter((r) => r.source);
  it('adapted recipes carry a complete credit', () => {
    expect(adapted.length).toBeGreaterThan(0);
    adapted.forEach((r) => {
      const s = r.source!;
      expect([r.id, !!(s.title && s.author && s.collection && s.url && s.license)]).toEqual([r.id, true]);
      expect(s.url).toMatch(/^https:\/\//);
    });
  });
  it('never publishes an email address', () => {
    adapted.forEach((r) => expect([r.id, JSON.stringify(r.source)]).not.toEqual([r.id, expect.stringMatching(/[\w.-]+@[\w.-]+/)]));
  });
});

describe('duplicates', () => {
  // Same idea as title_key in scripts/import-cmu/build_recipes.py.
  const key = (t: string) =>
    t
      .toLowerCase()
      .replace(/ · .*$/, '')
      .replace(/[^a-z ]/g, ' ')
      .split(/\s+/)
      .filter((w) => w && !['the', 'a', 'with', 'and', 'easy', 'my', 'best', 'quick'].includes(w))
      .map((w) => (w.endsWith('s') && w.length > 3 ? w.slice(0, -1) : w))
      .join(' ');

  it('no imported recipe repeats a dish we already have by hand', () => {
    const hand = new Set(RECIPES.filter((r) => r.source?.kind !== 'as-posted').map((r) => key(r.title)));
    expect(RECIPES.filter((r) => r.source?.kind === 'as-posted' && hand.has(key(r.title))).map((r) => r.title)).toEqual([]);
  });

  it('no two recipes share a name and the same ingredients', () => {
    const sig = (r: (typeof RECIPES)[number]) => `${key(r.title)}|${r.ingredients.map((i) => i.id).sort().join(',')}`;
    const seen = new Set<string>();
    const dupes = RECIPES.filter((r) => (seen.has(sig(r)) ? true : (seen.add(sig(r)), false))).map((r) => r.id);
    expect(dupes).toEqual([]);
  });
});
