# CLAUDE.md

## 1. Project Overview
MealApp — a Mealime-style weekly meal planner. Users set household size, diet
preference, and which meals to plan; the app generates a 7-day plan from a
curated recipe set and derives a grocery list from it. Single-user, fully
offline, no backend. See `mealplan-app-project-plan.md` for full product
context and current build status.

## 2. Tech Stack
Expo (React Native) + TypeScript. React Navigation (native-stack + bottom
tabs). Zustand with the `persist` middleware backed by
`@react-native-async-storage/async-storage` for all local state. No backend,
no network calls, no auth.

## 3. Architecture
- `src/data/recipes.ts` — the recipe catalog (id, diet, mealType, ingredients, steps). Adding recipes means appending objects here in the existing shape; no other code changes needed.
- `src/types.ts` — shared domain types (`Recipe`, `Preferences`, `MealPlan`, etc.).
- `src/theme.ts` — colors, spacing, and shared constants (`days`, `mealLabels`, `categoryOrder`). Change visual identity here, not per-component.
- `src/store/*` — one Zustand store per concern (`preferencesStore`, `planStore`, `favoritesStore`, `groceryStore`), each persisted independently. Don't reach into another store's state directly from a component — read via that store's own hook.
- `src/utils/planGenerator.ts` — plan generation/swap logic (pure functions, no side effects).
- `src/utils/grocery.ts` — ingredient aggregation across the week's plan into grouped grocery lines.
- `src/navigation/` — `RootNavigator` (Onboarding vs. Main, plus modal `RecipeDetail`) and `MainTabs` (Plan/Browse/Grocery/Favorites/Settings).
- `src/screens/*` — one screen per route, RN `StyleSheet` for styling, no external UI kit.
- `reference/mealplan-app-prototype.jsx` — the original web mockup this app was built from. Historical reference only; not part of the build (not imported anywhere).

## 4. Coding Conventions
Also see `General_Code_Quality_Prompts.md` at the repo root — the standing complexity/simplicity rules (cyclomatic/cognitive complexity limits, function length, naming, DRY-after-3) apply here.
- TypeScript strict mode is on (`tsconfig.json`) — don't silence errors with `any` or `@ts-ignore`; fix the type.
- Functional components with hooks only; no class components.
- Business logic (plan generation, grocery aggregation, unit math) lives in `src/utils/`, not inline in components — keeps it testable and keeps screens thin.
- Icons: `Feather` from `@expo/vector-icons` by default; `Ionicons` only for the favorite heart (needs a filled vs. outline state Feather doesn't have as one glyph pair).

## 5. UI and Design System Rules
- Colors, spacing, and category ordering come from `src/theme.ts` — don't hardcode hex values or magic spacing numbers in screens/components.
- Layout uses plain RN `StyleSheet.create`, no styled-components/NativeWind/etc. Keep it that way unless the user asks to add a styling library.
- Recipes are represented with emoji (`recipe.emoji`), not photos, for v1 — don't add an image pipeline without checking with the user first (bundle size / CDN tradeoff called out in the project plan).

## 6. Content and Copy Guidance
Warm, concise, low-friction copy (matches the original mock: "Let's set up your plan", "Build my week"). No jargon, no exclamation-heavy marketing tone.

## 7. Testing and Quality Bar
- Run `npx tsc --noEmit` after any non-trivial change — must be clean.
- For UI changes, verify with `npm run web` (fastest feedback loop) before calling work done; note explicitly if you couldn't visually verify (e.g. no browser tool available).
- No automated test suite exists yet. If you add one, prefer testing `src/utils/` pure functions first (plan generation, grocery aggregation) — highest value per effort.

## 8. File and Content Placement Rules
- New screens go in `src/screens/`, registered in `src/navigation/RootNavigator.tsx` or `MainTabs.tsx` as appropriate, with params typed in `src/navigation/types.ts`.
- New shared UI goes in `src/components/`. Don't duplicate a component's markup across screens — extract it once it's used twice with the same shape.
- New persisted state goes in its own file under `src/store/`, following the existing `persist` + `AsyncStorage` pattern — don't add a second state-management approach.

## 9. Safe Change Rules
- Don't change the on-disk shape of persisted store state (`Preferences`, `MealPlan`, `GroceryState`, favorites array) without a migration path — existing installs' AsyncStorage data won't match a changed shape and will silently reset or crash on read.
- Don't rename recipe `id` values in `src/data/recipes.ts` — they're referenced by id in persisted `MealPlan` and favorites data.
- Don't remove `reference/mealplan-app-prototype.jsx` casually — it's the design source of truth for colors/copy/flow if screens need to be reconciled with the original mock.

## 10. Specific Commands
```bash
npm install       # install dependencies
npm run web       # run in browser (fastest to test)
npm run ios       # run in iOS Simulator / Expo Go
npm run android   # run in Android emulator / Expo Go
npm start         # dev server + QR code for Expo Go on a physical device
npx tsc --noEmit  # type-check
npx expo export --platform web  # production web build sanity check
```
