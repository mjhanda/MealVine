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
      return false;
    }).map((r) => `${r.id} (${r.protein})`);
    expect(wrong).toEqual([]);
  });
});
