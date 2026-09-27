# CLAUDE.md
## Define the persona
- for this specific sub-task you are an expert React Native / Expo engineer.

## 1. Project Overview
- MealApp: a Mealime-style weekly meal planner. Users set household size, diet, and which meals to plan; the app auto-generates a 7-day plan from a curated recipe set and a grocery list from that plan. Single-user, fully offline, no backend.

## 2. Tech Stack
- Expo (React Native) + TypeScript. React Navigation. Zustand + AsyncStorage (`persist` middleware) for all local state. No backend, no auth, no network calls.

## 3. Architecture
- `src/data/recipes.ts` — the recipe catalog; add recipes by appending objects in the existing shape.
- `src/types.ts` — shared domain types.
- `src/theme.ts` — colors, spacing, shared constants (days, meal labels, grocery category order).
- `src/store/` — one Zustand store per concern (preferences, plan, favorites, grocery), each persisted independently.
- `src/utils/` — pure logic: plan generation/swap (`planGenerator.ts`), grocery aggregation (`grocery.ts`), unit formatting (`units.ts`).
- `src/navigation/` — `RootNavigator` (Onboarding vs. Main stack, modal `RecipeDetail`) and `MainTabs` (Plan/Browse/Grocery/Favorites/Settings).
- `src/screens/` — one screen per route; `src/components/` — shared UI (`RecipeCard`, `DietTag`).
- `reference/mealplan-app-prototype.jsx` — original web mockup; historical design reference only, not part of the build.

## 4. Coding Conventions
- Follow `General_Code_Quality_Prompts.md` (repo root) for complexity/naming/DRY rules.
- TypeScript strict mode — no `any`/`@ts-ignore` to silence errors.
- Functional components + hooks only.
- Business logic belongs in `src/utils/`, not inline in screen components.

## 5. UI and Design System Rules
- All colors/spacing come from `src/theme.ts` — no hardcoded hex values or magic numbers in screens.
- Plain RN `StyleSheet.create`; no styling library added without asking first.
- Recipes use emoji, not photos, for v1 — don't add an image pipeline without checking in (bundle size / CDN tradeoff noted in the project plan).

## 6. Content and Copy Guidance
- Warm, concise, low-friction copy matching the existing mock ("Let's set up your plan", "Build my week"). No marketing-speak, no exclamation-heavy tone.

## 7. Testing and Quality Bar
- `npx tsc --noEmit` must be clean after any change.
- Verify UI changes with `npm run web` before calling work done; say explicitly if you couldn't visually verify.
- No test suite yet; if adding one, prioritize `src/utils/` pure functions first.

## 8. File and Content Placement Rules
- New screens → `src/screens/`, registered in `src/navigation/`, params typed in `src/navigation/types.ts`.
- New shared UI → `src/components/`; don't duplicate markup across screens.
- New persisted state → its own file in `src/store/`, following the existing `persist` + AsyncStorage pattern.

## 9. Safe Change Rules
- Don't change the on-disk shape of persisted store state without a migration path — existing installs' AsyncStorage data won't match and will silently reset or crash.
- Don't rename recipe `id` values in `src/data/recipes.ts` — they're referenced by id in persisted plan and favorites data.
- Don't remove `reference/mealplan-app-prototype.jsx` casually — it's the design source of truth if a screen needs to be reconciled with the original mock.

## 10. Specific Commands
- `npm install`, `npm run web`, `npm run ios`, `npm run android`, `npm start`, `npx tsc --noEmit`, `npx expo export --platform web`
