export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type Diet = 'vegetarian' | 'chicken' | 'turkey' | 'fish';
export type DietPref = 'vegetarian' | 'mixed';

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

export type VolumeUnit = 'tsp' | 'tbsp' | 'cup';
export type WeightUnit = 'oz' | 'lb';
export type DiscreteUnit = 'can' | 'clove' | 'stalk' | 'head' | 'bunch' | 'slice' | 'pinch';
export type Unit = VolumeUnit | WeightUnit | DiscreteUnit;

export interface RecipeIngredient {
  id: string;
  amount: number;
  unit: Unit | null; // null = count ("2 carrots")
  prep?: string; // "diced", "hard-boiled" — shown in the recipe, ignored by the grocery list
}

export interface Recipe {
  id: string;
  title: string;
  mealType: MealType;
  diet: Diet;
  prep: number;
  cook: number;
  servings: number;
  emoji: string;
  ingredients: RecipeIngredient[];
  steps: string[];
}

export interface Preferences {
  householdSize: number;
  diet: DietPref;
  mealTypes: MealType[];
  onboardingComplete: boolean;
}

export interface PlanItem {
  id: string;
  recipeId: string;
  servings: number;
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

export interface GroceryState {
  checked: Record<string, boolean>;
  manualItems: ManualGroceryItem[];
}

export interface GroceryLine {
  key: string;
  ingredientId: string;
  name: string;
  unit: Unit | null;
  amount: number;
  aisle: Aisle;
  staple: boolean;
}
