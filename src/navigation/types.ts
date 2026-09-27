import { Day, MealType } from '../types';

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  RecipeDetail: { recipeId: string; day?: Day; mealType?: MealType };
};

export type MainTabParamList = {
  Plan: undefined;
  Browse: undefined;
  Grocery: undefined;
  Favorites: undefined;
  Settings: undefined;
};
