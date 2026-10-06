export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  // planItemId set = opened from the plan: servings edit that entry instead of adding a new one.
  RecipeDetail: { recipeId: string; planItemId?: string };
};

export type MainTabParamList = {
  Plan: undefined;
  // swapItemId set = choosing a replacement for that plan entry.
  Browse: { swapItemId?: string } | undefined;
  Grocery: undefined;
  Favorites: undefined;
  Settings: undefined;
};
