import { Unit } from '../types';
import { toBase } from '../utils/units';

// Substitutes for catalog ingredients (T38): what to use when the store is out, or when you already
// have something that works. Written by us from common kitchen practice.
//
// Shape:
// - Each list is ordered by closeness: the first entry is the best swap.
// - A part's `ratio` scales the original amount. With no `unit`, the substitute is measured in the
//   ORIGINAL's unit (amount × ratio): 12 oz shrimp → 12 oz chicken breast. With a `unit` (null = a
//   plain count), the substitute is `ratio` of that unit per one base unit of the original (tsp for
//   volume, oz for weight, one item otherwise) — build those with `per()` below.
// - `with` adds more ingredients for a composite swap (buttermilk → milk + white vinegar).
// - `context` says where a swap fails ("Baking only", "Won't whip"); `note` says how to do it.
// - Every part must convert into the unit family that ingredient uses across the catalog
//   (enforced by src/data/__tests__/substitutes.test.ts), so a swapped grocery line merges cleanly.
//
// Safety: nothing here is filtered. Always go through `safeSubstitutes()` in
// src/utils/substitutes.ts, which drops any swap that hits the user's allergies, diet, or dislikes.

export interface SubstitutePart {
  id: string;
  ratio: number;
  unit?: Unit | null;
}

export interface Substitute extends SubstitutePart {
  with?: SubstitutePart[];
  note?: string;
  context?: string;
}

type Extra = Pick<Substitute, 'with' | 'note' | 'context'>;

// Same unit as the original, scaled: same('lime') is 1:1, same('pecans', 0.5) is half as much.
const same = (id: string, ratio = 1, extra: Extra = {}): Substitute => ({ id, ratio, ...extra });

// `amount unit` of the substitute for every `perAmount perUnit` of the original.
const per = (id: string, amount: number, unit: Unit | null, perAmount: number, perUnit: Unit | null, extra: Extra = {}): Substitute => ({
  id,
  ratio: amount / toBase(perAmount, perUnit),
  unit,
  ...extra,
});

const BAKING = 'Baking only';
const COOKED = 'Cooked dishes only';
const NO_WHIP = "Won't whip";

export const SUBSTITUTES: Record<string, Substitute[]> = {
  // --- Produce ---------------------------------------------------------------
  apple: [same('peach'), same('plums', 2), per('applesauce', 0.5, 'cup', 1, null, { context: 'Baking only — no chunks' })],
  asparagus: [per('green-beans', 3, 'cup', 1, 'bunch'), per('broccoli-florets', 3, 'cup', 1, 'bunch')],
  avocado: [
    per('hummus', 0.5, 'cup', 1, null, { context: 'Spreads and toast' }),
    per('greek-yogurt', 0.5, 'cup', 1, null, { context: 'Creamy dips and dressings' }),
  ],
  'baby-spinach': [same('kale', 1, { note: 'Remove the stems; cook a few minutes longer' }), same('mixed-greens', 1, { context: 'Raw salads' })],
  banana: [
    per('applesauce', 1 / 3, 'cup', 1, null, { context: BAKING }),
    per('mango', 0.5, 'cup', 1, null, { context: 'Smoothies' }),
  ],
  basil: [
    same('parsley'),
    same('italian-seasoning', 1 / 3, { context: 'Cooked dishes — not for garnish or pesto' }),
    same('mint', 1, { context: 'Different flavor' }),
  ],
  'bell-pepper': [
    same('zucchini', 1, { context: COOKED }),
    per('celery', 2, 'stalk', 1, null, { context: 'For crunch in raw dishes' }),
    same('carrot'),
  ],
  'broccoli-florets': [same('cauliflower-florets'), same('green-beans'), same('snow-peas', 1, { context: 'Stir-fries' })],
  carrot: [
    same('sweet-potato', 0.5, { context: COOKED }),
    per('peas-and-carrots', 0.5, 'cup', 1, null, { context: 'Soups and fried rice' }),
    same('bell-pepper', 1, { context: 'For crunch in raw dishes' }),
  ],
  celery: [per('carrot', 0.5, null, 1, 'stalk', { context: 'Soups and stews' }), per('bell-pepper', 0.5, null, 1, 'stalk', { context: 'For crunch' })],
  'cherry-tomatoes': [per('tomato', 4 / 3, null, 1, 'cup', { note: 'Chop into bite-size pieces' }), per('cucumber', 0.5, null, 1, 'cup', { context: 'Salads' })],
  chives: [per('green-onion', 1, null, 2, 'tbsp', { note: 'Use the green tops' }), same('parsley')],
  cilantro: [same('parsley', 1, { note: 'A squeeze of lime brings it closer' }), same('basil')],
  'corn-kernels': [same('green-peas'), same('edamame-shelled'), same('peas-and-carrots')],
  cucumber: [per('celery', 3, 'stalk', 1, null, { context: 'For crunch' }), same('zucchini', 1, { context: 'Raw only if small and young' })],
  dill: [same('parsley'), same('chives')],
  garlic: [per('garlic-powder', 1 / 8, 'tsp', 1, 'clove', { context: COOKED })],
  ginger: [same('ground-ginger', 1 / 12, { context: COOKED })],
  'green-beans': [same('snow-peas'), same('broccoli-florets'), per('asparagus', 1, 'bunch', 3, 'cup')],
  'green-onion': [per('chives', 1, 'tbsp', 1, null), same('shallot', 0.25, { context: COOKED })],
  jalapeno: [
    per('red-pepper-flakes', 0.25, 'tsp', 1, null, { context: 'Heat only — cooked dishes' }),
    per('hot-sauce', 1, 'tsp', 1, null, { context: 'Heat only' }),
    same('bell-pepper', 0.25, { context: 'Crunch without the heat' }),
  ],
  kale: [same('baby-spinach', 1, { note: 'Add near the end; it wilts fast' }), same('cabbage', 1, { context: 'Soups and sautés' })],
  lemon: [
    same('lime'),
    per('white-wine-vinegar', 2, 'tbsp', 1, null, { context: 'Juice only — not zest' }),
    per('cider-vinegar', 2, 'tbsp', 1, null, { context: 'Juice only — not zest' }),
  ],
  lime: [same('lemon'), per('white-wine-vinegar', 2, 'tbsp', 1, null, { context: 'Juice only — not zest' })],
  mint: [same('basil', 1, { context: 'Different flavor' }), same('parsley', 1, { note: 'Add a squeeze of lemon', context: 'Salads and garnish' })],
  'mixed-berries': [same('strawberries'), same('blueberries'), same('raspberries')],
  'mixed-greens': [same('baby-spinach'), per('romaine', 1, 'head', 6, 'cup'), per('butter-lettuce', 1, 'head', 6, 'cup')],
  mushrooms: [
    per('portobello', 1, null, 4, 'oz'),
    per('zucchini', 1, null, 8, 'oz', { context: COOKED }),
    per('eggplant', 1, null, 16, 'oz', { context: COOKED }),
  ],
  orange: [
    per('orange-juice', 1 / 3, 'cup', 1, null, { context: 'Juice only — not segments or zest' }),
    per('pineapple-chunks', 0.5, 'cup', 1, null, { context: 'Fruit salads' }),
  ],
  parsley: [same('cilantro'), same('basil'), same('chives', 1, { context: 'Garnish' })],
  'pineapple-chunks': [same('mango'), per('peach', 1, null, 1, 'cup'), same('strawberries')],
  potato: [
    per('baby-potatoes', 6, 'oz', 1, null),
    same('sweet-potato', 1, { context: 'Sweeter; cooks a little faster' }),
    per('cauliflower-florets', 1.5, 'cup', 1, null, { context: 'Mash and roasts' }),
  ],
  raspberries: [same('strawberries'), same('blueberries'), same('mixed-berries')],
  'red-onion': [same('yellow-onion'), same('shallot', 2), same('green-onion', 4, { context: 'Raw dishes' })],
  romaine: [same('butter-lettuce'), per('mixed-greens', 6, 'cup', 1, 'head')],
  rosemary: [same('dried-thyme', 1 / 3, { context: COOKED }), same('italian-seasoning', 1 / 3, { context: COOKED })],
  strawberries: [same('mixed-berries'), same('raspberries'), same('blueberries')],
  'sweet-potato': [
    same('winter-squash', 0.5),
    same('potato', 1, { context: 'Less sweet' }),
    per('pumpkin-puree', 1, 'cup', 1, null, { context: 'Mash and baking only' }),
  ],
  tomato: [per('cherry-tomatoes', 0.75, 'cup', 1, null), per('diced-tomatoes', 1 / 3, 'can', 1, null, { context: COOKED })],
  'yellow-onion': [
    same('red-onion'),
    same('shallot', 3),
    same('green-onion', 6),
    per('onion-powder', 1, 'tsp', 1, null, { context: 'Flavor only — cooked dishes' }),
  ],
  zucchini: [
    same('eggplant', 1, { context: COOKED }),
    per('mushrooms', 8, 'oz', 1, null, { context: COOKED }),
    same('cucumber', 1, { context: 'Raw dishes only' }),
  ],

  // --- Meat, seafood, and protein --------------------------------------------
  bacon: [
    per('ham', 1, 'oz', 1, 'slice', { note: 'Dice and crisp in a little oil' }),
    per('pork-sausage', 1, 'oz', 1, 'slice', { note: 'Crumble and brown' }),
    per('smoked-paprika', 0.25, 'tsp', 1, 'slice', { context: 'Smoky flavor only — cooked dishes' }),
  ],
  'chicken-breast': [
    same('chicken-thighs'),
    same('turkey-breast'),
    same('pork-tenderloin'),
    same('firm-tofu', 1, { note: 'Press and cube', context: 'Texture changes' }),
  ],
  'chicken-thighs': [same('chicken-breast', 1, { note: 'Leaner; take it off the heat as soon as it’s cooked through' }), same('turkey-breast'), same('pork-chops')],
  cod: [same('salmon', 1, { context: 'Richer' }), same('shrimp')],
  'deli-turkey': [same('ham'), same('chicken-breast', 1, { note: 'Cook, cool, and slice thin' })],
  'firm-tofu': [
    per('chickpeas', 1, 'can', 14, 'oz', { context: 'Texture changes' }),
    per('edamame-shelled', 2, 'cup', 14, 'oz'),
    same('chicken-breast'),
  ],
  'ground-beef': [same('ground-turkey'), same('ground-chicken'), same('firm-tofu', 1, { note: 'Press and crumble' })],
  'ground-turkey': [same('ground-chicken'), same('ground-beef'), same('firm-tofu', 1, { note: 'Press and crumble' })],
  'pork-chops': [same('pork-tenderloin'), same('chicken-breast'), same('chicken-thighs')],
  'pork-sausage': [
    same('turkey-sausage'),
    same('ground-turkey', 1, { with: [per('italian-seasoning', 0.25, 'tsp', 4, 'oz')], note: 'Season well with salt and pepper' }),
    same('ground-beef', 1, { with: [per('italian-seasoning', 0.25, 'tsp', 4, 'oz')], context: 'Crumbled in sauces and stuffings' }),
  ],
  salmon: [same('cod', 1, { note: 'Leaner; cooks a few minutes faster' }), same('chicken-breast')],
  shrimp: [
    same('chicken-breast', 1, { note: 'Cut into bite-size pieces and cook through' }),
    same('cod', 1, { note: 'Cut into chunks; handle gently' }),
    same('firm-tofu', 1, { note: 'Press and cube', context: 'Texture changes' }),
  ],
  sirloin: [same('pork-tenderloin'), same('chicken-thighs'), per('portobello', 1, null, 4, 'oz', { context: 'Texture changes' })],
  tuna: [
    per('salmon', 5, 'oz', 1, 'can', { note: 'Cook, cool, and flake' }),
    per('chicken-breast', 5, 'oz', 1, 'can', { note: 'Cook, cool, and shred' }),
    same('chickpeas', 1, { note: 'Drain and mash' }),
  ],
  'turkey-sausage': [
    same('ground-turkey', 1, { with: [per('italian-seasoning', 0.25, 'tsp', 4, 'oz')], note: 'Season the turkey well with salt and pepper' }),
    same('ground-chicken', 1, { with: [per('italian-seasoning', 0.25, 'tsp', 4, 'oz')] }),
  ],
  'whole-chicken': [
    same('cornish-hen', 2, { note: 'Roast about 1 hour' }),
    per('chicken-thighs', 3, 'lb', 1, null, { note: 'Cooks faster than a whole bird', context: 'Soups, stews, and braises' }),
    per('chicken-breast', 3, 'lb', 1, null, { note: 'Cooks faster; don’t overcook', context: 'Soups, stews, and braises' }),
  ],

  // --- Dairy and eggs ----------------------------------------------------------
  butter: [
    same('margarine'),
    same('shortening', 1, { context: 'Baking — no butter flavor' }),
    same('olive-oil', 0.75, { context: 'Not where butter is creamed with sugar' }),
    same('vegetable-oil', 0.75, { context: 'Not where butter is creamed with sugar' }),
  ],
  buttermilk: [
    same('milk', 1, { with: [per('white-vinegar', 1, 'tbsp', 1, 'cup')], note: 'Stir together and let stand 5 minutes' }),
    same('milk', 1, { with: [per('lemon', 1 / 3, null, 1, 'cup')], note: 'Add 1 tbsp lemon juice per cup; let stand 5 minutes' }),
    same('greek-yogurt', 0.75, { with: [same('milk', 0.25)], note: 'Whisk until smooth' }),
  ],
  cheddar: [same('mozzarella'), same('gruyere')],
  'cottage-cheese': [
    same('ricotta'),
    same('greek-yogurt', 1, { context: 'Tangier; dips and spreads' }),
    per('cream-cheese', 8, 'oz', 1, 'cup', { context: 'Richer' }),
  ],
  'condensed-milk': [
    same('milk', 2, { with: [same('sugar', 2 / 3)], note: 'Simmer, stirring often, until reduced by half (30–40 minutes); cool' }),
  ],
  'cream-cheese': [
    per('ricotta', 1, 'cup', 8, 'oz', { context: 'Not for cheesecake' }),
    per('greek-yogurt', 1, 'cup', 8, 'oz', { context: 'Dips and spreads' }),
    per('cottage-cheese', 1, 'cup', 8, 'oz', { note: 'Blend until smooth', context: 'Dips and spreads' }),
  ],
  eggs: [
    per('chia-seeds', 1, 'tbsp', 1, null, { note: 'Mix each tbsp with 3 tbsp water; rest 5 minutes', context: BAKING }),
    per('applesauce', 0.25, 'cup', 1, null, { context: 'Baking only — a little denser' }),
    same('banana', 0.5, { note: 'Mash well', context: 'Baking only — tastes of banana' }),
    per('firm-tofu', 2, 'oz', 1, null, { note: 'Crumble', context: 'Scrambles only' }),
  ],
  feta: [same('cottage-cheese', 1, { note: 'Drain and salt lightly', context: 'Milder' }), same('parmesan', 0.5, { context: 'Saltier' })],
  'fresh-mozzarella': [per('mozzarella', 1, 'cup', 4, 'oz'), per('ricotta', 0.5, 'cup', 4, 'oz', { context: 'Pizza, pasta, and bakes' })],
  'greek-yogurt': [same('sour-cream'), same('cottage-cheese', 1, { note: 'Blend until smooth' }), same('ricotta')],
  'half-and-half': [
    same('milk', 0.5, { with: [same('heavy-cream', 0.5)] }),
    same('evaporated-milk'),
    same('milk', 7 / 8, { with: [per('butter', 1, 'tbsp', 1, 'cup')], context: 'Cooking and baking only' }),
  ],
  'heavy-cream': [
    same('half-and-half', 1, { context: `${NO_WHIP}; may curdle at a hard boil` }),
    same('evaporated-milk', 1, { context: NO_WHIP }),
    same('milk', 0.75, { with: [same('butter', 0.25)], note: 'Melt the butter into the milk', context: `${NO_WHIP}; cooking and baking only` }),
    per('coconut-milk', 0.6, 'can', 1, 'cup', { context: `${NO_WHIP}; tastes of coconut` }),
  ],
  hummus: [
    per('white-beans', 1, 'can', 1.5, 'cup', { note: 'Mash with olive oil, lemon, and garlic' }),
    same('greek-yogurt', 1, { context: 'Dips' }),
    per('avocado', 1, null, 0.5, 'cup', { note: 'Mash', context: 'Spreads and dips' }),
  ],
  margarine: [
    same('butter'),
    same('shortening', 1, { context: BAKING }),
    same('vegetable-oil', 0.75, { context: 'Not where it’s creamed with sugar' }),
  ],
  mayonnaise: [
    same('greek-yogurt', 1, { context: 'Tangier' }),
    same('sour-cream'),
    per('avocado', 1, null, 0.5, 'cup', { note: 'Mash', context: 'Spreads and sandwiches' }),
  ],
  milk: [
    same('evaporated-milk', 0.5, { note: 'Mix with an equal amount of water' }),
    same('half-and-half', 1, { context: 'Richer' }),
    per('coconut-milk', 0.6, 'can', 1, 'cup', { context: 'Tastes of coconut' }),
  ],
  mozzarella: [per('fresh-mozzarella', 4, 'oz', 1, 'cup'), same('cheddar'), same('gruyere')],
  parmesan: [same('gruyere'), same('cheddar', 1, { context: 'Milder' })],
  ricotta: [
    same('cottage-cheese', 1, { note: 'Drain and blend until smooth' }),
    per('cream-cheese', 8, 'oz', 1, 'cup', { context: 'Richer and denser' }),
    same('greek-yogurt', 1, { context: 'Dips and fillings — not for baking' }),
  ],
  'sour-cream': [same('greek-yogurt'), same('cottage-cheese', 1, { note: 'Blend until smooth' })],

  // --- Grains, bread, and pasta ------------------------------------------------
  breadcrumbs: [
    per('crackers', 12, null, 1, 'cup', { note: 'Crush finely' }),
    same('rolled-oats', 1, { context: 'Binder in meatballs and loaves' }),
    same('cornmeal', 1, { context: 'Coatings' }),
  ],
  'brown-rice': [
    same('cooked-brown-rice', 3, { note: 'Already cooked — skip simmering the rice' }),
    same('white-rice', 1, { note: 'Simmer about 18 minutes instead of 45' }),
    same('quinoa', 1, { note: 'Simmer about 15 minutes' }),
    same('bulgur', 1, { note: 'Simmer about 12 minutes' }),
  ],
  'cooked-brown-rice': [
    same('cooked-white-rice'),
    same('brown-rice', 1 / 3, { note: 'Simmer in twice its volume of water, about 45 minutes' }),
    same('quinoa', 1 / 3, { note: 'Simmer in twice its volume of water, about 15 minutes' }),
  ],
  'cooked-white-rice': [
    same('cooked-brown-rice'),
    same('white-rice', 1 / 3, { note: 'Simmer in twice its volume of water, about 18 minutes' }),
    same('quinoa', 1 / 3, { note: 'Simmer in twice its volume of water, about 15 minutes' }),
  ],
  'corn-tortilla': [same('flour-tortilla'), same('whole-wheat-tortilla')],
  'flour-tortilla': [same('whole-wheat-tortilla'), same('flatbread'), same('corn-tortilla', 2, { context: 'Smaller; warm them so they don’t crack' })],
  granola: [
    same('rolled-oats', 1, { with: [per('maple-syrup', 1, 'tbsp', 1, 'cup')], note: 'Toss together and toast at 350°F for 10 minutes' }),
    same('bran-cereal'),
  ],
  'lasagna-noodles': [
    same('pasta', 1, { note: 'Cook short pasta and layer it in place of the sheets', context: 'Baked lasagna' }),
    per('zucchini', 1, null, 3, 'oz', { note: 'Slice lengthwise into thin planks', context: 'Gluten-free; softer' }),
    per('eggplant', 1, null, 6, 'oz', { note: 'Slice thin and roast first', context: 'Gluten-free; softer' }),
  ],
  pasta: [same('whole-wheat-penne'), same('whole-wheat-spaghetti'), same('egg-noodles')],
  quinoa: [same('bulgur', 1, { note: 'Simmer about 12 minutes' }), same('brown-rice', 1, { note: 'Simmer about 45 minutes' })],
  'rolled-oats': [same('oat-bran', 1, { context: 'Baking and porridge — smoother' }), same('breadcrumbs', 1, { context: 'Binder in meatballs and loaves only' })],
  'white-rice': [
    same('cooked-white-rice', 3, { note: 'Already cooked — skip simmering the rice' }),
    same('brown-rice', 1, { note: 'Simmer about 45 minutes instead of 18' }),
    same('quinoa', 1, { note: 'Simmer about 15 minutes' }),
  ],
  'whole-wheat-penne': [same('pasta'), same('whole-wheat-spaghetti')],
  'whole-wheat-tortilla': [same('flour-tortilla'), same('flatbread'), same('corn-tortilla', 2, { context: 'Smaller' })],

  // --- Canned and jarred ---------------------------------------------------------
  'beef-broth': [
    same('chicken-broth', 1, { context: 'Lighter flavor' }),
    same('vegetable-broth', 1, { with: [per('soy-sauce', 1, 'tsp', 1, 'cup')], note: 'Soy sauce adds depth' }),
    per('miso', 1, 'tsp', 1, 'cup', { note: 'Dissolve in the same amount of hot water' }),
  ],
  'black-beans': [same('kidney-beans'), same('white-beans'), same('chickpeas')],
  'chicken-broth': [
    same('vegetable-broth'),
    per('miso', 1, 'tsp', 1, 'cup', { note: 'Dissolve in the same amount of hot water' }),
  ],
  chickpeas: [same('white-beans'), same('black-beans')],
  'coconut-milk': [
    per('half-and-half', 1.5, 'cup', 1, 'can'),
    per('evaporated-milk', 1.5, 'cup', 1, 'can'),
    per('greek-yogurt', 1.5, 'cup', 1, 'can', { note: 'Stir in off the heat; don’t boil' }),
  ],
  'diced-tomatoes': [
    per('tomato', 3, null, 1, 'can', { note: 'Chop and simmer 10 minutes longer', context: COOKED }),
    per('tomato-sauce', 1.75, 'cup', 1, 'can', { context: 'Smoother' }),
    per('marinara', 1.75, 'cup', 1, 'can', { context: 'Already seasoned' }),
  ],
  'green-lentils': [
    same('red-lentils', 1, { note: 'Cook about 15 minutes', context: 'They break down — fine for soups, not salads' }),
    per('black-beans', 1.5, 'can', 1, 'cup', { note: 'Already cooked — skip simmering the lentils' }),
  ],
  marinara: [
    same('tomato-sauce', 1, { with: [per('italian-seasoning', 0.5, 'tsp', 1, 'cup')], note: 'Simmer 10 minutes with a little garlic' }),
    per('diced-tomatoes', 1, 'can', 1.75, 'cup', { note: 'Simmer 15 minutes with herbs' }),
  ],
  'pumpkin-puree': [
    per('sweet-potato', 1, null, 1, 'cup', { note: 'Bake or steam, then mash' }),
    per('winter-squash', 1 / 3, null, 1, 'cup', { note: 'Roast, then mash' }),
  ],
  'red-lentils': [
    same('green-lentils', 1, { note: 'Simmer about 30 minutes; they hold their shape' }),
    per('chickpeas', 1.5, 'can', 1, 'cup', { note: 'Already cooked; mash some to thicken', context: 'Soups and curries' }),
  ],
  salsa: [
    per('diced-tomatoes', 1, 'can', 1.75, 'cup', { note: 'Drain; add chopped onion, lime, and a pinch of chili' }),
    same('mango', 1, { note: 'Dice with red onion and lime', context: 'Fruit salsa — as a topping' }),
  ],
  'tomato-paste': [same('tomato-sauce', 3, { note: 'Simmer to thicken' }), same('ketchup', 1, { context: 'Sweeter' })],
  'tomato-sauce': [
    same('marinara', 1, { context: 'Already seasoned' }),
    same('tomato-paste', 3 / 8, { note: 'Thin with ½ cup water per cup of sauce' }),
    per('diced-tomatoes', 1, 'can', 1.75, 'cup', { note: 'Blend smooth' }),
  ],
  'vegetable-broth': [
    same('chicken-broth'),
    per('miso', 1, 'tsp', 1, 'cup', { note: 'Dissolve in the same amount of hot water' }),
  ],
  applesauce: [per('banana', 2, null, 1, 'cup', { note: 'Mash well' }), same('pumpkin-puree')],
  capers: [same('kalamata-olives', 1, { note: 'Chop finely' })],
  'kalamata-olives': [same('capers', 0.5, { context: 'Saltier' })],

  // --- Oils, condiments, and baking -------------------------------------------
  'almond-extract': [same('vanilla-extract', 2, { context: 'Milder' })],
  brandy: [same('rum'), same('sherry'), same('apple-juice', 1, { context: 'No alcohol; sweeter' })],
  'cocoa-powder': [
    per('unsweetened-chocolate', 1, 'oz', 3, 'tbsp', { note: 'Melt; use 1 tbsp less butter or oil per ounce' }),
  ],
  cornmeal: [same('breadcrumbs', 1, { context: 'Coatings only' }), same('all-purpose-flour', 1, { context: 'Coatings and dusting only' })],
  'corn-syrup': [
    same('honey', 1, { context: 'May crystallize in candy' }),
    same('maple-syrup', 1, { context: 'May crystallize in candy' }),
  ],
  'dark-chocolate-chips': [
    per('unsweetened-chocolate', 3, 'oz', 1, 'cup', { with: [per('sugar', 6, 'tbsp', 1, 'cup')], note: 'Chop the chocolate; add the sugar to the batter' }),
    same('dried-cranberries', 1, { context: 'Mix-ins only' }),
    same('raisins', 1, { context: 'Mix-ins only' }),
  ],
  'fajita-seasoning': [
    same('chili-powder', 0.5, { with: [same('cumin', 0.25), same('garlic-powder', 1 / 8), same('paprika', 1 / 8)] }),
    same('cumin', 0.5, { with: [same('garlic-powder', 0.25), same('onion-powder', 0.25)], context: 'No heat' }),
  ],
  'fish-sauce': [
    same('soy-sauce', 1, { note: 'Add a squeeze of lime' }),
    same('worcestershire-sauce', 1, { context: COOKED }),
    same('oyster-sauce', 1, { context: 'Thicker and sweeter' }),
  ],
  'instant-coffee': [per('coffee', 0.25, 'cup', 1, 'tsp', { note: 'Brew it strong; use it in place of that much of the recipe’s liquid' })],
  miso: [same('soy-sauce', 0.5, { context: 'Saltier and thinner' }), same('tahini', 1, { with: [per('salt', 0.25, 'tsp', 1, 'tbsp')] })],
  molasses: [same('maple-syrup', 1, { context: 'Lighter flavor' }), same('honey', 1, { context: 'Lighter flavor' })],
  'orange-juice': [
    per('orange', 3, null, 1, 'cup', { note: 'Squeeze about 3 oranges per cup' }),
    same('apple-juice', 1, { context: 'Sweeter, less tart' }),
  ],
  'peanut-butter': [same('almond-butter'), same('tahini', 1, { context: 'Thinner and less sweet' })],
  'powdered-sugar': [same('sugar', 1, { with: [per('cornstarch', 1, 'tsp', 1, 'cup')], note: 'Blend in a blender until powdery' })],
  'pumpkin-pie-spice': [same('cinnamon', 0.5, { with: [same('ground-ginger', 0.25), same('nutmeg', 1 / 8), same('ground-cloves', 1 / 8)] })],
  'self-rising-flour': [
    same('all-purpose-flour', 1, { with: [per('baking-powder', 1.5, 'tsp', 1, 'cup'), per('salt', 0.25, 'tsp', 1, 'cup')] }),
  ],
  sherry: [
    same('white-wine'),
    same('chicken-broth', 1, { with: [per('cider-vinegar', 1, 'tbsp', 1, 'cup')], context: COOKED }),
    same('apple-juice', 1, { context: 'No alcohol; sweeter' }),
  ],
  shortening: [
    same('butter', 1, { context: 'Slightly less tender' }),
    same('margarine'),
    same('lard', 1, { context: BAKING }),
    same('vegetable-oil', 0.75, { context: 'Not for pie crust or creamed batters' }),
  ],
  tahini: [same('almond-butter'), same('peanut-butter')],
  'unsweetened-chocolate': [
    per('cocoa-powder', 3, 'tbsp', 1, 'oz', { with: [per('butter', 1, 'tbsp', 1, 'oz')] }),
    per('cocoa-powder', 3, 'tbsp', 1, 'oz', { with: [per('vegetable-oil', 1, 'tbsp', 1, 'oz')] }),
  ],
  'whole-wheat-flour': [same('all-purpose-flour', 1, { context: 'Lighter, less fiber' })],
  'wheat-bran': [same('oat-bran'), same('bran-cereal', 1, { note: 'Crush finely', context: 'Sweeter' })],
  'white-wine': [
    same('chicken-broth', 1, { with: [per('white-wine-vinegar', 1, 'tbsp', 1, 'cup')], context: COOKED }),
    same('vegetable-broth', 1, { with: [per('white-wine-vinegar', 1, 'tbsp', 1, 'cup')], context: COOKED }),
    same('sherry', 1, { context: 'Richer and nuttier' }),
    same('apple-juice', 1, { context: 'No alcohol; sweeter' }),
  ],

  // --- Nuts, seeds, and dried fruit -------------------------------------------
  almonds: [same('walnuts'), same('pecans'), same('pistachios')],
  pecans: [same('walnuts'), same('almonds')],
  'pine-nuts': [
    same('walnuts', 1, { note: 'Chop' }),
    same('almonds', 1, { note: 'Use slivered or chop' }),
    same('sunflower-seeds', 1, { context: 'Nut-free option' }),
  ],
  raisins: [same('dried-cranberries'), same('dates', 1, { note: 'Chop' }), same('dried-apricots', 1, { note: 'Chop' })],
  'sesame-seeds': [same('poppy-seeds', 1, { context: 'Garnish' }), same('peanuts', 1, { note: 'Chop finely', context: 'For crunch' })],
  'shredded-coconut': [same('rolled-oats', 1, { context: 'Baking and granola — no coconut flavor' }), same('pecans', 1, { note: 'Chop finely' })],
  walnuts: [same('pecans'), same('almonds'), same('peanuts')],
};

// Ingredients we deliberately give no substitute, with the reason (the coverage test accepts these).
export const NO_SUBSTITUTE: Record<string, string> = {
  yeast: 'Nothing else makes bread rise the same way',
};
