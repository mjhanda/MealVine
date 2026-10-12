import { Basis } from './usdaMap';

export interface NutrientValues {
  kcal: number;
  protein: number; // g
  fat: number; // g
  satFat: number; // g
  carbs: number; // g
  fiber: number; // g
  sugar: number; // g
  sodium: number; // mg
}

export interface IngredientSource {
  basis: Basis;
  note?: string;
  refuse?: number;
  foods: { fdcId: number; description?: string; weight: number }[];
  missing?: (keyof NutrientValues)[]; // nutrients USDA doesn't report for this food (counted as 0)
}
