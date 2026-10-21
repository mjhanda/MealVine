import { setUserRecipes } from '../../data/userRecipes';
import { Recipe } from '../../types';
import { stepIngredients } from '../cooking';
import { customIngredient, customIngredientId, customIngredientNames, ingredientLabel, isCustomIngredient } from '../customIngredients';
import {
  allowedUnits,
  amountText,
  catalogUnitFamily,
  defaultUnit,
  deriveProtein,
  draftFromRecipe,
  emptyDraft,
  ingredientDraft,
  newUserRecipeId,
  parseAmount,
  RecipeDraft,
  recipeFromDraft,
  searchIngredients,
  validateDraft,
  withIngredient,
} from '../customRecipes';
import { describeConflicts, recipeConflicts } from '../diets';
import { groceryLinesFromPlan } from '../grocery';
import { caloriesPerServing, recipeNutrition } from '../nutrition';
import { allRecipes, filterRecipes, ingredientDisplayName, ownRecipeWarning, recipeById, relaxSuggestions } from '../recipeCatalog';
import { sourceCredit } from '../recipeSource';
import { buildShoppingList } from '../shoppingList';

const SOUP: Recipe = {
  id: 'u-soup',
  title: 'Weeknight lentil soup',
  mealType: 'dinner',
  protein: 'vegetarian',
  prep: 10,
  cook: 30,
  servings: 4,
  emoji: '🍲',
  ingredients: [
    { id: 'garlic', amount: 2, unit: 'clove', prep: 'minced' },
    customIngredient('Smoked salt', 1, 'tsp'),
    customIngredient('Gran’s spice mix', 2, null),
  ],
  steps: ['Warm the garlic and smoked salt in a pot.', 'Simmer 30 minutes with the spice mix.'],
};

const noPrefs = { diet: 'classic' as const, allergies: [], dislikes: [] };

afterEach(() => setUserRecipes([]));

describe('free-text ingredients', () => {
  it('get a custom: id and keep the name as written', () => {
    expect(customIngredientId('  Smoked Salt! ')).toBe('custom:smoked-salt');
    expect(customIngredientId('!!!')).toBe('custom:item');
    expect(customIngredient('Smoked salt', 1, 'tsp', 'to taste')).toEqual({
      id: 'custom:smoked-salt', custom: 'Smoked salt', amount: 1, unit: 'tsp', prep: 'to taste',
    });
    expect(isCustomIngredient({ id: 'garlic' })).toBe(false);
    expect(ingredientLabel({ id: 'garlic' })).toBe('Garlic');
    expect(ingredientLabel({ id: 'custom:x', custom: 'X sauce' })).toBe('X sauce');
    expect(customIngredientNames(SOUP)).toEqual(['Smoked salt', 'Gran’s spice mix']);
  });

  it('display with their own name and prep', () => {
    expect(ingredientDisplayName({ ...SOUP.ingredients[1], prep: 'divided' }, 1)).toBe('Smoked salt, divided');
  });

  it('are never silently counted as safe: listed as unverified, noted when it matters', () => {
    const c = recipeConflicts(SOUP, { diet: 'classic', allergies: ['peanut'], dislikes: [] });
    expect(c.allergens).toEqual([]);
    expect(c.unverified).toEqual(['Smoked salt', 'Gran’s spice mix']);
    expect(describeConflicts(c, { diet: 'classic', allergies: ['peanut'], dislikes: [] })).toEqual([
      'Not checked for allergies or diet: Smoked salt, Gran’s spice mix',
    ]);
    // No allergies, avoid list, or diet: nothing to warn about.
    expect(describeConflicts(recipeConflicts(SOUP, noPrefs), noPrefs)).toEqual([]);
  });

  it('show up in cooking-mode steps by name', () => {
    expect(stepIngredients(SOUP, SOUP.steps[0]).map(ingredientLabel)).toEqual(['Garlic', 'Smoked salt']);
    expect(stepIngredients(SOUP, SOUP.steps[1]).map(ingredientLabel)).toEqual(['Gran’s spice mix']);
  });

  it('are left out of nutrition without breaking it', () => {
    const n = recipeNutrition(SOUP);
    expect(n.approximate.unconverted).toEqual(['custom:smoked-salt', 'custom:gran-s-spice-mix']);
    expect(n.perServing.kcal).toBeGreaterThan(0);
  });
});

describe('your recipes in the catalog', () => {
  it('are found by id, listed after the catalog, and filtered by "My recipes"', () => {
    expect(recipeById('u-soup')).toBeUndefined();
    const catalogSize = allRecipes().length;
    setUserRecipes([SOUP]);
    expect(recipeById('u-soup')).toBe(SOUP);
    expect(allRecipes()).toHaveLength(catalogSize + 1);
    const mine = filterRecipes({ mealType: 'mine', query: '', prefs: noPrefs });
    expect(mine.map((r) => r.id)).toEqual(['u-soup']);
    expect(filterRecipes({ mealType: 'all', query: 'smoked salt', prefs: noPrefs }).map((r) => r.id)).toEqual(['u-soup']);
    expect(sourceCredit(SOUP)).toBe('Your recipe.');
  });

  it('always show under "My recipes", whatever the diet; allergy conflicts are flagged, not hidden', () => {
    const burger: Recipe = { ...SOUP, id: 'u-burger', protein: 'beef', ingredients: [{ id: 'ground-beef', amount: 1, unit: 'lb' }] };
    const satay: Recipe = { ...SOUP, id: 'u-satay', ingredients: [{ id: 'peanut-butter', amount: 2, unit: 'tbsp' }] };
    setUserRecipes([burger, satay]);
    const prefs = { diet: 'vegetarian' as const, allergies: ['peanut' as const], dislikes: [] };
    const mine = filterRecipes({ mealType: 'mine', query: '', prefs });
    expect(mine.map((r) => r.id)).toEqual(['u-burger', 'u-satay']);
    expect(relaxSuggestions({ mealType: 'mine', query: 'zzz', prefs }).map((s) => s.filter)).toEqual(['query']);
    // Elsewhere the usual filters apply.
    expect(filterRecipes({ mealType: 'all', query: '', prefs }).some((r) => r.id.startsWith('u-'))).toBe(false);
    expect(ownRecipeWarning(satay, prefs)).toBe('Contains peanut');
    expect(ownRecipeWarning(burger, prefs)).toBeUndefined();
    expect(ownRecipeWarning(recipeById('r1')!, prefs)).toBeUndefined();
  });

  it('go on the grocery list: catalog lines as usual, free text under Other, flagged', () => {
    setUserRecipes([SOUP]);
    const lines = groceryLinesFromPlan({ items: [{ id: 'a', recipeId: 'u-soup', servings: 8 }] });
    expect(lines.find((l) => l.ingredientId === 'garlic')).toMatchObject({ amount: 4, unit: 'clove', aisle: 'Produce' });
    expect(lines.find((l) => l.name === 'Smoked salt')).toMatchObject({ amount: 2, unit: 'tsp', aisle: 'Other', unverified: true });
    const list = buildShoppingList({ lines, manualItems: [], checked: {}, pantry: {}, manualKey: (id) => `manual__${id}` });
    const other = list.sections.find((s) => s.aisle === 'Other')!;
    expect(other.rows.every((r) => r.note === 'Not checked for allergies')).toBe(true);
  });

  it('keeps free-text amounts in different unit families on separate lines', () => {
    const other: Recipe = { ...SOUP, id: 'u-other', ingredients: [customIngredient('Smoked salt', 1, 'oz')] };
    setUserRecipes([SOUP, other]);
    const lines = groceryLinesFromPlan({
      items: [
        { id: 'a', recipeId: 'u-soup', servings: 4 },
        { id: 'b', recipeId: 'u-other', servings: 4 },
      ],
    });
    expect(lines.filter((l) => l.name === 'Smoked salt').map((l) => l.unit).sort()).toEqual(['oz', 'tsp']);
  });

  it('recompute calories after an edit (cache is per recipe object)', () => {
    const before = caloriesPerServing(SOUP);
    const doubled = { ...SOUP, ingredients: SOUP.ingredients.map((i) => ({ ...i, amount: i.amount * 2 })) };
    expect(caloriesPerServing(doubled)).toBeCloseTo(before * 2);
  });
});

describe('units', () => {
  it('limits a catalog ingredient to its family; free text can use any unit', () => {
    expect(catalogUnitFamily('garlic')).toBe('clove');
    expect(allowedUnits('garlic')).toEqual(['clove']);
    expect(allowedUnits('olive-oil')).toEqual(['pinch', 'tsp', 'tbsp', 'cup']);
    expect(allowedUnits('custom:anything')).toHaveLength(13);
  });

  it('picks a sensible default unit', () => {
    expect(defaultUnit('olive-oil')).toBe('tbsp');
    expect(defaultUnit('olive-oil', 'cup')).toBe('cup');
    expect(defaultUnit('garlic', 'cup')).toBe('clove');
    expect(defaultUnit('custom:x')).toBeNull();
  });
});

describe('parseAmount', () => {
  it.each([
    ['2', 2],
    ['1.5', 1.5],
    ['.5', 0.5],
    ['1/2', 0.5],
    ['1 1/2', 1.5],
    ['½', 0.5],
    ['1½', 1.5],
    ['1 ½', 1.5],
    ['2-3', 3],
    ['2 to 3', 3],
    ['1–2', 2],
  ])('%s → %d', (text, value) => expect(parseAmount(text)).toBeCloseTo(value));

  it.each(['', 'a pinch', '0', '1/0', 'two'])('%p is not an amount', (text) => expect(parseAmount(text)).toBeNull());

  it('formats amounts for editing', () => {
    expect(amountText(1.5)).toBe('1 1/2');
    expect(amountText(1 / 3)).toBe('1/3');
    expect(amountText(0.333)).toBe('1/3');
    expect(amountText(0.5)).toBe('1/2');
    expect(amountText(2 / 3)).toBe('2/3');
    expect(amountText(1.25)).toBe('1 1/4');
    expect(amountText(2)).toBe('2');
    expect(amountText(1.9995)).toBe('2');
    expect(amountText(0.4)).toBe('0.4');
    expect(amountText(0.33)).toBe('0.33');
  });

  it('reads its own fractions back', () => {
    [1 / 3, 0.5, 2 / 3, 1.25, 1 / 8, 2.75, 0.4].forEach((n) => expect(parseAmount(amountText(n))).toBeCloseTo(n, 2));
  });
});

describe('drafts', () => {
  const valid = (): RecipeDraft => ({
    ...emptyDraft(2),
    title: '  Toast  ',
    emoji: '',
    prep: '5',
    ingredients: [ingredientDraft({ id: 'olive-oil', amount: 1, unit: 'tbsp' }), ingredientDraft(customIngredient('Nice bread', 2, 'slice', 'thick'))],
    steps: ['Toast the bread.', '  '],
  });

  it('a valid draft becomes a recipe', () => {
    expect(validateDraft(valid())).toEqual([]);
    const r = recipeFromDraft(valid(), 'u-1');
    expect(r).toEqual({
      id: 'u-1',
      title: 'Toast',
      mealType: 'dinner',
      protein: 'vegetarian',
      prep: 5,
      cook: 0,
      servings: 2,
      emoji: '🍽️',
      ingredients: [
        { id: 'olive-oil', amount: 1, unit: 'tbsp' },
        { id: 'custom:nice-bread', custom: 'Nice bread', amount: 2, unit: 'slice', prep: 'thick' },
      ],
      steps: ['Toast the bread.'],
      proteinAuto: true,
    });
  });

  it('remembers an Automatic protein, and a chosen one, when editing again', () => {
    const auto = recipeFromDraft(valid(), 'u-1');
    expect(draftFromRecipe(auto).protein).toBeNull();
    const chosen = recipeFromDraft({ ...valid(), protein: 'beef' }, 'u-2');
    expect(chosen.proteinAuto).toBeUndefined();
    expect(draftFromRecipe(chosen).protein).toBe('beef');
    // Catalog recipes (no flag) keep their protein.
    expect(draftFromRecipe({ ...auto, proteinAuto: undefined }).protein).toBe('vegetarian');
  });

  it('round-trips through draftFromRecipe', () => {
    const r = recipeFromDraft(valid(), 'u-1');
    expect(recipeFromDraft(draftFromRecipe(r))).toEqual(r);
    expect(draftFromRecipe({ ...r, steps: [] }).steps).toEqual(['']);
    const withSource = { ...r, source: { kind: 'adapted' as const, title: 'T', author: 'A', collection: 'C', url: 'u', license: 'l' } };
    expect(recipeFromDraft(draftFromRecipe(withSource)).source).toEqual(withSource.source);
  });

  it('reports every problem in plain words', () => {
    const bad: RecipeDraft = {
      ...emptyDraft(0),
      prep: 'ten',
      ingredients: [
        { key: 'a', id: 'garlic', amount: 'some', unit: 'cup', prep: '' },
        { key: 'b', id: 'custom:x', custom: ' ', amount: '1', unit: null, prep: '' },
        { key: 'c', id: 'not-real', amount: '1', unit: null, prep: '' },
      ],
      steps: [''],
    };
    expect(validateDraft(bad)).toEqual([
      'Give your recipe a name.',
      'Servings must be a whole number from 1 to 24.',
      'Prep and cook times are whole minutes.',
      'Enter an amount for Garlic (like 2, 1.5, or 1 1/2).',
      "Garlic can't be measured in cup.",
      'An ingredient is missing its name.',
      "not-real isn't in the ingredient list.",
      'Add at least one step.',
    ]);
    expect(validateDraft({ ...emptyDraft(), title: 'x', steps: ['y'] })).toEqual(['Add at least one ingredient.']);
  });

  it('changing a line keeps the amount and moves the unit into the new family', () => {
    const line = ingredientDraft(customIngredient('Bread', 2, 'cup'));
    expect(withIngredient(line, { id: 'garlic' })).toMatchObject({ id: 'garlic', amount: '2', unit: 'clove' });
    expect(withIngredient(line, { id: 'garlic' }).custom).toBeUndefined();
    expect(withIngredient(ingredientDraft({ id: 'garlic', amount: 1, unit: 'clove' }), { custom: ' Black garlic ' })).toMatchObject({
      id: 'custom:black-garlic',
      custom: 'Black garlic',
      unit: 'clove',
    });
  });

  it('works out the protein from catalog ingredients', () => {
    expect(deriveProtein([{ id: 'garlic' }])).toBe('vegetarian');
    expect(deriveProtein([{ id: 'garlic' }, { id: 'salmon' }])).toBe('fish');
    expect(deriveProtein([{ id: 'chicken-breast' }])).toBe('chicken');
  });

  it('makes user ids that never look like catalog ids', () => {
    const a = newUserRecipeId(1000);
    const b = newUserRecipeId(1000);
    expect(a.startsWith('u-')).toBe(true);
    expect(a).not.toBe(b);
  });
});

describe('searchIngredients', () => {
  it('finds by name or plural, best matches first', () => {
    expect(searchIngredients('garlic')[0].id).toBe('garlic');
    expect(searchIngredients('carrots')[0].id).toBe('carrot');
    expect(searchIngredients('')).toEqual([]);
    expect(searchIngredients('zzzz')).toEqual([]);
    expect(searchIngredients('a', 3)).toHaveLength(3);
  });
});
