export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type Diet = 'vegetarian' | 'chicken' | 'turkey' | 'fish';
export type DietPref = 'vegetarian' | 'mixed';

export interface Ingredient {
  name: string;
  amount: number;
  unit: string | null;
  category: string;
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
  ingredients: Ingredient[];
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

export interface ManualGroceryItem {
  id: string;
  name: string;
  category: string;
}

export interface GroceryState {
  checked: Record<string, boolean>;
  manualItems: ManualGroceryItem[];
}

export interface GroceryLine {
  name: string;
  unit: string | null;
  amount: number;
  category: string;
}
