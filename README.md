# MealApp

A meal planner: pick any meals you want to eat — breakfast, lunch, dinner, and
snacks — from a searchable catalog of 100 curated recipes, and the app builds
your grocery list automatically from that plan, grouped by aisle. It is a
free-form list, not a week: add and remove meals as you like, with each entry
keeping its own serving count. Includes a recipe detail view with live
serving-size scaling, favorites, search (by title or ingredient), and diet
filtering. Everything runs fully offline; all data is stored on-device.

See `mealplan-app-project-plan.md` for the full product plan and current
build status.

## Tech stack

- **Expo (React Native) + TypeScript** — one codebase for web, iOS, and Android
- **React Navigation** — stack + bottom tabs
- **Zustand + AsyncStorage** — local state and persistence (no backend)
- **@expo/vector-icons** — icons

## Run it

```bash
npm install
npm run web      # opens in your browser — fastest way to try it
npm run ios      # requires Xcode / iOS Simulator, or scan the QR from `npm start` with Expo Go
npm run android  # requires Android Studio, or scan the QR from `npm start` with Expo Go
```

`npm start` alone launches the Expo dev server and prints a QR code — scan it
with the Expo Go app on your phone to test on a real device without any
native build step.

## Project structure

```
App.tsx                  App entry: providers
src/
  data/recipes.ts        100 seed recipes (id, diet, mealType, ingredients, steps, ...)
  types.ts               Shared TypeScript types
  theme.ts               Colors, spacing, meal/category constants
  store/                 Zustand stores (preferences, plan, favorites, grocery), each persisted to AsyncStorage
  utils/                 Recipe catalog/search, grocery aggregation, unit formatting
  navigation/            Root stack + bottom tab navigator
  screens/               Onboarding, Plan, Browse, RecipeDetail, Grocery, Favorites, Settings
  components/            Shared UI (RecipeCard, DietTag)
reference/               Original web prototype (superseded by src/, kept for design reference)
```

The **Plan** tab is a curated list of meals you picked (grouped by breakfast /
lunch / dinner / snack); the **Grocery** tab is derived from it, so adding or
removing a meal updates the list live.

## Known gaps (see project plan Section 0 for why)

- No custom app icon/splash yet (default Expo placeholders).
- Grocery list doesn't normalize units (e.g. "1 cup" + "2 tbsp" list separately) and has no clear/reset action.
- Recipes use emoji instead of photos.
