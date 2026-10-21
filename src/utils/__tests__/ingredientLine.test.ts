import { describeDraftLine, importIngredientLine, matchIngredient, parseIngredientLine } from '../ingredientLine';

describe('parseIngredientLine', () => {
  it.each([
    ['2 cups all-purpose flour', 2, 'cup', 'all-purpose flour', ''],
    ['1 1/2 tsp. salt', 1.5, 'tsp', 'salt', ''],
    ['1½ Tbsp olive oil', 1.5, 'tbsp', 'olive oil', ''],
    ['2 T sugar', 2, 'tbsp', 'sugar', ''],
    ['2 t sugar', 2, 'tsp', 'sugar', ''],
    ['3 cloves garlic, minced', 3, 'clove', 'garlic', 'minced'],
    ['2 garlic cloves', 2, 'clove', 'garlic', ''],
    ['1 (15 oz) can black beans, drained and rinsed', 1, 'can', 'black beans', 'drained and rinsed'],
    ['2-3 carrots', 3, null, 'carrots', ''],
    ['1 to 2 lbs potatoes', 2, 'lb', 'potatoes', ''],
    ['- 8 oz. cream cheese, softened', 8, 'oz', 'cream cheese', 'softened'],
    ['1 quart milk', 4, 'cup', 'milk', ''],
    ['2 dashes hot sauce', 4, 'pinch', 'hot sauce', ''],
    ['Pinch of salt', 1, 'pinch', 'salt', ''],
    ['salt', null, null, 'salt', ''],
  ])('%s', (line, amount, unit, name, prep) => {
    const p = parseIngredientLine(line);
    if (amount === null) expect(p.amount).toBeNull();
    else expect(p.amount).toBeCloseTo(amount);
    expect([p.unit, p.name, p.prep]).toEqual([unit, name, prep]);
  });

  it('converts metric and fluid ounces into our units', () => {
    expect(parseIngredientLine('500 g pasta')).toMatchObject({ unit: 'oz', quantityText: '500 g' });
    expect(parseIngredientLine('500 g pasta').amount).toBeCloseTo(17.637, 2);
    expect(parseIngredientLine('1 kg potatoes').amount).toBeCloseTo(2.2046, 3);
    expect(parseIngredientLine('250 ml milk')).toMatchObject({ unit: 'tsp' });
    expect(parseIngredientLine('4 fl oz cream')).toMatchObject({ amount: 8, unit: 'tbsp', quantityText: '4 fl oz' });
  });
});

describe('matchIngredient', () => {
  it.each([
    ['boneless skinless chicken breasts', 'chicken-breast'],
    ['extra-virgin olive oil', 'olive-oil'],
    ['large eggs', 'eggs'],
    ['egg', 'eggs'],
    ['kosher salt', 'salt'],
    ['freshly ground black pepper', 'black-pepper'],
    ['onion', 'yellow-onion'],
    ['red onion', 'red-onion'],
    ['scallions', 'green-onion'],
    ['shredded mozzarella cheese', 'mozzarella'],
    ['fresh mozzarella', 'fresh-mozzarella'],
    ['Gruyère', 'gruyere'],
    ['diced tomatoes', 'diced-tomatoes'],
    ['tomatoes', 'tomato'],
    ['brown rice', 'brown-rice'],
    ['cooked brown rice', 'cooked-brown-rice'],
    ['ground turkey', 'ground-turkey'],
    ['low-sodium soy sauce', 'soy-sauce'],
    ['soy sauce', 'soy-sauce'],
    ['spaghetti', 'pasta'],
    ['confectioners’ sugar', 'powdered-sugar'],
    ['dried bread crumbs', 'breadcrumbs'],
    ['plain breadcrumbs', 'breadcrumbs'],
    ['panko', 'breadcrumbs'],
    ['bread', 'white-bread'],
    ['slices bread', 'white-bread'],
    ['day-old bread', 'white-bread'],
    ['whole grain bread', 'whole-grain-bread'],
    ['prepared mustard', 'mustard'],
    ['yellow mustard', 'mustard'],
    ['mustard', 'mustard'],
    ['Dijon mustard', 'dijon-mustard'],
    ['dry mustard', 'dry-mustard'],
  ])('%s → %s', (name, id) => expect(matchIngredient(name)).toBe(id));

  it.each(['garlic powder chunks', 'peanut butter cups', 'red pepper', 'salt and pepper', 'lemon juice', 'dragon fruit', ''])(
    'leaves %p unmatched rather than guess',
    (name) => expect(matchIngredient(name)).toBeNull()
  );

  it('never matches a longer product to a shorter ingredient (allergens)', () => {
    expect(matchIngredient('peanut butter')).toBe('peanut-butter');
    expect(matchIngredient('garlic powder')).toBe('garlic-powder');
    expect(matchIngredient('almond flour')).toBeNull();
    expect(matchIngredient('fresh peanut butter')).toBe('peanut-butter');
    expect(matchIngredient('mustard greens')).toBeNull();
    expect(matchIngredient('bread flour')).toBeNull();
    expect(matchIngredient('sourdough bread')).toBeNull();
  });

  it('measures editor-only ingredients in their own unit family', () => {
    const [d] = importIngredientLine('1 tbsp yellow mustard');
    expect(d).toMatchObject({ id: 'mustard', amount: '1', unit: 'tbsp' });
  });

  it('reads the unit from "slices bread"', () => {
    const [d] = importIngredientLine('4 slices bread, toasted');
    expect(d).toMatchObject({ id: 'white-bread', amount: '4', unit: 'slice', prep: 'toasted' });
  });
});

describe('importIngredientLine', () => {
  const one = (line: string) => importIngredientLine(line).map(describeDraftLine);

  it('matches catalog ingredients and keeps the prep', () => {
    const [d] = importIngredientLine('3 cloves garlic, minced');
    expect(d).toMatchObject({ id: 'garlic', amount: '3', unit: 'clove', prep: 'minced' });
    expect(d.custom).toBeUndefined();
  });

  it('keeps unmatched lines as free text with their own unit', () => {
    expect(importIngredientLine('2 tbsp za’atar spice blend')[0]).toMatchObject({
      id: 'custom:za-atar-spice-blend',
      custom: 'za’atar spice blend',
      amount: '2',
      unit: 'tbsp',
    });
  });

  it('leaves the amount blank when the unit cannot fit the ingredient, noting the original', () => {
    expect(importIngredientLine('250 g red lentils')[0]).toMatchObject({ id: 'red-lentils', amount: '', unit: 'cup', prep: '250 g in the original' });
  });

  it('handles "to taste" and splits "salt and pepper"', () => {
    expect(one('Salt and pepper, to taste')).toEqual(['1 pinch Salt', '1 pinch Black pepper']);
    expect(importIngredientLine('Salt and pepper, to taste').map((d) => d.prep)).toEqual(['to taste', 'to taste']);
    expect(importIngredientLine('fresh herbs to taste')[0]).toMatchObject({ custom: 'fresh herbs', amount: '1', unit: null, prep: 'to taste' });
    expect(importIngredientLine('   ')).toEqual([]);
  });
});
