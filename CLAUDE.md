# CLAUDE.md

## 1. Project Overview
MealApp — a free-form meal planner (deliberately NOT a weekly planner). Users
set household size, diet preference, and which meal types they plan, then
search/browse a curated 100-recipe catalog (breakfast, lunch, dinner, snacks)
and add meals to their plan. The plan is a flat list of picked meals — each
entry remembers its serving count — and the grocery list is derived from it.
Single-user, fully offline, no backend. See `mealplan-app-project-plan.md`
for full product context and current build status.

## 2. Tech Stack
Expo (React Native) + TypeScript. React Navigation (native-stack + bottom
tabs). Zustand with the `persist` middleware backed by
`@react-native-async-storage/async-storage` for all local state. No backend,
no network calls, no auth.

## 3. Architecture
- `src/data/recipes.ts` — the 100-recipe catalog (id, diet, mealType, ingredients, steps). Adding recipes means appending objects here in the existing shape; no other code changes needed.
- `src/types.ts` — shared domain types (`Recipe`, `Preferences`, `MealPlan`, etc.).
- `src/theme.ts` — colors, spacing, and shared constants (`mealLabels`, `mealPlural`, `mealTypeOrder`, `categoryOrder`). Change visual identity here, not per-component.
- `src/store/*` — one Zustand store per concern (`preferencesStore`, `planStore`, `favoritesStore`, `groceryStore`), each persisted independently. Don't reach into another store's state directly from a component — read via that store's own hook.
- `src/utils/recipeCatalog.ts` — recipe lookup and browse filtering (search by title/ingredient, diet, meal type); pure functions, no side effects.
- `src/utils/grocery.ts` — ingredient aggregation across the plan's meals into grouped grocery lines (each plan entry scales its recipe by its own serving count).
- `src/store/planStore.ts` — owns the plan list (`MealPlan.items`) and `migrateLegacyPlan()`, which converts the old weekly `entries` shape from previously installed versions on rehydrate.
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
Warm, concise, low-friction copy (matches the original mock: "Let's set up your plan", now "Start planning"). No jargon, no exclamation-heavy marketing tone.

## 7. Testing and Quality Bar
- Run `npm run typecheck`, `npm run lint`, and `npm test` after any non-trivial change — all must be clean. CI (`.github/workflows/ci.yml`) runs the same three on every push/PR.
- For UI changes, verify with `npm run web` (fastest feedback loop) before calling work done; note explicitly if you couldn't visually verify (e.g. no browser tool available).
- Tests use `jest-expo`, colocated in `__tests__/` folders. `src/utils/` must stay at ≥80% line coverage (enforced). Every new pure util gets tests; every persisted-shape change gets a migration test with a fixture blob.
- `src/data/__tests__/` validates the recipe catalog (`npm run validate`) — adding a recipe that breaks it fails CI.

## 8. File and Content Placement Rules
- New screens go in `src/screens/`, registered in `src/navigation/RootNavigator.tsx` or `MainTabs.tsx` as appropriate, with params typed in `src/navigation/types.ts`.
- New shared UI goes in `src/components/`. Don't duplicate a component's markup across screens — extract it once it's used twice with the same shape.
- New persisted state goes in its own file under `src/store/`, following the existing `persist` + `AsyncStorage` pattern — don't add a second state-management approach.

## 9. Safe Change Rules
- Don't change the on-disk shape of persisted store state (`Preferences`, `MealPlan`, `GroceryState`, favorites array) without a migration path — existing installs' AsyncStorage data won't match a changed shape and will silently reset or crash on read. (The weekly→list `MealPlan` change in v2 is handled by `migrateLegacyPlan()` in `planStore.ts`; keep that pattern for any future shape change.)
- Don't rename recipe `id` values in `src/data/recipes.ts` — they're referenced by id in persisted `MealPlan` and favorites data.
- Don't remove `reference/mealplan-app-prototype.jsx` casually — it's the design source of truth for colors/copy/flow if screens need to be reconciled with the original mock.

## 10. Specific Commands
```bash
npm install       # install dependencies
npm run web       # run in browser (fastest to test)
npm run ios       # run in iOS Simulator / Expo Go
npm run android   # run in Android emulator / Expo Go
npm start         # dev server + QR code for Expo Go on a physical device
npm run typecheck # tsc --noEmit
npm run lint      # expo lint (ESLint, eslint-config-expo)
npm test          # jest (add -- --coverage for the coverage gate)
npx expo export --platform web  # production web build sanity check
```
