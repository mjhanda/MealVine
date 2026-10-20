export type RootStackParamList = {
  Onboarding: undefined;
  RemoveAds: undefined;
  Main: undefined;
  // planItemId set = opened from the plan: servings edit that entry instead of adding a new one.
  RecipeDetail: { recipeId: string; planItemId?: string };
  // storeBought: the make/buy sauce choices when cooking a recipe that isn't in the plan.
  Cook: { recipeId: string; planItemId?: string; storeBought?: string[] };
};

export type MainTabParamList = {
  Plan: undefined;
  // swapItemId set = choosing a replacement for that plan entry.
  Browse: { swapItemId?: string } | undefined;
  Grocery: undefined;
  Favorites: undefined;
  Settings: undefined;
};
