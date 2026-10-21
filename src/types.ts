export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | 'side';
// The main protein, shown as a label on recipe cards.
export type Protein = 'vegetarian' | 'chicken' | 'turkey' | 'fish' | 'beef' | 'pork' | 'lamb';
export type DietId = 'classic' | 'flexitarian' | 'pescetarian' | 'vegetarian' | 'vegan' | 'low-carb' | 'keto' | 'paleo';

export type Aisle =
  | 'Produce'
  | 'Meat & Seafood'
  | 'Dairy & Eggs'
  | 'Bakery & Bread'
  | 'Pasta, Rice & Grains'
  | 'Canned & Jarred'
  | 'Oils & Condiments'
  | 'Spices & Baking'
  | 'Snacks & Nuts'
  | 'Frozen'
  | 'Beverages'
  | 'Household'
  | 'Other';

export type AllergenTag =
  | 'gluten'
  | 'dairy'
  | 'egg'
  | 'peanut'
  | 'tree-nut'
  | 'soy'
  | 'sesame'
  | 'fish'
  | 'shellfish'
  | 'mustard'
  | 'sulfite'
  | 'nightshade';

// Non-allergen tags used to derive diets (see src/utils/diets.ts).
export type DietaryTag =
  | 'poultry'
  | 'red-meat'
  | 'pork'
  | 'honey'
  | 'grain'
  | 'legume'
  | 'starchy'
  | 'added-sugar'
  | 'fruit-sugar';

export type IngredientTag = AllergenTag | DietaryTag;

export interface IngredientDef {
  id: string;
  name: string;
  plural?: string;
  aisle: Aisle;
  tags: IngredientTag[];
  // Most kitchens already have it (oil, salt, spices); grocery list groups these separately.
  staple?: boolean;
}

export type VolumeUnit = 'pinch' | 'tsp' | 'tbsp' | 'cup';
export type WeightUnit = 'oz' | 'lb';
export type DiscreteUnit = 'can' | 'clove' | 'stalk' | 'head' | 'bunch' | 'slice';
export type Unit = VolumeUnit | WeightUnit | DiscreteUnit;

export interface RecipeIngredient {
  // A catalog ingredient id, or `custom:<slug>` for a free-text ingredient in a user's own recipe.
  id: string;
  // Free-text ingredients only: the name as the user wrote it. Not in the catalog, so it has no
  // aisle, allergen tags, or nutrition; it's shown as "not checked for allergies".
  custom?: string;
  amount: number;
  unit: Unit | null; // null = count ("2 carrots")
  prep?: string; // "diced", "hard-boiled" — shown in the recipe, ignored by the grocery list
}

// Where a recipe came from. Absent = a Dishcart original.
export interface RecipeSource {
  // adapted = ingredients/method reworked and instructions rewritten by us;
  // as-posted = the poster's own instructions (lightly cleaned), amounts converted to our units.
  // web = one of your own recipes, imported from a web page for personal use (T48).
  kind: 'adapted' | 'as-posted' | 'web';
  title: string; // original recipe title
  author: string; // poster's name as given (never their email address); may be '' for web imports
  posted?: string; // original posting date, e.g. "1993-08-17"
  collection: string; // e.g. "CMU Recipe Archive (rec.food.cooking)"
  url: string;
  license: string; // what we know about the rights, in plain words
  changes?: string; // substitutions or method changes made when adapting
}

export interface Recipe {
  id: string;
  title: string;
  mealType: MealType;
  protein: Protein;
  prep: number;
  cook: number;
  servings: number;
  emoji: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  source?: RecipeSource;
  // Baked goods, sauces, preserves: you make the whole batch, so a plan entry defaults to the
  // recipe's own yield instead of the household size.
  batch?: boolean;
}

export interface Preferences {
  householdSize: number;
  diet: DietId;
  allergies: AllergenTag[];
  dislikes: string[]; // canonical ingredient ids
  mealTypes: MealType[];
  onboardingComplete: boolean;
}

export interface PlanItem {
  id: string;
  recipeId: string;
  servings: number;
  // Bottled sauces (ingredient ids) this entry buys instead of making from scratch; any sauce with
  // a make-it-yourself recipe (src/data/homemade.ts) that isn't listed is made. Since plan v2.
  storeBought?: string[];
}

export interface MealPlan {
  items: PlanItem[];
}

export interface CookedEntry {
  id: string;
  recipeId: string;
  servings: number;
  cookedAt: number; // epoch ms
}

export interface ManualGroceryItem {
  id: string;
  name: string;
  aisle: Aisle;
}

// Per-ingredient override of the catalog's `staple` flag: 'have' = always in my pantry,
// 'need' = staple I still want on the list. Absent = use the catalog default.
export type PantryOverride = 'have' | 'need';

export interface GroceryState {
  checked: Record<string, boolean>;
  manualItems: ManualGroceryItem[];
  pantry: Record<string, PantryOverride>;
}

export interface GroceryLine {
  key: string;
  ingredientId: string;
  name: string;
  unit: Unit | null;
  amount: number;
  aisle: Aisle;
  staple: boolean;
  // A free-text ingredient from a user's own recipe: not checked for allergies.
  unverified?: boolean;
  // Which plan entries need this ingredient, in plan order, each in its own readable unit
  // (scaled to that entry's servings). Computed from the plan; never persisted.
  uses: GroceryUse[];
}

export interface GroceryUse {
  planItemId: string;
  recipeId: string;
  amount: number;
  unit: Unit | null;
}
