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

export const preferencesV0 = {
  state: { householdSize: 4, diet: 'vegetarian', mealTypes: ['dinner'], onboardingComplete: true, hasHydrated: true },
  version: 0,
};

export const groceryV0 = {
  state: { checked: { 'Garlic__clove': true }, manualItems: [{ id: 'manual-1', name: 'Paper towels', category: 'Pantry & Canned' }] },
  version: 0,
};

export const favoritesV0 = { state: { favorites: ['r1', 'r7'] }, version: 0 };

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
