import { INGREDIENTS } from '../../data/ingredients';
import { RECIPES } from '../../data/recipes';
import { EatingPrefs, fitsDiet } from '../diets';
import { caloriesPerServing } from '../nutrition';
import { filterRecipes, ingredientDisplayName, isQuickMeal, QUICK_MINUTES, recipeById, relaxSuggestions, totalMinutes } from '../recipeCatalog';

const classic: EatingPrefs = { diet: 'classic', allergies: [], dislikes: [] };

describe('recipeById', () => {
  it('finds a recipe', () => expect(recipeById('r1')?.id).toBe('r1'));
  it('returns undefined for unknown or missing ids', () => {
    expect(recipeById('nope')).toBeUndefined();
    expect(recipeById(undefined)).toBeUndefined();
  });
});

describe('ingredientDisplayName', () => {
  it('uses the canonical name', () => expect(ingredientDisplayName({ id: 'garlic', amount: 2, unit: 'clove' }, 2)).toBe('Garlic'));
  it('pluralizes counts above one', () => expect(ingredientDisplayName({ id: 'carrot', amount: 2, unit: null }, 2)).toBe('Carrots'));
  it('keeps singular for one', () => expect(ingredientDisplayName({ id: 'carrot', amount: 1, unit: null }, 1)).toBe('Carrot'));
  it('appends prep', () =>
    expect(ingredientDisplayName({ id: 'eggs', amount: 2, unit: null, prep: 'hard-boiled' }, 2)).toBe('Eggs, hard-boiled'));
});

describe('filterRecipes', () => {
  it('returns the whole catalog for classic with no filters', () => {
    expect(filterRecipes({ mealType: 'all', query: '', prefs: classic })).toHaveLength(RECIPES.length);
  });
  it('filters by meal type', () => {
    expect(filterRecipes({ mealType: 'dinner', query: '', prefs: classic }).every((r) => r.mealType === 'dinner')).toBe(true);
  });
  it('applies the diet unless showAllDiets', () => {
    const veg: EatingPrefs = { ...classic, diet: 'vegetarian' };
    expect(filterRecipes({ mealType: 'all', query: '', prefs: veg }).every((r) => fitsDiet(r, 'vegetarian'))).toBe(true);
    expect(filterRecipes({ mealType: 'all', query: '', prefs: veg, showAllDiets: true })).toHaveLength(RECIPES.length);
  });
  it('allergies exclude even with showAllDiets', () => {
    const prefs: EatingPrefs = { ...classic, allergies: ['peanut'] };
    const results = filterRecipes({ mealType: 'all', query: '', prefs, showAllDiets: true });
    expect(results.length).toBeLessThan(RECIPES.length);
    results.forEach((r) => r.ingredients.forEach((i) => expect(INGREDIENTS[i.id].tags).not.toContain('peanut')));
  });
  it('dislikes exclude', () => {
    const prefs: EatingPrefs = { ...classic, dislikes: ['firm-tofu'] };
    expect(filterRecipes({ mealType: 'all', query: '', prefs }).some((r) => r.ingredients.some((i) => i.id === 'firm-tofu'))).toBe(false);
  });
  it('matches canonical ingredient names, case-insensitively', () => {
    const results = filterRecipes({ mealType: 'all', query: '  CHICKPEAS ', prefs: classic });
    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => expect(r.title.toLowerCase().includes('chickpea') || r.ingredients.some((i) => i.id === 'chickpeas')).toBe(true));
  });
  it('matches plural names', () => {
    expect(filterRecipes({ mealType: 'all', query: 'tomatoes', prefs: classic }).some((r) => r.ingredients.some((i) => i.id === 'tomato'))).toBe(true);
  });
});

describe('filterRecipes: time, ids, combinations', () => {
  const base = { mealType: 'all' as const, query: '', prefs: classic };
  it('maxMinutes keeps only quick enough recipes', () => {
    const quick = filterRecipes({ ...base, mealType: 'dinner', maxMinutes: 30 });
    expect(quick.length).toBeGreaterThan(0);
    quick.forEach((r) => {
      expect(r.mealType).toBe('dinner');
      expect(totalMinutes(r)).toBeLessThanOrEqual(30);
    });
  });
  it('onlyIds and excludeIds', () => {
    expect(filterRecipes({ ...base, onlyIds: new Set(['r1', 'r2']) }).map((r) => r.id)).toEqual(['r1', 'r2']);
    expect(filterRecipes({ ...base, excludeIds: new Set(['r1']) }).some((r) => r.id === 'r1')).toBe(false);
  });
  it('allergen-excluded recipes never appear under any filter combination', () => {
    const prefs: EatingPrefs = { diet: 'classic', allergies: ['dairy'], dislikes: [] };
    const combos = [
      { showAllDiets: true },
      { maxMinutes: 45 },
      { onlyIds: new Set(RECIPES.map((r) => r.id)) },
      { mealType: 'breakfast' as const, query: 'egg' },
    ];
    combos.forEach((c) =>
      filterRecipes({ ...base, prefs, ...c }).forEach((r) =>
        r.ingredients.forEach((i) => expect(INGREDIENTS[i.id].tags).not.toContain('dairy'))
      )
    );
  });
});

describe('relaxSuggestions', () => {
  it('names each active filter that would bring results back, with counts', () => {
    const f = { mealType: 'snack' as const, query: 'salmon', prefs: classic, maxMinutes: 15 };
    expect(filterRecipes(f)).toHaveLength(0);
    const s = relaxSuggestions(f);
    expect(s.map((x) => x.filter)).toEqual(expect.arrayContaining(['query', 'mealType']));
    s.forEach((x) => expect(x.count).toBeGreaterThan(0));
  });
  it('never suggests dropping allergies', () => {
    const prefs: EatingPrefs = { diet: 'classic', allergies: ['fish', 'shellfish'], dislikes: [] };
    const s = relaxSuggestions({ mealType: 'all', query: 'salmon', prefs });
    expect(s.map((x) => x.filter)).toEqual(['query']);
  });
});

describe('calorie filter', () => {

  it('keeps only recipes at or under the limit per serving', () => {
    const light = filterRecipes({ mealType: 'all', query: '', prefs: classic, maxKcal: 400 });
    expect(light.length).toBeGreaterThan(0);
    expect(light.length).toBeLessThan(RECIPES.length);
    light.forEach((r) => expect(caloriesPerServing(r)).toBeLessThanOrEqual(400));
  });
  it('is offered as a relax suggestion', () => {
    const s = relaxSuggestions({ mealType: 'dinner', query: '', prefs: classic, maxKcal: 50 });
    expect(s.map((x) => x.filter)).toContain('maxKcal');
  });
});

describe('quick meals', () => {
  const quick = filterRecipes({ mealType: 'quick', query: '', prefs: classic });

  it('are breakfasts, lunches, and dinners ready in 30 minutes or less', () => {
    expect(quick.length).toBeGreaterThanOrEqual(30);
    quick.forEach((r) => {
      expect(['breakfast', 'lunch', 'dinner']).toContain(r.mealType);
      expect(r.prep + r.cook).toBeLessThanOrEqual(QUICK_MINUTES);
    });
  });

  it('include every recipe that qualifies and leave out desserts, sides, and snacks', () => {
    const expected = RECIPES.filter(isQuickMeal).filter((r) => filterRecipes({ mealType: 'all', query: '', prefs: classic }).includes(r));
    expect(quick.map((r) => r.id).sort()).toEqual(expected.map((r) => r.id).sort());
    expect(RECIPES.some((r) => r.mealType === 'dessert' && r.prep + r.cook <= QUICK_MINUTES && isQuickMeal(r))).toBe(false);
  });
});
