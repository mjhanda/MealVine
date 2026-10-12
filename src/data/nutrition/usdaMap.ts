// Canonical ingredient → USDA FoodData Central source food(s).
//
// Source: U.S. Department of Agriculture, Agricultural Research Service. FoodData Central,
// SR Legacy (April 2018), fdc.nal.usda.gov. Public domain. Nutrient values are per 100 g of the
// food as described (raw unless the description says otherwise).
//
// `parts` with more than one entry is a weighted composite (weights sum to 1); a part with
// fdcId 0 is water (no nutrients). `basis` says how faithful the mapping is:
//   usda      — a direct USDA match
//   composite — built from USDA components (e.g. a spice blend)
//   proxy     — the closest USDA food for something USDA doesn't list
//   estimate  — no reasonable USDA food; values in ESTIMATES (from typical store labels)
// `refuse` is the inedible fraction of the purchased weight (e.g. edamame pods).
// Edit this file, then run `npm run nutrition:build` to regenerate nutritionData.ts.

export type Basis = 'usda' | 'composite' | 'proxy' | 'estimate';

export interface UsdaMapping {
  parts: { fdcId: number; weight: number }[];
  basis: Basis;
  note?: string;
  refuse?: number;
}

const one = (fdcId: number, basis: Basis = 'usda', note?: string): UsdaMapping => ({ parts: [{ fdcId, weight: 1 }], basis, note });

export const USDA_MAP: Record<string, UsdaMapping> = {
  // Produce
  apple: one(171688),
  asparagus: one(168389),
  avocado: one(171705),
  'baby-potatoes': one(170029),
  'baby-spinach': one(168462),
  banana: one(173944),
  beet: one(169145),
  'bell-pepper': one(170108, 'usda', 'Red bell pepper'),
  blueberries: one(171711),
  'bok-choy': one(170390),
  'broccoli-florets': one(170379),
  'butter-lettuce': one(168429),
  cantaloupe: one(169092),
  carrot: one(170393),
  'cauliflower-florets': one(169986),
  celery: one(169988),
  'cherry-tomatoes': one(170457),
  chives: one(169994),
  'corn-kernels': one(169998),
  cucumber: one(168409),
  dill: one(172233),
  'edamame-pods': { parts: [{ fdcId: 168410, weight: 1 }], basis: 'usda', refuse: 0.5, note: 'About half the weight of pods is the inedible shell' },
  'edamame-shelled': one(168410),
  eggplant: one(169228),
  basil: one(172232),
  garlic: one(169230),
  ginger: one(169231),
  'green-beans': one(169961),
  'green-onion': one(170005),
  jalapeno: one(168576),
  kale: one(168421),
  lemon: one(167746),
  lime: one(168155),
  mango: one(169910),
  mint: one(173475),
  'mixed-berries': {
    parts: [
      { fdcId: 167762, weight: 0.25 },
      { fdcId: 171711, weight: 0.25 },
      { fdcId: 167755, weight: 0.25 },
      { fdcId: 173946, weight: 0.25 },
    ],
    basis: 'composite',
    note: 'Equal parts strawberries, blueberries, raspberries, blackberries',
  },
  'mixed-greens': one(169249, 'proxy', 'Green leaf lettuce'),
  parsley: one(170416),
  peach: one(169928),
  'pineapple-chunks': one(169124),
  portobello: one(169255),
  potato: one(170026),
  raspberries: one(167755),
  'red-cabbage': one(169977),
  'red-onion': one(170000),
  romaine: one(169247),
  rosemary: one(173473),
  strawberries: one(167762),
  'sweet-potato': one(168482),
  tomato: one(170457),
  'yellow-onion': one(170000),
  zucchini: one(169291),

  // Meat & Seafood
  'chicken-breast': one(171077),
  'chicken-thighs': one(173627),
  cod: one(171955),
  'deli-turkey': one(172941),
  'firm-tofu': one(172475),
  'ground-beef': one(174030),
  sirloin: one(174055),
  'pork-tenderloin': one(168249),
  'pork-chops': one(168263),
  'ground-chicken': one(171116),
  'ground-turkey': one(172847, 'usda', 'Fat-free ground turkey (breast)'),
  salmon: one(175167),
  shrimp: one(175179),
  'smoked-salmon': one(173687),
  'turkey-breast': one(174515),
  'turkey-sausage': one(174617),

  // Dairy & Eggs
  cheddar: one(173414),
  'cottage-cheese': one(172182, 'usda', '2% milkfat'),
  'cream-cheese': one(173418),
  eggs: one(171287),
  feta: one(173420),
  'fresh-mozzarella': one(170845),
  'greek-yogurt': one(170903, 'usda', 'Low-fat plain Greek yogurt'),
  hummus: one(174289),
  milk: one(171267, 'usda', '2% dairy milk; plant milks vary'),
  mozzarella: one(170900),
  parmesan: one(171247),
  ricotta: one(171248, 'usda', 'Part-skim'),

  // Bakery & Bread
  bagel: one(167533),
  'corn-tortilla': one(175036),
  flatbread: one(174916, 'proxy', 'Whole-wheat pita'),
  'flour-tortilla': one(175037),
  pita: one(174916),
  'whole-grain-bread': one(168013),
  'whole-wheat-tortilla': one(174081),

  // Pasta, Rice & Grains (dry unless "cooked")
  'brown-rice': one(169703),
  'cooked-brown-rice': one(169704),
  'cooked-white-rice': one(168878),
  'egg-noodles': one(169731),
  'lasagna-noodles': one(169736),
  quinoa: one(168874),
  'rolled-oats': one(173904),
  soba: one(168906),
  'white-rice': one(168877),
  'whole-wheat-orzo': one(169738),
  'whole-wheat-penne': one(169738),
  'whole-wheat-spaghetti': one(169738),

  // Canned & Jarred
  'black-beans': one(175188),
  capers: one(172238),
  'chicken-broth': one(174536),
  chickpeas: one(173800, 'usda', 'Drained'),
  'coconut-milk': {
    parts: [
      { fdcId: 170173, weight: 0.5 },
      { fdcId: 0, weight: 0.5 },
    ],
    basis: 'composite',
    note: 'Light coconut milk modelled as canned coconut milk diluted 1:1 with water',
  },
  'diced-tomatoes': one(170051),
  'enchilada-sauce': one(174074),
  'green-lentils': one(172420),
  'kalamata-olives': one(169094, 'proxy', 'Ripe olives; kalamatas are similar'),
  'kidney-beans': one(174285, 'usda', 'Drained'),
  marinara: one(171192),
  'red-lentils': one(174284),
  tuna: one(173709, 'usda', 'Light tuna in water, drained'),
  'vegetable-broth': one(171583),
  'white-beans': one(175204),

  // Oils & Condiments
  'balsamic-glaze': { parts: [], basis: 'estimate', note: 'No USDA entry; typical store-label values' },
  'balsamic-vinegar': one(172241),
  'caesar-dressing': one(169877, 'usda', 'Low-calorie Caesar dressing'),
  'cocktail-sauce': one(174067),
  honey: one(169640),
  'maple-syrup': one(169661),
  miso: one(172442),
  'olive-oil': one(171413),
  'peanut-butter': one(174294),
  'peanut-sauce': one(174070),
  pesto: one(171582),
  'rice-vinegar': one(172237, 'proxy', 'Distilled vinegar'),
  salsa: one(174524),
  'sesame-oil': one(171016),
  'soy-sauce': one(172473),
  tahini: one(170189),
  'almond-butter': one(168588),

  // Spices & Baking
  'baking-powder': one(172804),
  'black-pepper': one(170931),
  'chili-powder': one(171319),
  cinnamon: one(171320),
  cumin: one(170923),
  'curry-powder': one(170924),
  'dark-chocolate-chips': one(170271, 'usda', '45–59% cacao'),
  'dried-oregano': one(171328),
  'dried-thyme': one(170938),
  'fajita-seasoning': one(171319, 'proxy', 'Chili powder'),
  'garam-masala': {
    parts: [
      { fdcId: 170923, weight: 0.4 },
      { fdcId: 170931, weight: 0.2 },
      { fdcId: 171320, weight: 0.2 },
      { fdcId: 170926, weight: 0.2 },
    ],
    basis: 'composite',
    note: 'Cumin, black pepper, cinnamon, ginger',
  },
  'garlic-powder': one(171325),
  'italian-seasoning': {
    parts: [
      { fdcId: 171328, weight: 0.4 },
      { fdcId: 171317, weight: 0.3 },
      { fdcId: 170938, weight: 0.3 },
    ],
    basis: 'composite',
    note: 'Oregano, basil, thyme',
  },
  paprika: one(171329),
  'red-pepper-flakes': one(170932),
  salt: one(173468),
  'smoked-paprika': one(171329, 'proxy', 'Paprika'),
  zaatar: {
    parts: [
      { fdcId: 170938, weight: 0.6 },
      { fdcId: 170151, weight: 0.35 },
      { fdcId: 173468, weight: 0.05 },
    ],
    basis: 'composite',
    note: 'Thyme, toasted sesame, salt (sumac has no USDA entry)',
  },
  breadcrumbs: one(174928),

  // Snacks & Nuts
  'chia-seeds': one(170554),
  crackers: one(172749),
  croutons: one(172751),
  'dried-cranberries': one(171723),
  granola: one(171646),
  'mixed-nuts': one(168599),
  'rice-cakes': one(169680),
  'sesame-seeds': one(170151),
  almonds: one(170567),
  walnuts: one(170187),

  // Frozen
  falafel: one(172455),
  'peas-and-carrots': one(170425),
};

// Per 100 g, for 'estimate' mappings only.
export const ESTIMATES: Record<string, { kcal: number; protein: number; fat: number; satFat: number; carbs: number; fiber: number; sugar: number; sodium: number }> = {
  'balsamic-glaze': { kcal: 240, protein: 0.5, fat: 0, satFat: 0, carbs: 58, fiber: 0, sugar: 52, sodium: 30 },
};

// Grams per recipe unit, hand-picked from USDA food_portion data (the portion each value came
// from is noted when it isn't obvious). The builder derives other volume units from any one
// given (1 cup = 16 tbsp = 48 tsp). `null` = one whole item, as the recipes count it.
// Fixed purchase sizes (cans) and units USDA doesn't list are marked "label" or "est.".
export const GRAMS: Record<string, Partial<Record<string, number>>> = {
  'almond-butter': { tbsp: 16 },
  almonds: { cup: 143 }, // whole
  apple: { null: 182 }, // medium
  asparagus: { bunch: 450 }, // est. ~1 lb bunch
  avocado: { null: 201 },
  'baby-spinach': { cup: 30 },
  bagel: { null: 98 },
  'baking-powder': { tsp: 4.6 },
  'balsamic-glaze': { tbsp: 20 }, // label
  'balsamic-vinegar': { tbsp: 16 },
  banana: { null: 118 }, // medium
  basil: { cup: 24 }, // 1/4 cup leaves = 6 g
  beet: { null: 82 },
  'bell-pepper': { null: 119 }, // medium
  'black-beans': { can: 260 }, // label: 15 oz can
  'black-pepper': { pinch: 0.1, tsp: 2.3 },
  blueberries: { cup: 148 },
  'bok-choy': { null: 100 }, // est. one baby bok choy
  breadcrumbs: { cup: 108 },
  'broccoli-florets': { cup: 91 },
  'brown-rice': { cup: 185 },
  'butter-lettuce': { head: 163 },
  'caesar-dressing': { tbsp: 15 },
  cantaloupe: { cup: 160 }, // cubes
  capers: { tbsp: 8.6 },
  carrot: { null: 61 }, // medium
  'cauliflower-florets': { cup: 107 },
  celery: { stalk: 40 }, // medium stalk
  cheddar: { cup: 113 }, // shredded
  'cherry-tomatoes': { cup: 149 },
  'chia-seeds': { tbsp: 12 }, // 1 oz ≈ 2⅓ tbsp
  'chicken-broth': { cup: 249 },
  chickpeas: { can: 246 }, // label: 15 oz can, drained
  'chili-powder': { tsp: 2.7 },
  chives: { tbsp: 3 },
  cinnamon: { tsp: 2.6 },
  'cocktail-sauce': { cup: 240 },
  'coconut-milk': { can: 400 }, // label: 13.5 fl oz
  'cooked-brown-rice': { cup: 202 },
  'cooked-white-rice': { cup: 158 },
  'corn-kernels': { cup: 145 },
  'corn-tortilla': { null: 24 },
  'cottage-cheese': { cup: 226 },
  crackers: { null: 4.6 },
  croutons: { cup: 30 },
  cucumber: { null: 301 },
  cumin: { tsp: 2.1 },
  'curry-powder': { tsp: 2 },
  'dark-chocolate-chips': { tbsp: 10.6 }, // est. 1 cup chips ≈ 170 g
  'diced-tomatoes': { can: 411 }, // label: 14.5 oz
  dill: { tbsp: 0.6 }, // 1 cup sprigs = 8.9 g
  'dried-cranberries': { cup: 160 }, // 1/4 cup = 40 g
  'dried-oregano': { tsp: 1 },
  'dried-thyme': { tsp: 1 },
  'edamame-shelled': { cup: 118 },
  eggplant: { null: 548 }, // ~1¼ lb, unpeeled
  eggs: { null: 50 }, // large
  'enchilada-sauce': { cup: 224 },
  'fajita-seasoning': { tsp: 2.7 },
  falafel: { null: 17 }, // one patty
  feta: { cup: 150 }, // crumbled
  flatbread: { null: 64 },
  'flour-tortilla': { null: 72 }, // ~10" tortilla
  'garam-masala': { tsp: 2.1 },
  garlic: { clove: 3 },
  'garlic-powder': { tsp: 3.1 },
  ginger: { tsp: 2 },
  granola: { cup: 122 },
  'greek-yogurt': { cup: 245 },
  'green-beans': { cup: 100 },
  'green-lentils': { cup: 192 },
  'green-onion': { null: 15 }, // medium
  honey: { tbsp: 21 },
  hummus: { cup: 246 },
  'italian-seasoning': { tsp: 1 },
  jalapeno: { null: 14 },
  'kalamata-olives': { tbsp: 8.4 },
  kale: { cup: 21 },
  'kidney-beans': { can: 256 }, // label: 15 oz can, drained
  lemon: { null: 84 },
  lime: { null: 67 },
  mango: { cup: 165 },
  'maple-syrup': { tbsp: 20 },
  marinara: { cup: 264 }, // 1/2 cup = 132 g
  milk: { cup: 244 },
  mint: { tbsp: 5.7 }, // 2 tbsp = 11.4 g
  miso: { tbsp: 17 },
  'mixed-berries': { cup: 140 }, // average of the four berries' cups
  'mixed-greens': { cup: 36 },
  'mixed-nuts': { cup: 137 },
  mozzarella: { cup: 86 },
  'olive-oil': { tbsp: 13.5 },
  paprika: { tsp: 2.3 },
  parmesan: { cup: 100 },
  parsley: { cup: 60 },
  peach: { null: 150 }, // medium
  'peanut-butter': { tbsp: 16 },
  'peanut-sauce': { tbsp: 18 },
  'peas-and-carrots': { cup: 140 },
  pesto: { cup: 248 }, // 1/4 cup = 62 g
  'pineapple-chunks': { cup: 165 },
  pita: { null: 64 },
  portobello: { null: 84 },
  potato: { null: 213 }, // medium
  quinoa: { cup: 170 },
  raspberries: { cup: 123 },
  'red-cabbage': { cup: 89 },
  'red-lentils': { cup: 192 },
  'red-onion': { null: 110 }, // medium
  'red-pepper-flakes': { pinch: 0.15 },
  'rice-cakes': { null: 9 },
  'rice-vinegar': { tbsp: 14.9 },
  ricotta: { cup: 246 },
  'rolled-oats': { cup: 81 },
  romaine: { head: 626 },
  rosemary: { tbsp: 1.7 },
  salsa: { cup: 259 },
  salt: { pinch: 0.36 },
  'sesame-oil': { tsp: 4.5 },
  'sesame-seeds': { tsp: 3 },
  'smoked-paprika': { tsp: 2.3 },
  'soy-sauce': { tbsp: 14.2 },
  strawberries: { cup: 144 },
  'sweet-potato': { null: 130 },
  tahini: { tbsp: 15 },
  tomato: { null: 123 }, // medium
  tuna: { can: 113 }, // label: 5 oz can, drained
  'vegetable-broth': { cup: 221 },
  walnuts: { cup: 117 }, // chopped
  'white-beans': { can: 260 }, // label: 15 oz can
  'white-rice': { cup: 185 },
  'whole-grain-bread': { slice: 26 },
  'whole-wheat-orzo': { cup: 170 }, // est. orzo is denser than other shapes
  'whole-wheat-tortilla': { null: 41 },
  'yellow-onion': { null: 110 }, // medium
  zaatar: { tsp: 1 },
  zucchini: { null: 196 }, // medium
};
