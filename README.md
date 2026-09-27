# MealApp

A weekly meal-planning app (Mealime-style): pick your household size, diet, and
which meals you want planned, and it builds a 7-day plan from a curated recipe
set — with swap/regenerate, a recipe detail view with live serving-size
scaling, an auto-generated grocery list grouped by aisle, favorites, and a
browse/filter screen. Everything runs fully offline; all data is stored
on-device.

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
App.tsx                  App entry: providers, plan-hydration bootstrap
src/
  data/recipes.ts         50 seed recipes (id, diet, ingredients, steps, ...)
  types.ts                 Shared TypeScript types
  theme.ts                 Colors, spacing, meal/day/category constants
  store/                   Zustand stores (preferences, plan, favorites, grocery), each persisted to AsyncStorage
  utils/                   Plan generation, grocery aggregation, unit formatting
  navigation/               Root stack + bottom tab navigator
  screens/                  Onboarding, Plan, RecipeDetail, Grocery, Favorites, Browse, Settings
  components/               Shared UI (RecipeCard, DietTag)
reference/                 Original web prototype (superseded by src/, kept for design reference)
```

## Known gaps (see project plan Section 0 for why)

- No custom app icon/splash yet (default Expo placeholders).
- Grocery list doesn't normalize units (e.g. "1 cup" + "2 tbsp" list separately) and has no clear/reset action.
- Onboarding has no skip-days option yet.
- Recipes use emoji instead of photos.
