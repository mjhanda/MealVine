# Meal Planning App (Mealime-style Clone) — Project Plan

## 0. Status (as of 2026-09-26)

**MVP is built and running** as an Expo (React Native + TypeScript) app at the repo root — same codebase runs on web (`npm run web`), iOS, and Android (`npm run ios` / `npm run android`, or scan the QR code from `npm start` with Expo Go). See `src/` for the implementation and the root `README.md` for how to run it.

Implemented: onboarding, weekly plan grid with swap/regenerate, recipe detail with live serving-size scaling, auto-generated grocery list (grouped by aisle, checkable, manual add), favorites, browse/filter all recipes, and a settings screen to edit preferences with a regenerate prompt. All state persists locally via AsyncStorage (through Zustand's `persist` middleware) — the app is fully offline. 50 originally-authored recipes are seeded in `src/data/recipes.ts` (see Section 8 for sourcing decision).

Deliberate deviations from the original plan below, made to ship a working v1 quickly:
- **Storage:** plain AsyncStorage via Zustand persist, not SQLite/WatermelonDB. Fine at this data volume (a handful of small JSON blobs); revisit only if recipe search/filtering at scale becomes a bottleneck.
- **Diet model:** simplified to two options users actually asked for in the original mock — "vegetarian only" vs. "vegetarian + lean protein (chicken/turkey/fish, no pork)" — rather than the full omnivore/vegetarian/vegan/pescatarian/gluten-free taxonomy. Recipes are individually tagged (`vegetarian` / `chicken` / `turkey` / `fish`), so splitting this further later is additive, not a rewrite.
- **Skip days:** not implemented in onboarding; every day in the 7-day grid gets a plan. Low effort to add later (Epic C).
- **Grocery unit normalization** (e.g. combining "1 cup" + "2 tbsp"): not implemented — items aggregate by matching name+unit pairs, so the same ingredient in different units lists as separate lines. Called out as a known edge case in the original backlog (Epic F).

## 1. Product Summary

A React Native mobile app (iOS + Android) that helps individuals and households plan weekly meals from a curated recipe database and auto-generates a grocery list from that plan. Each user runs their own independent instance of the app — no real-time multi-user sync required for MVP.

**Primary goal:** Reduce the weekly "what's for dinner + what do I need to buy" decision fatigue.

## 2. Assumptions (please flag anything you'd change)

- No account/backend sync needed for MVP — all data stored locally on-device (AsyncStorage / SQLite via WatermelonDB or similar).
- Recipe content is authored/curated by you (or a small content team), not pulled from a third-party API.
- Recipes are bundled with the app initially; a lightweight content-update mechanism (hosted JSON or simple CMS) is a fast-follow so recipes can be refreshed without app-store releases.
- "Household" just means one user configures the app for their own eating patterns (servings, diet, skipped meals) — it does not mean multiple people log into the same account.
- Budget/timeline not yet specified — plan below is organized by scope so it can be trimmed to fit either.

## 3. Core Feature Set (Mealime parity)

### MVP (Phase 1)
- Onboarding: household size, dietary preference (omnivore/vegetarian/vegan/pescatarian/gluten-free), which meals to plan (breakfast/lunch/dinner), skip days
- Weekly meal plan view (7-day grid), auto-populated from recipe DB matching preferences
- Swap/replace any meal with another recipe suggestion
- Recipe detail screen: photo, ingredients, step-by-step instructions, prep/cook time, servings (adjustable, scales ingredient quantities)
- Auto-generated grocery list from the current week's plan, grouped by grocery aisle/category, with check-off state
- Manually add/remove items from grocery list
- Favorite/save recipes
- Local persistence (plan + list + favorites survive app restarts)

### Phase 2 (fast-follow)
- Recipe search & filtering (by tag, time, ingredient)
- Nutrition info per recipe
- Recipe rating / "cooked this" history
- Remote recipe content updates (no app release needed)
- Push notifications ("plan next week's meals")
- Pantry staples list (exclude from grocery list)

### Phase 3 (stretch)
- Optional account + cloud backup (restore on new device)
- Shared household lists (would reopen the sync question)
- Import recipe from URL

## 4. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| App framework | React Native + Expo | Fastest path to iOS + Android from one codebase; Expo simplifies build/release |
| Navigation | React Navigation | Standard for RN |
| Local storage | SQLite (via `expo-sqlite` or WatermelonDB) | Structured queries needed for grocery aggregation across recipes |
| State management | Zustand or React Context | Lightweight, no backend sync complexity to justify Redux |
| Recipe content | Bundled JSON/SQLite seed at launch → hosted JSON (S3/Cloudflare) for Phase 2 updates | Avoids building a full CMS for MVP |
| Images | Bundled or CDN-hosted recipe photos | Keep app bundle size reasonable — CDN preferred if >30 recipes |

## 5. Core Data Model

- **Recipe**: id, title, photo, tags[], dietary flags[], prep_time, cook_time, base_servings, ingredients[], steps[]
- **Ingredient**: name, quantity, unit, grocery_category (produce/dairy/meat/pantry/etc.)
- **MealPlan**: week_start_date, entries[{day, meal_type, recipe_id, servings}]
- **GroceryList**: derived from active MealPlan + manual_items[], each item has checked_state
- **UserPreferences**: household_size, diet_type, active_meal_types[], skipped_days[]
- **Favorites**: recipe_id[]

## 6. Screen / UX Flow

1. Onboarding (preferences) → 2. Weekly Plan (home) → 3. Recipe Detail (from plan or browse) → 4. Grocery List (generated from plan) → 5. Favorites → 6. Settings

## 7. Task Backlog

### Epic A — Project Setup
- [x] Initialize Expo + React Navigation project, folder structure, lint/format config
- [ ] Set up local SQLite schema and data access layer — *deferred, see Section 0: using AsyncStorage via Zustand persist instead*
- [x] Set up state management (Zustand stores for plan, list, preferences, favorites)
- [ ] App icon, splash screen, base theming — theming (colors/typography) done; custom app icon/splash still default Expo assets

### Epic B — Recipe Content
- [x] Define recipe data schema + grocery category taxonomy (produce, dairy, meat/seafood, pantry, frozen, bakery, etc.)
- [x] Source/write initial recipe set — 50 recipes shipped (below the 60–100 target; see Section 8, easy to grow — just append to `src/data/recipes.ts`)
- [x] Tag each recipe with dietary flags, meal type, prep time
- [x] Seed local DB with recipe content — content is bundled in-app; recipes use emoji instead of photos for v1 (no image pipeline yet)
- [x] Build recipe-matching logic (filter recipes by user's diet/meal-type prefs for auto-plan generation)

### Epic C — Onboarding
- [ ] Onboarding UI flow (household size, diet type, meal types, skip days) — built, minus skip days (see Section 0)
- [x] Persist preferences locally
- [x] Trigger first auto-generated plan on onboarding completion

### Epic D — Weekly Meal Plan
- [x] Weekly grid UI (7 days × selected meal types)
- [x] Auto-generate plan algorithm (avoid recent repeats, respect diet settings; no skip-day support yet)
- [x] Swap-meal UI (show alternate suggestions, replace slot)
- [x] "Regenerate week" action
- [x] Persist active plan locally

### Epic E — Recipe Detail
- [x] Recipe detail screen UI (emoji, meta info, ingredients, steps)
- [x] Servings adjuster with live ingredient quantity scaling
- [x] Favorite/unfavorite toggle
- [ ] "Add to plan" action from browse context — Browse currently opens recipe detail only; assigning a browsed recipe into a specific day/meal slot is not wired up yet

### Epic F — Grocery List
- [x] Aggregation logic: combine ingredients across all planned recipes for the week, sum quantities, dedupe (matching name+unit only — see unit-normalization caveat below)
- [x] Group list by grocery category with section headers
- [x] Check-off UI with persisted checked state
- [x] Manual add-item flow
- [ ] Clear-list / new-week reset behavior — not built; checked state persists indefinitely and isn't cleared on regenerate
- [ ] Edge case: unit conversion/normalization when combining ingredients (e.g., "1 cup" + "2 tbsp") — *known gap, see Section 0*

### Epic G — Favorites & Browse
- [x] Favorites list screen
- [x] Browse-all-recipes screen with basic filter (meal type; diet filter not added)

### Epic H — Settings
- [x] Edit preferences (household size, diet, meal types) post-onboarding — skip days not applicable yet
- [x] Regenerate plan on preference change (prompt user)

### Epic I — Polish & Release
- [x] Empty states (no plan yet, empty grocery list, empty favorites)
- [x] Offline behavior confirmation (fully offline — no network calls anywhere in the app)
- [ ] App icon/store assets, screenshots — still default Expo placeholder icon/splash
- [ ] TestFlight / internal Android build for testing
- [ ] App Store + Play Store listing prep and submission

## 8. Decisions Made (originally "Open Questions for You")

1. **Recipe volume/sourcing** — resolved: 50 recipes, originally authored (not scraped or licensed), tagged and typed in `src/data/recipes.ts`. Below the 60–100 recommended for full onboarding variety across diets; adding more is just appending entries to that file in the same shape — no code changes needed.
2. **Timeline/budget** — resolved: treated as a working prototype to test now, not a scoped release. Phase 2/3 items (recipe search, nutrition info, remote content updates, cloud backup, etc.) are intentionally left undone; see the backlog above for exactly what's in v1 vs. deferred.
3. **Design** — resolved: kept the original mock's visual identity (cream/forest/gold/rust palette, card-based layout) rather than introducing a new one; see `src/theme.ts`.

## 9. Next Steps (not yet started)

- Add app icon/splash screen assets (currently default Expo placeholders).
- Grow the recipe set toward 60–100 for better plan variety.
- Skip-days in onboarding, grocery-list clear/reset on new week, and unit normalization in the grocery aggregator (see Section 0 for why these were deferred).
- Decide on recipe photos vs. keeping the emoji treatment before any real release.
