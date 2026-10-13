import { Aisle, IngredientDef, IngredientTag } from '../types';

// Canonical ingredient catalog. Recipes reference these by `id`; never rename an id
// (persisted grocery check-offs are keyed by it).
//
// Tagging rules:
// - Allergen tags are CONSERVATIVE: if a typical store product may contain the allergen,
//   tag it (e.g. oats → gluten, dark chocolate chips → dairy). A missed tag is a safety bug;
//   an extra tag only hides a recipe.
// - Diet tags (poultry, grain, legume, added-sugar, …) drive derived diets in src/utils/diets.ts.

type Def = [id: string, name: string, aisle: Aisle, tags?: IngredientTag[], extra?: Partial<IngredientDef>];

const P: Aisle = 'Produce';
const M: Aisle = 'Meat & Seafood';
const D: Aisle = 'Dairy & Eggs';
const B: Aisle = 'Bakery & Bread';
const G: Aisle = 'Pasta, Rice & Grains';
const C: Aisle = 'Canned & Jarred';
const O: Aisle = 'Oils & Condiments';
const S: Aisle = 'Spices & Baking';
const N: Aisle = 'Snacks & Nuts';
const F: Aisle = 'Frozen';

const staple = { staple: true } as const;
const plural = (p: string) => ({ plural: p });

const DEFS: Def[] = [
  // Produce
  ['apple', 'Apple', P, ['fruit-sugar'], plural('Apples')],
  ['asparagus', 'Asparagus', P],
  ['avocado', 'Avocado', P, [], plural('Avocados')],
  ['baby-potatoes', 'Baby potatoes', P, ['nightshade', 'starchy']],
  ['baby-spinach', 'Baby spinach', P],
  ['banana', 'Banana', P, ['fruit-sugar'], plural('Bananas')],
  ['beet', 'Beet', P, ['starchy'], plural('Beets')],
  ['bell-pepper', 'Bell pepper', P, ['nightshade'], plural('Bell peppers')],
  ['blueberries', 'Blueberries', P],
  ['bok-choy', 'Bok choy', P],
  ['snow-peas', 'Snow peas', P],
  ['broccoli-florets', 'Broccoli florets', P],
  ['butter-lettuce', 'Butter lettuce', P],
  ['cantaloupe', 'Cantaloupe', P, ['fruit-sugar']],
  ['carrot', 'Carrot', P, [], plural('Carrots')],
  ['cauliflower-florets', 'Cauliflower florets', P],
  ['celery', 'Celery', P],
  ['cherry-tomatoes', 'Cherry tomatoes', P, ['nightshade']],
  ['chives', 'Fresh chives', P],
  ['corn-kernels', 'Corn kernels', P, ['grain', 'starchy']],
  ['cucumber', 'Cucumber', P, [], plural('Cucumbers')],
  ['dill', 'Fresh dill', P],
  ['edamame-pods', 'Edamame in pods', F, ['soy', 'legume']],
  ['edamame-shelled', 'Shelled edamame', F, ['soy', 'legume']],
  ['eggplant', 'Eggplant', P, ['nightshade'], plural('Eggplants')],
  ['basil', 'Fresh basil', P],
  ['garlic', 'Garlic', P],
  ['ginger', 'Fresh ginger', P],
  ['green-beans', 'Green beans', P],
  ['green-onion', 'Green onion', P, [], plural('Green onions')],
  ['jalapeno', 'Jalapeño', P, ['nightshade'], plural('Jalapeños')],
  ['kale', 'Kale', P],
  ['lemon', 'Lemon', P, [], plural('Lemons')],
  ['lime', 'Lime', P, [], plural('Limes')],
  ['mango', 'Mango', P, ['fruit-sugar']],
  ['mint', 'Fresh mint', P],
  ['mixed-berries', 'Mixed berries', P],
  ['mixed-greens', 'Mixed greens', P],
  ['parsley', 'Fresh parsley', P],
  ['peach', 'Peach', P, ['fruit-sugar'], plural('Peaches')],
  ['pineapple-chunks', 'Pineapple chunks', P, ['fruit-sugar']],
  ['portobello', 'Portobello mushroom', P, [], plural('Portobello mushrooms')],
  ['potato', 'Potato', P, ['nightshade', 'starchy'], plural('Potatoes')],
  ['raspberries', 'Raspberries', P],
  ['red-cabbage', 'Red cabbage', P],
  ['red-onion', 'Red onion', P, [], plural('Red onions')],
  ['romaine', 'Romaine lettuce', P],
  ['rosemary', 'Fresh rosemary', P],
  ['strawberries', 'Strawberries', P],
  ['sweet-potato', 'Sweet potato', P, ['starchy'], plural('Sweet potatoes')],
  ['tomato', 'Tomato', P, ['nightshade'], plural('Tomatoes')],
  ['yellow-onion', 'Yellow onion', P, [], plural('Yellow onions')],
  ['zucchini', 'Zucchini', P, [], plural('Zucchini')],

  // Meat & Seafood
  ['chicken-breast', 'Chicken breast', M, ['poultry']],
  ['chicken-thighs', 'Chicken thighs', M, ['poultry']],
  ['cod', 'Cod fillets', M, ['fish']],
  ['deli-turkey', 'Sliced deli turkey', M, ['poultry']],
  ['firm-tofu', 'Firm tofu', M, ['soy', 'legume']],
  ['ground-beef', 'Lean ground beef (90%)', M, ['red-meat']],
  ['sirloin', 'Top sirloin steak', M, ['red-meat']],
  ['pork-tenderloin', 'Pork tenderloin', M, ['pork']],
  ['pork-chops', 'Boneless pork chops', M, ['pork']],
  ['ground-chicken', 'Ground chicken breast', M, ['poultry']],
  ['ground-turkey', 'Ground turkey breast', M, ['poultry']],
  ['salmon', 'Salmon fillets', M, ['fish']],
  ['shrimp', 'Shrimp, peeled', M, ['shellfish']],
  ['smoked-salmon', 'Smoked salmon', M, ['fish']],
  ['turkey-breast', 'Turkey breast cutlets', M, ['poultry']],
  ['turkey-sausage', 'Lean turkey sausage', M, ['poultry']],

  // Dairy & Eggs
  ['cheddar', 'Shredded cheddar', D, ['dairy']],
  ['cottage-cheese', 'Cottage cheese', D, ['dairy']],
  ['cream-cheese', 'Cream cheese', D, ['dairy']],
  ['eggs', 'Eggs', D, ['egg']],
  ['feta', 'Feta cheese', D, ['dairy']],
  ['fresh-mozzarella', 'Fresh mozzarella', D, ['dairy']],
  ['greek-yogurt', 'Plain Greek yogurt', D, ['dairy']],
  ['hummus', 'Hummus', D, ['sesame', 'legume']],
  ['milk', 'Milk (or milk alternative)', D, ['dairy']],
  ['mozzarella', 'Shredded mozzarella', D, ['dairy']],
  ['parmesan', 'Grated parmesan', D, ['dairy']],
  ['ricotta', 'Ricotta', D, ['dairy']],

  // Bakery & Bread
  ['bagel', 'Whole wheat bagel', B, ['gluten', 'grain'], plural('Whole wheat bagels')],
  ['corn-tortilla', 'Corn tortilla', B, ['grain'], plural('Corn tortillas')],
  ['flatbread', 'Whole wheat flatbread', B, ['gluten', 'grain'], plural('Whole wheat flatbreads')],
  ['flour-tortilla', 'Large flour tortilla', B, ['gluten', 'grain'], plural('Large flour tortillas')],
  ['pita', 'Whole wheat pita', B, ['gluten', 'grain'], plural('Whole wheat pitas')],
  ['whole-grain-bread', 'Whole grain bread', B, ['gluten', 'grain']],
  ['whole-wheat-tortilla', 'Whole wheat tortilla', B, ['gluten', 'grain'], plural('Whole wheat tortillas')],

  // Pasta, Rice & Grains
  ['brown-rice', 'Brown rice', G, ['grain', 'starchy']],
  ['bulgur', 'Bulgur wheat', G, ['gluten', 'grain', 'starchy']],
  ['cooked-brown-rice', 'Cooked brown rice (or microwave pouch)', G, ['grain', 'starchy']],
  ['cooked-white-rice', 'Cooked white rice (or microwave pouch)', G, ['grain', 'starchy']],
  ['egg-noodles', 'Egg noodles', G, ['gluten', 'egg', 'grain', 'starchy']],
  ['lasagna-noodles', 'Lasagna noodles', G, ['gluten', 'grain', 'starchy']],
  ['quinoa', 'Quinoa', G, ['grain', 'starchy']],
  ['rolled-oats', 'Rolled oats', G, ['gluten', 'grain', 'starchy']],
  ['soba', 'Soba noodles', G, ['gluten', 'grain', 'starchy']],
  ['white-rice', 'Long-grain white rice', G, ['grain', 'starchy']],
  ['whole-wheat-orzo', 'Whole wheat orzo', G, ['gluten', 'grain', 'starchy']],
  ['whole-wheat-penne', 'Whole wheat penne', G, ['gluten', 'grain', 'starchy']],
  ['whole-wheat-spaghetti', 'Whole wheat spaghetti', G, ['gluten', 'grain', 'starchy']],

  // Canned & Jarred
  ['black-beans', 'Black beans (15 oz can)', C, ['legume', 'starchy']],
  ['capers', 'Capers', C],
  ['chicken-broth', 'Chicken broth', C, ['poultry']],
  ['chickpeas', 'Chickpeas (15 oz can)', C, ['legume', 'starchy']],
  ['coconut-milk', 'Light coconut milk (13.5 oz can)', C],
  ['diced-tomatoes', 'Diced tomatoes (14.5 oz can)', C, ['nightshade']],
  ['tomato-paste', 'Tomato paste', C, ['nightshade']],
  ['tomato-sauce', 'Tomato sauce', C, ['nightshade']],
  ['sun-dried-tomatoes', 'Sun-dried tomato', C, ['nightshade', 'sulfite'], plural('Sun-dried tomatoes')],
  ['enchilada-sauce', 'Enchilada sauce', C, ['nightshade', 'gluten', 'added-sugar']],
  ['green-lentils', 'Green lentils', C, ['legume', 'starchy']],
  ['kalamata-olives', 'Kalamata olives', C],
  ['kidney-beans', 'Kidney beans (15 oz can)', C, ['legume', 'starchy']],
  ['marinara', 'Marinara sauce', C, ['nightshade', 'added-sugar']],
  ['red-lentils', 'Red lentils', C, ['legume', 'starchy']],
  ['tuna', 'Tuna in water (5 oz can)', C, ['fish']],
  ['vegetable-broth', 'Vegetable broth', C],
  ['white-beans', 'White beans (15 oz can)', C, ['legume', 'starchy']],

  // Oils & Condiments
  ['balsamic-glaze', 'Balsamic glaze', O, ['sulfite', 'added-sugar'], staple],
  ['balsamic-vinegar', 'Balsamic vinegar', O, ['sulfite'], staple],
  ['caesar-dressing', 'Light Caesar dressing', O, ['fish', 'egg', 'dairy', 'mustard']],
  ['cocktail-sauce', 'Cocktail sauce', O, ['nightshade', 'added-sugar']],
  ['cider-vinegar', 'Apple cider vinegar', O, ['sulfite'], staple],
  ['fish-sauce', 'Fish sauce', O, ['fish']],
  ['oyster-sauce', 'Oyster sauce', O, ['shellfish', 'gluten', 'soy', 'legume', 'added-sugar']],
  ['honey', 'Honey', O, ['honey', 'added-sugar'], staple],
  ['maple-syrup', 'Maple syrup', O, ['added-sugar'], staple],
  ['miso', 'Miso paste', O, ['soy', 'legume']],
  ['olive-oil', 'Olive oil', O, [], staple],
  ['peanut-butter', 'Peanut butter', O, ['peanut', 'legume']],
  ['peanut-sauce', 'Peanut sauce', O, ['peanut', 'legume', 'soy', 'gluten', 'added-sugar']],
  ['pesto', 'Basil pesto', O, ['dairy', 'tree-nut']],
  ['rice-vinegar', 'Rice vinegar', O, [], staple],
  ['salsa', 'Salsa', O, ['nightshade']],
  ['sesame-oil', 'Toasted sesame oil', O, ['sesame'], staple],
  ['soy-sauce', 'Low-sodium soy sauce', O, ['soy', 'legume', 'gluten'], staple],
  ['tahini', 'Tahini', O, ['sesame']],
  ['almond-butter', 'Almond butter', O, ['tree-nut']],

  // Spices & Baking
  ['baking-powder', 'Baking powder', S, [], staple],
  ['black-pepper', 'Black pepper', S, [], staple],
  ['chili-powder', 'Chili powder', S, ['nightshade'], staple],
  ['cayenne', 'Ground cayenne pepper', S, ['nightshade'], staple],
  ['coriander', 'Ground coriander', S, [], staple],
  ['cinnamon', 'Ground cinnamon', S, [], staple],
  ['cumin', 'Ground cumin', S, [], staple],
  ['curry-powder', 'Curry powder', S, ['nightshade', 'mustard'], staple],
  ['dark-chocolate-chips', 'Dark chocolate chips', S, ['dairy', 'soy', 'added-sugar']],
  ['dried-oregano', 'Dried oregano', S, [], staple],
  ['dried-thyme', 'Dried thyme', S, [], staple],
  ['fajita-seasoning', 'Fajita seasoning', S, ['nightshade']],
  ['garam-masala', 'Garam masala', S, [], staple],
  ['garlic-powder', 'Garlic powder', S, [], staple],
  ['italian-seasoning', 'Italian seasoning', S, [], staple],
  ['paprika', 'Paprika', S, ['nightshade'], staple],
  ['red-pepper-flakes', 'Red pepper flakes', S, ['nightshade'], staple],
  ['salt', 'Salt', S, [], staple],
  ['smoked-paprika', 'Smoked paprika', S, ['nightshade'], staple],
  ['zaatar', "Za'atar", S, ['sesame']],
  ['breadcrumbs', 'Whole wheat breadcrumbs', S, ['gluten', 'grain']],

  // Snacks & Nuts
  ['chia-seeds', 'Chia seeds', N],
  ['crackers', 'Whole wheat crackers', N, ['gluten', 'grain']],
  ['croutons', 'Whole grain croutons', N, ['gluten', 'grain', 'dairy']],
  ['dried-cranberries', 'Dried cranberries', N, ['sulfite', 'added-sugar', 'fruit-sugar']],
  ['granola', 'Granola', N, ['gluten', 'grain', 'tree-nut', 'honey', 'added-sugar']],
  ['mixed-nuts', 'Mixed nuts', N, ['tree-nut', 'peanut', 'legume']],
  ['rice-cakes', 'Whole grain rice cakes', N, ['grain', 'starchy']],
  ['sesame-seeds', 'Toasted sesame seeds', N, ['sesame']],
  ['almonds', 'Almonds', N, ['tree-nut']],
  ['walnuts', 'Walnuts', N, ['tree-nut']],

  // Frozen
  ['falafel', 'Frozen falafel', F, ['legume', 'gluten', 'sesame']],
  ['peas-and-carrots', 'Frozen peas and carrots', F, ['legume', 'starchy']],
];

export const INGREDIENTS: Record<string, IngredientDef> = Object.fromEntries(
  DEFS.map(([id, name, aisle, tags = [], extra = {}]) => [id, { id, name, aisle, tags, ...extra }])
);

export function ingredientById(id: string): IngredientDef | undefined {
  return INGREDIENTS[id];
}
