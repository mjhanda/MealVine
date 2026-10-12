# Dishcart

A personal meal planner: pick meals that fit how you eat, get one
aisle-sorted grocery list, and cook whenever you like. It's not a calendar.
Your plan is a list of meals to cook, and you tick each one off when it's done.

- **Personalized:** eight diets (Classic, Flexitarian, Pescetarian,
  Vegetarian, Vegan, Low carb, Keto, Paleo), 12 allergens, and any
  ingredients you won't eat. Allergens and dislikes are never shown.
- **Plan:** search 100 recipes by title or ingredient; each planned meal keeps
  its own servings; swap a meal for another of the same type; undo anything.
- **Shop:** the grocery list builds itself from the plan, with one line per
  ingredient, units merged, grouped by store aisle, and room for your own items.
- **Cook:** step-by-step recipes with servings scaling; mark meals cooked and
  re-plan favorites from "Recently cooked".
- **Private:** works offline, no account; all meal data stays on the device.
- **Free with ads:** $0.99/month removes them (RevenueCat; App Store / Google Play billing); store promo codes work too.

Product context and decisions: [`docs/product-plan.md`](docs/product-plan.md).
Backlog: GitHub issues (snapshot in [`docs/TASKS.md`](docs/TASKS.md)).

## Tech stack

- **Expo (React Native) + TypeScript**: one codebase for web, iOS, and Android
- **React Navigation**: stack + bottom tabs
- **Zustand + AsyncStorage**: local state with versioned migrations (no backend)
- **jest-expo + ESLint**: tests and lint, run in CI

## Run it

```bash
npm install
npm run web      # opens in your browser, the fastest way to try it
npm run ios      # requires Xcode / iOS Simulator, or scan the QR from `npm start` with Expo Go
npm run android  # requires Android Studio, or scan the QR from `npm start` with Expo Go
```

`npm start` alone launches the Expo dev server and prints a QR code. Scan it
with Expo Go on your phone to test on a real device without a native build.

## Build for a phone

Purchases, notifications, and file import/export need a development build (not Expo Go):
`npm run doctor`, then `npm run build:dev` (requires `npx eas-cli login`). The full device
test script is in [`docs/qa/DEVICE_TEST_PLAN.md`](docs/qa/DEVICE_TEST_PLAN.md).

## Check it

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint
npm test            # jest (unit, migration, and catalog-integrity tests)
```

## Project structure

```
App.tsx                  App entry: providers, plan↔grocery sync
src/
  data/                  ingredients.ts (canonical catalog), recipes.ts (100 recipes)
  types.ts               Shared TypeScript types
  theme.ts               Colors, spacing, meal types, store aisles
  store/                 Zustand stores (preferences, plan, history, favorites, grocery, undo)
  utils/                 Diets/allergens, recipe search, grocery aggregation, units
  navigation/            Root stack + bottom tabs
  screens/               Onboarding, Plan, Browse, RecipeDetail, Grocery, Favorites, Settings
  components/            Shared UI (RecipeCard, UndoBar, preference pickers, dialogs)
docs/                    Product plan, task list, architecture & security notes
reference/               Original web prototype (design reference only)
```

## Known gaps

Tracked as issues. The biggest: no recipe photos yet (#15), a thin catalog for
vegan/keto/paleo and no red meat (#16), no cooking mode (#13), and default Expo
app icon/splash (#21).
