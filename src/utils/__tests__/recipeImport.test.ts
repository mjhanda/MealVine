/// <reference types="node" />
import fs from 'fs';
import path from 'path';
import { describeDraftLine } from '../ingredientLine';
import {
  cleanText,
  decodeEntities,
  draftFromImport,
  findNode,
  guessMealType,
  hostName,
  ImportedRecipe,
  jsonLdBlocks,
  matchedCount,
  normalizeRecipeUrl,
  parseInstructions,
  parseIsoDuration,
  parseRecipeHtml,
  parseRecipeText,
  parseServings,
  WEB_LICENSE,
} from '../recipeImport';
import { recipeFromDraft, validateDraft } from '../customRecipes';
import { sourceCredit } from '../recipeSource';

// Small hand-written pages in the shapes recipe sites use; tests never fetch live sites.
const fixture = (name: string) => fs.readFileSync(path.join(__dirname, 'fixtures', `${name}.html`), 'utf8');

function parsed(name: string, url = `https://www.${name}.example/recipe`): ImportedRecipe {
  const result = parseRecipeHtml(fixture(name), url);
  if (!result.ok) throw new Error(`${name}: no recipe`);
  return result.recipe;
}

describe('parseRecipeHtml on saved pages', () => {
  it('reads a Yoast-style @graph with HowToSections and entities', () => {
    const r = parsed('recipe-graph');
    expect(r).toMatchObject({
      title: 'Weeknight Chicken & Rice',
      servings: 4,
      prepMinutes: 15,
      cookMinutes: 65,
      author: 'Sam Cook',
      siteName: 'Test Kitchen Blog',
    });
    expect(r.ingredientLines).toHaveLength(10);
    expect(r.steps).toEqual([
      'Chicken: Season the chicken with the paprika, salt, and pepper.',
      'Brown the chicken in the olive oil, 4–5 minutes per side.',
      'Rice: Add the garlic, rice, tomatoes, and stock.',
      'Cover and simmer 20 minutes. Top with feta.',
    ]);
  });

  it('reads a single Recipe with a list @type, string instructions, and text yield', () => {
    const r = parsed('recipe-plain');
    expect(r).toMatchObject({ title: "Grandma's Banana Bread", servings: 10, prepMinutes: 20, cookMinutes: 80, author: 'Pat Baker' });
    expect(r.siteName).toBe('recipe-plain.example'); // no og:site_name or WebSite: the host
    expect(r.steps).toEqual([
      'Heat the oven to 350°F.',
      'Mix the butter into the mashed bananas.',
      'Stir in the sugar, egg, and vanilla, then the baking soda, salt, and flour.',
      'Bake 60 minutes.',
    ]);
  });

  it('finds the Recipe among several blocks, skipping a malformed one', () => {
    const r = parsed('recipe-list');
    expect(r).toMatchObject({ title: 'Red Lentil Soup', servings: 6, prepMinutes: null, cookMinutes: 35, author: 'Ana Sopa', siteName: 'Metric Meals' });
    expect(r.steps[0]).toBe('Soften the onion, carrots, and garlic.');
  });

  it('says so when a page has no recipe data', () => {
    expect(parseRecipeHtml(fixture('no-recipe'), 'https://news.example/a')).toEqual({ ok: false, reason: 'no-recipe' });
    expect(parseRecipeHtml('<html><body>2 cups flour</body></html>', 'https://x.example')).toEqual({ ok: false, reason: 'no-recipe' });
  });
});

describe('draftFromImport', () => {
  it('pre-fills the editor with most ingredients matched and the site credited', () => {
    const d = draftFromImport(parsed('recipe-graph'), 2);
    expect(d).toMatchObject({ title: 'Weeknight Chicken & Rice', mealType: 'dinner', servings: 4, prep: '15', cook: '65' });
    expect(d.ingredients.map(describeDraftLine)).toEqual([
      '1½ lb Chicken breast',
      '2 tbsp Olive oil',
      '3 cloves Garlic',
      '1 can Diced tomatoes (14.5 oz can)',
      '1 cup Long-grain white rice',
      '2 cups Chicken broth',
      '1 tsp Smoked paprika',
      '1 pinch Salt',
      '1 pinch Black pepper',
      '½ cup Feta cheese',
      '2 tbsp za’atar spice blend',
    ]);
    expect(matchedCount(d)).toBe(10);
    expect(d.source).toEqual({
      kind: 'web',
      title: 'Weeknight Chicken & Rice',
      author: 'Sam Cook',
      collection: 'Test Kitchen Blog',
      url: 'https://www.recipe-graph.example/recipe',
      license: WEB_LICENSE,
    });
    // Ready to save as-is, and the recipe page credits the site.
    expect(validateDraft(d)).toEqual([]);
    const recipe = recipeFromDraft(d, 'u-1');
    expect(sourceCredit(recipe)).toBe('Imported from “Weeknight Chicken & Rice” by Sam Cook (Test Kitchen Blog). Saved for your personal use.');
  });

  it('guesses dessert and metric amounts that need a look', () => {
    expect(draftFromImport(parsed('recipe-plain'), 2)).toMatchObject({ mealType: 'dessert', emoji: '🍰', servings: 10 });
    const soup = draftFromImport(parsed('recipe-list'), 2);
    expect(soup.ingredients.filter((i) => i.amount === '').map((i) => i.prep)).toEqual(['250 g in the original', '400 ml in the original']);
    expect(validateDraft(soup).length).toBeGreaterThan(0); // the user fills those in before saving
  });

  it('falls back to the household size and clamps servings', () => {
    const base = parseRecipeText('Toast\n1 slice whole grain bread\nToast it.');
    expect(draftFromImport(base, 3).servings).toBe(3);
    expect(draftFromImport({ ...base, servings: 99 }, 3).servings).toBe(24);
    expect(draftFromImport(base, 3).source).toBeUndefined();
    expect(draftFromImport({ ...base, steps: [] }, 3).steps).toEqual(['']);
  });
});

describe('parseRecipeText (paste fallback)', () => {
  it('uses headings when there are some', () => {
    const r = parseRecipeText('Quick salad\nServes 2\n\nIngredients:\n- 1 cucumber, sliced\n• 2 tbsp olive oil\nfeta to taste\nDirections\n1. Slice.\n2) Toss.');
    expect(r).toMatchObject({ title: 'Quick salad', servings: 2, ingredientLines: ['1 cucumber, sliced', '2 tbsp olive oil', 'feta to taste'], steps: ['Slice.', 'Toss.'] });
  });

  it('without headings, lines that start with an amount are ingredients', () => {
    const r = parseRecipeText('Toast\n2 slices whole grain bread\n½ tbsp butter\nToast the bread.\nButter it.');
    expect(r).toMatchObject({ title: 'Toast', ingredientLines: ['2 slices whole grain bread', '½ tbsp butter'], steps: ['Toast the bread.', 'Butter it.'] });
  });

  it('copes with a missing title or only one heading', () => {
    expect(parseRecipeText('Ingredients\n1 egg\nInstructions\nBoil 9 minutes.')).toMatchObject({ title: '', ingredientLines: ['1 egg'], steps: ['Boil 9 minutes.'] });
    expect(parseRecipeText('Egg\n1 egg\nMethod\nBoil it.')).toMatchObject({ ingredientLines: ['1 egg'], steps: ['Boil it.'] });
    expect(parseRecipeText('')).toMatchObject({ title: '', ingredientLines: [], steps: [] });
  });
});

describe('helpers', () => {
  it('decodes entities and strips tags', () => {
    expect(decodeEntities('a &amp; b &#8217; &#x2019; &frac12; &bogus; &#0;')).toBe('a & b ’ ’ ½ &bogus; &#0;');
    expect(cleanText('<p>Mix<br/>well</p>  ')).toBe('Mix well');
  });

  it('parses ISO 8601 durations', () => {
    expect(parseIsoDuration('PT1H30M')).toBe(90);
    expect(parseIsoDuration('PT45M')).toBe(45);
    expect(parseIsoDuration('P1DT2H')).toBe(1560);
    expect(parseIsoDuration('PT90S')).toBe(2);
    expect(parseIsoDuration('PT')).toBeNull();
    expect(parseIsoDuration('45 minutes')).toBeNull();
    expect(parseIsoDuration(45)).toBeNull();
  });

  it('reads yields', () => {
    expect(parseServings(4)).toBe(4);
    expect(parseServings(['4', '4 servings'])).toBe(4);
    expect(parseServings('Serves 6-8')).toBe(6);
    expect(parseServings('1 loaf (10 slices)')).toBe(10);
    expect(parseServings('a lot')).toBeNull();
    expect(parseServings(undefined)).toBeNull();
  });

  it('flattens every instruction shape', () => {
    expect(parseInstructions(['Step 1: Mix.', { '@type': 'HowToStep', text: 'Bake.' }, { '@type': 'HowToStep' }])).toEqual(['Mix.', 'Bake.']);
    expect(parseInstructions({ '@type': 'ItemList', itemListElement: [{ text: 'One.' }] })).toEqual(['One.']);
    expect(parseInstructions('<ol><li>A.</li><li>B.</li></ol>')).toEqual(['A.', 'B.']);
    expect(parseInstructions(42)).toEqual([]);
  });

  it('finds nodes anywhere and survives junk', () => {
    expect(findNode({ mainEntity: { '@type': 'Recipe', name: 'x' } }, 'Recipe')).toEqual({ '@type': 'Recipe', name: 'x' });
    expect(findNode('nope', 'Recipe')).toBeNull();
    expect(jsonLdBlocks('<script type="application/ld+json"><!-- {"a":1} --></script>')).toEqual([{ a: 1 }]);
  });

  it('guesses meal types', () => {
    expect(guessMealType('Breakfast, Brunch')).toBe('breakfast');
    expect(guessMealType('Salad dressing')).toBe('side');
    expect(guessMealType('Appetizer')).toBe('snack');
    expect(guessMealType('Lunch box')).toBe('lunch');
    expect(guessMealType('Main Course')).toBe('dinner');
  });

  it('accepts only http(s) links', () => {
    expect(normalizeRecipeUrl(' https://example.com/r ')).toBe('https://example.com/r');
    expect(normalizeRecipeUrl('example.com/recipe')).toBe('https://example.com/recipe');
    expect(normalizeRecipeUrl('http://example.com')).toBe('http://example.com');
    expect(normalizeRecipeUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeRecipeUrl('file:///etc/passwd')).toBeNull();
    expect(normalizeRecipeUrl('not a url')).toBeNull();
    expect(normalizeRecipeUrl('localhost')).toBeNull();
    expect(normalizeRecipeUrl('')).toBeNull();
    expect(hostName('https://www.Example.com:8080/x')).toBe('example.com');
    expect(hostName('nope')).toBe('');
  });
});
