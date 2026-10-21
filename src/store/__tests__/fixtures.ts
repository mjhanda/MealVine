// Real on-disk shapes written by previous app versions (zustand persist envelope).

// v1 app (weekly grid, unversioned → zustand version 0).
export const weeklyPlanV0 = {
  state: {
    plan: { entries: { mon: { breakfast: 'r1', dinner: 'r2' }, tue: {}, wed: { lunch: 'r3' } } },
    hasHydrated: true,
  },
  version: 0,
};

// v2 app (flat list, unversioned → zustand version 0).
export const listPlanV0 = {
  state: { plan: { items: [{ id: 'item-1', recipeId: 'r5', servings: 3 }] }, hasHydrated: true },
  version: 0,
};

// Plan v1 (versioned list, before make-it-yourself sauces): r8 uses bottled Caesar dressing,
// r22 uses bottled marinara, r1 has no bottled sauce.
export const planV1 = {
  state: {
    plan: {
      items: [
        { id: 'item-1', recipeId: 'r8', servings: 2 },
        { id: 'item-2', recipeId: 'r22', servings: 3 },
        { id: 'item-3', recipeId: 'r1', servings: 2 },
      ],
    },
  },
  version: 1,
};

export const preferencesV0 = {
  state: { householdSize: 4, diet: 'vegetarian', mealTypes: ['dinner'], onboardingComplete: true, hasHydrated: true },
  version: 0,
};

export const groceryV0 = {
  state: { checked: { 'Garlic__clove': true }, manualItems: [{ id: 'manual-1', name: 'Paper towels', category: 'Pantry & Canned' }] },
  version: 0,
};

export const favoritesV0 = { state: { favorites: ['r1', 'r7'] }, version: 0 };

// Your own recipes, v1 (the first version): one with a catalog and a free-text ingredient, plus
// two entries a buggy write could leave behind (no ingredients list; a catalog-style id).
export const customRecipesV1 = {
  state: {
    recipes: [
      {
        id: 'u-abc-0',
        title: "Gran's lentil soup",
        mealType: 'dinner',
        protein: 'vegetarian',
        prep: 10,
        cook: 40,
        servings: 4,
        emoji: '🍲',
        ingredients: [
          { id: 'garlic', amount: 2, unit: 'clove', prep: 'minced' },
          { id: 'custom:smoked-salt', custom: 'Smoked salt', amount: 1, unit: 'tsp' },
        ],
        steps: ['Simmer everything 40 minutes.'],
      },
      {
        id: 'u-def-2',
        title: 'Beefless burger',
        mealType: 'dinner',
        protein: 'beef', // chosen by hand: the ingredients alone say vegetarian
        prep: 5,
        cook: 10,
        servings: 2,
        emoji: '🍔',
        ingredients: [{ id: 'garlic', amount: 1, unit: 'clove' }],
        steps: ['Grill 10 minutes.'],
      },
      { id: 'u-broken-1', title: 'No ingredients', mealType: 'dinner', protein: 'vegetarian', prep: 0, cook: 0, servings: 2, emoji: '🍽️', steps: [] },
      { id: 'r1', title: 'Not mine', mealType: 'dinner', protein: 'vegetarian', prep: 0, cook: 0, servings: 2, emoji: '🍽️', ingredients: [], steps: [] },
    ],
  },
  version: 1,
};

// Grocery v1 (versioned, still free-text keys and `category`).
export const groceryV1 = {
  state: {
    checked: {
      'Plain Greek yogurt__cup': true,
      'Salt & pepper__pinch': true,
      'Unknown thing__cup': true,
      'Eggs__unit': false,
      'manual__manual-9': true,
    },
    manualItems: [{ id: 'manual-9', name: 'Dish soap', category: 'Pantry & Canned' }],
  },
  version: 1,
};
