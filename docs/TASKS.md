# Dishcart — Task List (Mealime parity → launch)

Written 2026-10-05 (as "MealApp"); T26–T35 added after the Dishcart / ads
decisions; T40–T42 added 2026-10-18; T44–T46 added 2026-10-20 (#43 is a Dependabot PR); T47–T48 added 2026-10-20. Each task follows
`.github/ISSUE_TEMPLATE/ai-task.yml` and is mirrored as a GitHub issue in
**mjhanda/MealVine** (issue #N = TN). This file is the planning snapshot; the
issues are the source of truth.

### Status (2026-10-20, evening)

- **Done:** T01–T14, T17–T19, T22–T24, T37, T38, T40–T42, T44–T48 (code in `main`, issues closed).
  T42: installed on the owner's Pixel 11 Pro XL 2026-10-21 (release APK; `docs/release/personal-android.md`).
- **Partly done:**
  - T16 — 342 recipes, 110 dinners (54 original, 11 adapted, 45 archive). Per diet: classic 110,
    flexitarian 88, pescetarian 51, vegetarian 31, vegan 19, low-carb 19, keto 18, paleo 14 — the
    ≥ 20 target is still short for vegan, low-carb, keto, and paleo; owner taste check open.
  - T20 — tests and lint run locally; `.github/workflows/ci.yml` was never
    pushed (needs the `workflow` token scope), so there is no CI yet.
  - T21 — config/docs done; needs assets and store accounts.
  - T25 — name, publisher, and price decided; launch date open. Owner (2026-10-20): personal use
    first; will still submit to both stores.
  - T32 — Maestro E2E passes on the iOS simulator and Android emulator;
    physical-device pass and purchase steps still open.
- **Open:** T15, T26–T31, T33–T36, T39.
- **Security (2026-10-20):** critical `shell-quote` alert fixed (lockfile); 4 remaining Dependabot
  alerts are dev/build-only with no patched release (node-forge, braces, uuid, sprintf-js).
- **Not needed for personal use:** T26–T31, T33, T34 (store, ads, legal).

> T25's original context (paid app, "Mealime alternative" positioning) is
> superseded: **Dishcart is free with ads; $0.99/month removes ads.**

## Product north star

Mealime's core loop: **pick meals that fit how you eat → get one
aisle-sorted grocery list → cook from clear step-by-step instructions.**
Its plan isn't a calendar: you pick a batch of meals and cook them whenever
you like. MealApp already has that list model (v2). The gaps are in the
**personalization layer** (diets, allergies, dislikes), the **grocery list**
(it doesn't merge ingredients well and has no pantry awareness), and the
**cook step** (there's no cooking mode, and no way to mark a meal as done).

### Mealime feature inventory (researched 2026-10-05)

| Mealime feature | MealApp today | Task |
|---|---|---|
| Diets: Classic, Flexitarian, Pescetarian, Vegetarian, Vegan, Low Carb, Keto, Paleo; Gluten-free and Dairy-free plans | 2 options ("vegetarian only" / "veg + lean protein") | T07 |
| Allergy exclusions (shellfish, gluten, nuts, etc.) | None | T08 |
| Dislikes ("no tofu, no olives"), 200+ personalization options | None | T08 |
| Servings per meal (2 / 4 / 6) | Household size 1–8 plus per-entry servings, but entry servings can't be seen or edited | T04 |
| Browse recipe photos, tap to add to the plan | Emoji cards, quick-add | T05, T15 |
| Swap a meal for another one | Remove, then re-add manually | T05 |
| Aisle-sorted, auto-generated grocery list | Yes, but no unit merging, messy ingredient names, sticky check-offs | T03, T09, T10 |
| Check off items you already have; add custom items | Check-off yes; custom items all land in one aisle | T11, T12 |
| Hands-free cooking mode, step by step | Static list of steps | T13 |
| Recipes ≤ ~30–45 min, everyday ingredients | Yes (authored to that brief) | T16 |
| Nutrition: calories, macros, micros (Pro) | None | T17 |
| Recipe notes and previous meal plans (Pro) | None | T18 |
| Recipe box / favorites | Yes | — |
| Grocery delivery integrations | None — out of scope (needs a backend and partners) | — |

### Market context that changes the stakes

**Mealime shuts down on 2026-10-21.** Albertsons is folding it into the
"Meals Hub" inside its grocery-store apps. The app has **no export**, and all
user data is deleted at shutdown. It's rated 4.8★ from 54k+ App Store ratings.
At least six competitors are already publishing "Mealime alternative" posts.
A store launch before 10-21 isn't realistic (review queues plus the gaps below),
but people will keep searching for a replacement for months. What we can
honestly offer: **offline, private, no account, your data is exportable**,
which answers the main complaint about how Mealime shut down. See T25.

### Milestones (proposed)

- **M1, personal-use parity:** T01–T09, T20, T22, T25. Target 2026-10-19.
- **M2, full Mealime parity:** T10–T14, T19. Target 2026-11-02.
- **M3, publishable:** T15–T18, T21, T23–T25. Target 2026-11-30.
- **M4, launch:** T26–T35 (accounts, store products, ads, QA, legal). Target 2026-12-14.

---

## T01 — Put the codebase under version control on GitHub

- **Summary:** All of v2 (≈1,200 changed lines, including the switch from a weekly grid to a flat list and recipes 51–100) existed only in the working tree, and the repo had no remote. A single disk failure would lose it.
- **Requester:** Owner (@element-dot)
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** n/a (repo hygiene)
- **Context:** `git status` on 2026-10-05: one commit (v1 MVP); v2 uncommitted; `src/utils/recipeCatalog.ts` untracked; no `origin`.
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** Secret scan run over the working tree and full history before the first push (clean). The repo is private.
- **In scope:** Commit v2; create private GitHub repo; push; add `.github/ISSUE_TEMPLATE/ai-task.yml`; add this task list.
- **Out of scope:** CI (T20).
- **Acceptance Criteria:**
  - [x] v2 committed on `main`
  - [x] Private repo exists, `origin/main` matches local `main`
  - [x] Issue template visible in the GitHub "New issue" picker
- **Test Strategy:** `git status` clean; `git rev-parse main origin/main` match; open the New Issue page.
- **Dependencies / Blockers:** None
- **Priority:** P0 - Critical
- **Target date:** 2026-10-05 (done)
- **Additional Notes:** —

## T02 — Fix stale and contradictory project docs

- **Summary:** The docs contradict the code and each other. Anyone (human or AI) who reads them first will build the wrong thing.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** Contributors / AI agents
- **Context:** Specific defects:
  - `mealplan-app-project-plan.md` §7 still marks "Weekly grid UI", "Auto-generate plan algorithm", "Swap-meal UI" and "Regenerate week" as done. v2 deleted all of them (`planGenerator.ts` is gone). §1, §3, §5 and §6 still describe a 7-day weekly plan. §8 says "50 recipes" (there are 100).
  - The plan is titled "Mealime-style Clone". Mealime is a trademark, so the name can't appear in anything that ships or in store copy.
  - `CLAUDE.md` §4 lists "plan generation" as business logic in `src/utils/`; it no longer exists.
  - `project directory/CLAUDE.md` is a diverging duplicate of the root `CLAUDE.md`. `project directory/security_bootstrap_instruction.md` is an empty duplicate of the root file.
  - The folder names `project directory/` and `user directory/` contain spaces, which breaks naive tooling and shell scripts.
  - `.claude/rules/security.md` claims "No PII or sensitive data". That stops being true once T08 stores allergy data.
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** —
- **In scope:** Rewrite the plan around the list model and this task list; delete or merge duplicates; rename folders to `docs/project/` and `docs/user/` and fix references; remove "clone" wording.
- **Out of scope:** Marketing copy.
- **Acceptance Criteria:**
  - [ ] No doc describes a weekly grid, auto-generation, or regenerate as current behavior
  - [ ] One `CLAUDE.md` (root); no empty or duplicate files
  - [ ] No folder names with spaces; `grep -r "project directory"` returns nothing
  - [ ] "Mealime" appears only in internal competitive-research docs, never in app copy
- **Test Strategy:** Manual read-through against `src/`; grep checks above.
- **Dependencies / Blockers:** T01
- **Priority:** P1 - High
- **Target date:** 2026-10-08
- **Additional Notes:** Do this before any big feature work so AI agents get accurate context.

## T03 — Grocery check-offs are sticky across plans (bug)

- **Summary:** Checked state is keyed by `name__unit` and never pruned. If you check off "Garlic (clove)", clear the plan, and later add any recipe that uses garlic, it already shows as bought. You'd skip buying it.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** All users at the store
- **Context:** `src/store/groceryStore.ts` (`checked: Record<string, boolean>`); `clearChecked()` exists but nothing in the UI calls it. `PlanScreen` clear doesn't touch grocery state. Mealime users complained about the opposite failure: list items vanishing when they picked a new menu.
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** Changes the persisted `GroceryState` shape, so it needs a migration (T22).
- **In scope:** Prune checked keys that aren't on the current derived list whenever the plan changes; a "Clear checked" / "Start fresh list" action on the Grocery tab; checked items sort to the bottom of their aisle; clearing the plan offers to reset the list as well.
- **Out of scope:** Pantry "already have" (T11).
- **Acceptance Criteria:**
  - [ ] Check item → remove every recipe that uses it → re-add one → item is unchecked
  - [ ] "Clear checked" action exists and asks for confirmation
  - [ ] Checked items render below unchecked ones within each aisle
  - [ ] Manual items survive plan changes (they're independent of recipes)
- **Test Strategy:** Unit-test a pure `pruneChecked(checked, lines)` in `src/utils/grocery.ts`; manual repro of the scenario on web.
- **Dependencies / Blockers:** T22
- **Priority:** P0 - Critical
- **Target date:** 2026-10-12
- **Additional Notes:** —

## T04 — Plan entries hide their servings; Recipe Detail shows a different amount (bug)

- **Summary:** Each plan entry stores `servings`, and the grocery list scales by it. But the Plan tab never shows that number, you can't edit it, and opening the recipe from the plan resets the stepper to household size. What you cook from doesn't match what you shopped for.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** All users
- **Context:** `PlanScreen` → `navigation.navigate('RecipeDetail', { recipeId })` drops `item.id`; `RecipeDetailScreen` uses `useState(householdSize)`. Mealime has a fixed servings setting per plan (2/4/6).
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** —
- **In scope:** Show "· 4 servings" on plan cards; an inline stepper (or sheet) to edit an entry's servings; open Recipe Detail with `planItemId` so the stepper starts at, and edits, that entry; add an `updateServings(id, n)` store action.
- **Out of scope:** Leftover tracking.
- **Acceptance Criteria:**
  - [ ] Plan card displays entry servings
  - [ ] Changing servings on a plan entry updates grocery amounts immediately
  - [ ] Recipe Detail opened from the plan shows that entry's servings, and edits persist to it
  - [ ] Recipe Detail opened from Browse still defaults to household size and says "Add to plan"
- **Test Strategy:** Unit-test `updateServings` plus grocery scaling; manual: 2 → 6 servings and the onion count triples.
- **Dependencies / Blockers:** None
- **Priority:** P0 - Critical
- **Target date:** 2026-10-12
- **Additional Notes:** Add a `planItemId?: string` param to `RootStackParamList.RecipeDetail`.

## T05 — Browse quick-add silently duplicates; there's no swap

- **Summary:** The Browse "+" turns into a ✓ once a recipe is in the plan, but tapping the ✓ adds *another* copy with no feedback. Users expect it to toggle. There's also no "swap this meal", one of Mealime's signature interactions.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** All users
- **Context:** `BrowseScreen.tsx` calls `addItem` regardless of `inPlan`. Mealime: tap a meal photo to swap it, or swipe down to swap all.
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** —
- **In scope:** ✓ removes the recipe (with an undo snackbar); adding the same recipe twice is only possible from Recipe Detail ("Add another"); a "Swap" action on plan cards opens Browse pre-filtered to the same meal type and replaces the entry in place, keeping its servings; a plan-count badge on the Plan tab icon.
- **Out of scope:** "Swap all" / auto-suggest (no generator by design — revisit only if users ask).
- **Acceptance Criteria:**
  - [ ] Tapping ✓ in Browse removes the entry and shows Undo for ~4 s
  - [ ] Swap replaces the plan entry (same position, same servings)
  - [ ] Plan tab shows the count of planned meals
- **Test Strategy:** Store unit tests (`replaceItem`); manual web walkthrough.
- **Dependencies / Blockers:** T04 (servings carry over on swap)
- **Priority:** P1 - High
- **Target date:** 2026-10-15
- **Additional Notes:** —

## T06 — "Mark as cooked": close the plan → shop → cook loop

- **Summary:** Since the plan isn't a calendar, the only way a meal ever leaves it is by deleting it (same as "never mind") or wiping the whole plan. There's no "done" state, so the plan and grocery list never shrink naturally and you can't tell what's left to cook.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** All users
- **Context:** The user requirement is explicit: "meals can be just prepared when you want". That makes "cooked" the natural end of each entry's lifecycle.
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** New persisted `history` (recipeId, servings, cookedAt), with a migration (T22).
- **In scope:** A "Cooked it" action on plan cards and at the end of cooking mode (T13). It moves the entry to history and removes its ingredients from the *unbought* grocery list (bought items stay checked). A "Recently cooked" section, with "Cook again" to re-add.
- **Out of scope:** Ratings and notes (T18).
- **Acceptance Criteria:**
  - [ ] Marking a meal cooked removes it from the plan and adds it to history
  - [ ] Its ingredients no longer appear as needed on the grocery list
  - [ ] "Cook again" re-adds with the same servings
- **Test Strategy:** Unit tests for the store transition; manual flow on web.
- **Dependencies / Blockers:** T22
- **Priority:** P0 - Critical
- **Target date:** 2026-10-15
- **Additional Notes:** This is the missing verb in the product; without it the plan is just a bookmark list.

## T07 — Diet taxonomy at Mealime parity

- **Summary:** Replace the two-option `DietPref` ('vegetarian' | 'mixed') with Mealime's set: Classic, Flexitarian, Pescetarian, Vegetarian, Vegan, Low Carb, Keto, Paleo, plus the Gluten-free and Dairy-free modifiers. Browse filters by the chosen diet.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** All users
- **Context:** Recipes are tagged with a single `diet` that's really a *protein* tag (`vegetarian|chicken|turkey|fish`), so it can't express vegan, low-carb, keto, gluten-free, and so on. The diets should be **derived** from canonical ingredient tags (T09), not hand-tagged per recipe. Hand tags drift. The owner's personal "lean protein, no pork" preference becomes Classic plus dislikes (pork, beef), via T08.
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** `Preferences.diet` shape change → migration: `'vegetarian'` → `vegetarian`; `'mixed'` → `classic` + dislikes `[pork]`.
- **In scope:** `DietId` type and definitions (allowed/excluded ingredient tags, carb thresholds for low-carb/keto); a `recipeDiets(recipe)` util; onboarding and settings pickers; Browse filtering; diet badges on cards; replace the current protein `DietTag` with a protein tag plus diet badges.
- **Out of scope:** Nutrition-based thresholds need T17. Until then, gate low-carb and keto on ingredient rules and hide them if fewer than 10 recipes qualify.
- **Acceptance Criteria:**
  - [ ] Every recipe gets its diets from ingredient tags; no hand-maintained diet list per recipe
  - [ ] Selecting Vegan shows zero recipes containing dairy, egg, honey, meat, or fish (verified by test over the whole catalog)
  - [ ] Existing installs migrate without losing the plan or favorites
  - [ ] A diet with too few recipes is hidden or labelled "coming soon", never shows an empty browse
- **Test Strategy:** Catalog-wide property tests (for each diet, no recipe violates its exclusions); migration unit test with a v2 persisted blob.
- **Dependencies / Blockers:** T09, T22
- **Priority:** P0 - Critical
- **Target date:** 2026-10-19
- **Additional Notes:** The current catalog is 51 vegetarian / 49 poultry-or-fish recipes with **no red meat**, which makes "Classic" thin. See T16.

## T08 — Allergies and disliked ingredients

- **Summary:** Let users exclude allergens (gluten, dairy, egg, peanut, tree nut, soy, sesame, fish, shellfish, mustard, sulfites, nightshades) and any disliked ingredient (tofu, olives, mushrooms, pork, cilantro…). Excluded recipes never appear. This is a core Mealime differentiator.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** All users; safety-relevant for allergic users
- **Context:** Nothing exists today. Ingredient names are free text (see T09), so exclusion can't be done reliably yet.
- **Data Classification:** PII / customer data
- **Notes on data handling:** Allergy data is health-adjacent. Keep it on-device only, never log it, and include it in the T24 export only with the user's consent. Update `.claude/rules/security.md` and `docs/project/security.md`. They currently claim no sensitive data.
- **In scope:** Onboarding steps for allergies and dislikes; settings editor; hard filter in Browse, Favorites, and search (no "show all" escape for allergens); a warning on Recipe Detail if a planned or favorited recipe conflicts after prefs change; in-app disclaimer ("check labels, we can't guarantee…").
- **Out of scope:** Cross-contamination, brand-level label data.
- **Acceptance Criteria:**
  - [ ] Excluding "peanut" hides every recipe with a peanut-tagged ingredient (catalog-wide test)
  - [ ] Dislikes are searchable from the canonical ingredient list
  - [ ] Existing plan entries that conflict get a visible warning
  - [ ] Allergy disclaimer shown at onboarding and in settings
- **Test Strategy:** Catalog-wide tests per allergen; manual: set an allergy and confirm it's excluded everywhere.
- **Dependencies / Blockers:** T09, T22
- **Priority:** P0 - Critical
- **Target date:** 2026-10-19
- **Additional Notes:** A wrong allergen tag is the single highest-liability bug this app can ship. T09's tagging needs a second-pass human review before publishing.

## T09 — Canonical ingredient catalog (foundation)

- **Summary:** Ingredients are free-text strings repeated across 100 recipes, which causes duplicate grocery lines and makes diet and allergen filtering impossible. Introduce a canonical ingredient table and make recipes reference it by id.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** All users (indirectly)
- **Context:** Found in an audit on 2026-10-05:
  - "Plain Greek yogurt" vs "Greek yogurt"; "Green onion" vs "Green onions"; "Bell pepper" / "Bell peppers" / "Red bell pepper"; "Salt" vs "Salt & pepper"
  - The same item in incompatible units: celery as `cup`/`stalk`/none; chickpeas and black beans as `can`/`cup`; chicken breast as `lb`/`oz`; romaine as `cup`/`head`
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** Recipe ids must not change (CLAUDE.md §9).
- **In scope:** `src/data/ingredients.ts`: `{ id, name, pluralName, aisle, tags: (allergen|animal|meat|fish|shellfish|dairy|egg|gluten|grain|sugar…)[], unitFamily, purchaseUnit, isPantryStaple }`. Rewrite each recipe ingredient as `{ ingredientId, amount, unit, prep? }` (prep notes like "diced" go in `prep`, not the name). Add a validation script that fails if any recipe references an unknown ingredient or a unit outside its family.
- **Out of scope:** Nutrition values (T17).
- **Acceptance Criteria:**
  - [ ] Every recipe ingredient resolves to a canonical id
  - [ ] No two canonical entries are the same food
  - [ ] Validation script runs in CI (T20) and passes
  - [ ] Grocery list for the full catalog shows no duplicate-food lines
- **Test Strategy:** Validation script; a snapshot of the grocery list for a fixed 10-recipe plan, before and after.
- **Dependencies / Blockers:** None (unblocks T07, T08, T10, T11, T17)
- **Priority:** P0 - Critical
- **Target date:** 2026-10-14
- **Additional Notes:** Most of the work is data entry. Script the conversion, then review every tag by hand.

## T10 — Unit normalization in grocery aggregation

- **Summary:** "1 cup + 2 tbsp" of the same ingredient shows as two lines, and amounts come out like "7.5 tbsp" or "0.33 can". Convert within each unit family and round to sensible shopping quantities.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** All users at the store
- **Context:** `src/utils/grocery.ts` keys lines by `name__unit`; `units.ts` only does pluralization and two-decimal rounding.
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** —
- **In scope:** Convert volume (tsp/tbsp/cup) and weight (oz/lb) to a base unit, then display in the largest sensible unit; show fractions (½, ⅓, ¼) instead of decimals; round countables up (0.5 bell pepper → 1); purchase-unit hints for canned goods (1.5 cup chickpeas → "1 can (15 oz)"). Fix the pluralizer, which today turns "pinch" into "pinches" correctly only by accident and would turn "leaf" into "leafs".
- **Out of scope:** Metric display toggle (P3 later).
- **Acceptance Criteria:**
  - [ ] 1 cup + 2 tbsp of an ingredient shows as one line, "1⅛ cups"
  - [ ] No decimal amounts are displayed anywhere in the app
  - [ ] Countable produce always shows whole numbers
- **Test Strategy:** Table-driven unit tests for conversion, rounding, and fraction formatting.
- **Dependencies / Blockers:** T09
- **Priority:** P1 - High
- **Target date:** 2026-10-26
- **Additional Notes:** —

## T11 — Pantry staples and "I already have this"

- **Summary:** Olive oil appears in 24 recipes, and seasonings in nearly all of them, so the list fills up with things nobody buys weekly. Mealime lets you mark items you already have.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** All users
- **Context:** Uses `isPantryStaple` from T09.
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** New persisted `pantry: ingredientId[]` → migration.
- **In scope:** A collapsed "Probably in your pantry" section at the bottom of the list; "I have this" on any item, remembered across plans; a pantry editor in settings.
- **Out of scope:** Quantity-tracked inventory.
- **Acceptance Criteria:**
  - [ ] Staples appear in a separate collapsed section
  - [ ] Marking "I have this" moves an item there for future plans
  - [ ] Item count in the header excludes the pantry section
- **Test Strategy:** Unit tests for list partitioning; manual.
- **Dependencies / Blockers:** T09, T22
- **Priority:** P1 - High
- **Target date:** 2026-10-26
- **Additional Notes:** —

## T12 — Grocery list: manual items in the right aisle, editing, and sharing

- **Summary:** Every manually added item is hard-coded into "Pantry & Canned" (milk ends up next to canned beans). Items can't be edited, and the list can't leave the app, which matters for a household where one person plans and another shops.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** All users
- **Context:** `groceryStore.addManual` sets `category: 'Pantry & Canned'`. The aisle taxonomy has no Frozen, Bakery, Beverages, or Household aisles.
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** Sharing uses the OS share sheet only; no network.
- **In scope:** Auto-guess the aisle from the canonical catalog with a manual override; add the missing aisles; edit and delete manual items; "Share list" as plain text grouped by aisle, unchecked items only; an estimated shopping time like Mealime's ("~25 min"), only if cheap to do.
- **Out of scope:** Delivery integrations.
- **Acceptance Criteria:**
  - [ ] Adding "milk" files it under Dairy & Eggs
  - [ ] User can change a manual item's aisle
  - [ ] Share produces readable text with aisle headers and no checked items
- **Test Strategy:** Unit tests for the aisle guess and the share formatter; manual share on iOS/Android.
- **Dependencies / Blockers:** T09
- **Priority:** P1 - High
- **Target date:** 2026-10-29
- **Additional Notes:** —

## T13 — Cooking mode

- **Summary:** Mealime's "stress-free cooking" is a step-by-step mode with hands-free advancing. MealApp shows a static numbered list, and the screen dims while your hands are covered in flour.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** All users while cooking
- **Context:** 91 of the 100 recipes mention a duration in their steps ("simmer 15 minutes"). That's a ready-made source for timers.
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** —
- **In scope:** A "Start cooking" button → full-screen, one step at a time, large type; keep the screen awake (`expo-keep-awake`); show the ingredients used in each step, with amounts scaled to the entry's servings; a tap-to-start timer when a step has a duration, with a local notification when it ends; "Cooked it" at the end (T06).
- **Out of scope:** Voice or gesture advance (Mealime's hands-free). Revisit after launch.
- **Acceptance Criteria:**
  - [ ] Screen doesn't sleep while in cooking mode
  - [ ] Steps with a duration offer a timer that fires even if the app is backgrounded
  - [ ] Final step offers "Cooked it"
- **Test Strategy:** Unit test for duration parsing over all recipe steps; manual on a physical device (timers and keep-awake don't behave the same on web).
- **Dependencies / Blockers:** T04, T06; recipe schema gains optional per-step `ingredientIds` and `timerMinutes`
- **Priority:** P1 - High
- **Target date:** 2026-11-02
- **Additional Notes:** Needs `expo-notifications` for the timer alert, which is the first permission prompt in the app. Ask only when the first timer starts.

## T14 — Search and filtering

- **Summary:** Browse can only filter by meal type, plus a vegetarian toggle that the user can bypass. Add filters for diet, max total time, and favorites. Allergy and dislike exclusions apply everywhere and can't be bypassed.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** All users
- **Context:** `filterRecipes(mealType, dietPref, search)` in `src/utils/recipeCatalog.ts`.
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** —
- **In scope:** A filter object `{ mealType, diets, maxMinutes, favoritesOnly, query }`; filter sheet UI; result count; search that matches canonical ingredient names and plurals; "Hide recipes already in plan" toggle.
- **Out of scope:** Fuzzy or typo-tolerant search (P3).
- **Acceptance Criteria:**
  - [ ] "≤ 20 min" + "Dinner" returns only matching recipes
  - [ ] Allergen-excluded recipes can't appear under any filter combination
  - [ ] Empty results show which filter to relax
- **Test Strategy:** Unit tests over the full catalog for the filter combinations.
- **Dependencies / Blockers:** T07, T08
- **Priority:** P1 - High
- **Target date:** 2026-11-02
- **Additional Notes:** —

## T15 — Recipe photography decision (publish blocker)

- **Summary:** Emoji cards are fine for personal use but a non-starter for a store listing. Mealime sells itself on photos. Decide the source and pipeline.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Owner (decision), then Claude Code (pipeline)
- **Reviewer(s):** Owner
- **End user(s):** All users
- **Context:** CLAUDE.md §5 forbids adding an image pipeline without the owner's sign-off. The project plan flags the trade-off between bundle size and a CDN.
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** Photo licensing records must be kept. Copying Mealime's or any other site's photos isn't allowed.
- **In scope:** Decide between (a) self-shot, (b) licensed stock, or (c) AI-generated with disclosure; then pick a bundled WebP (~100 recipes × ~40 KB ≈ 4 MB) or a CDN with an offline cache; add an `image` field and a fallback to emoji.
- **Out of scope:** Step photos.
- **Acceptance Criteria:**
  - [ ] Decision recorded in docs, with licensing basis
  - [ ] Every recipe has an image; app size stays under 50 MB
- **Test Strategy:** Build size check (`npx expo export`); visual check on device.
- **Dependencies / Blockers:** Owner decision
- **Priority:** P1 - High
- **Target date:** 2026-11-16
- **Additional Notes:** Recommendation: bundled WebP keeps the app fully offline, which is the positioning (T25).

## T16 — Recipe catalog depth and quality

- **Summary:** 100 recipes, of which only 34 are dinners, and zero red meat. That's too thin for 8 diets plus allergy filtering: a vegan, gluten-free user might see 3 dinners.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code (drafting), Owner (taste review)
- **Reviewer(s):** Owner
- **End user(s):** All users
- **Context:** Current mix: 22 breakfast / 26 lunch / 34 dinner / 18 snack; 51 vegetarian / 19 chicken / 14 turkey / 16 fish. Mealime is dinner-centric.
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** All recipes must be originally authored (they are today). Don't copy Mealime's recipes.
- **In scope:** Add a coverage report script (recipes per diet × meal type after typical exclusions); grow to ≥ 150 dinners total with ≥ 20 dinners per supported diet; add beef/pork/lamb dinners so Classic is real (the owner's personal profile excludes them through dislikes); keep ≤ 45 min total; use everyday ingredients only.
- **Out of scope:** Remote content updates (P3; needs a backend).
- **Acceptance Criteria:**
  - [ ] Coverage report shows ≥ 20 dinners for every supported diet
  - [ ] All new recipes pass the T09 validator
  - [ ] Owner has cooked or spot-checked ≥ 10% of new recipes
- **Test Strategy:** Coverage script in CI; manual cook-testing.
- **Dependencies / Blockers:** T07, T09
- **Priority:** P1 - High
- **Target date:** 2026-11-23
- **Additional Notes:** AI-drafted recipes need a human sanity check on quantities and times before publishing.

## T17 — Nutrition per serving

- **Summary:** Calories, protein, carbs, fat, fiber, and sodium per serving (Mealime made this a Pro feature). Also needed so the low-carb and keto diets mean something.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** Health-focused users
- **Context:** Computed from per-ingredient nutrition (USDA FoodData Central, public domain) × amounts, so it updates automatically when recipes change.
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** —
- **In scope:** Per-100 g nutrition plus unit→gram conversions on canonical ingredients; `recipeNutrition()` util; a nutrition panel on Recipe Detail; calorie filter in Browse.
- **Out of scope:** Daily tracking and Apple Health / Health Connect (P3).
- **Acceptance Criteria:**
  - [ ] Every recipe shows per-serving nutrition
  - [ ] Values are within ±15% of a hand-calculated check on 5 sample recipes
  - [ ] "Estimated" disclaimer shown
- **Test Strategy:** Unit tests on the util; manual spot checks.
- **Dependencies / Blockers:** T09
- **Priority:** P2 - Medium
- **Target date:** 2026-11-30
- **Additional Notes:** —

## T18 — Recipe notes and ratings

- **Summary:** Per-recipe private notes ("use less chili") and a thumbs-up/down after cooking, shown on cards. These were Mealime Pro features. They also feed "favorites you actually cook".
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** All users
- **Context:** Builds on T06 history.
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** New persisted store → migration.
- **In scope:** Notes field on Recipe Detail; rating prompt on "Cooked it"; "Times cooked" on the card; Favorites sortable by last cooked.
- **Out of scope:** Sharing notes.
- **Acceptance Criteria:**
  - [ ] Notes persist and show in cooking mode
  - [ ] Rating captured after cooking, editable later
- **Test Strategy:** Store unit tests; manual.
- **Dependencies / Blockers:** T06, T22
- **Priority:** P2 - Medium
- **Target date:** 2026-11-30
- **Additional Notes:** —

## T19 — Settings correctness

- **Summary:** Settings has edge cases that will bite: changing diet or allergies doesn't reconcile the existing plan; local form state is seeded once and goes stale; "Restart onboarding" wipes preferences but keeps the plan and favorites, with no explanation; meal-type preferences only reorder sections.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** All users
- **Context:** `SettingsScreen.tsx` uses `useState(preferences.x)` with no resync. `DIET_OPTIONS`, `ALL_MEAL_TYPES`, `MIN/MAX_HOUSEHOLD` and the stepper markup are duplicated between Onboarding and Settings (breaks the DRY rule in CLAUDE.md §8).
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** —
- **In scope:** Extract shared preference controls into `src/components/`; after a prefs change, flag conflicting plan entries (offer to swap or remove); replace "Restart onboarding" with "Reset all data" (clear everything, with confirmation) plus "Edit preferences"; add an "About / privacy" row.
- **Out of scope:** —
- **Acceptance Criteria:**
  - [ ] Onboarding and Settings share one set of controls
  - [ ] Switching to Vegetarian with a chicken dish planned surfaces a conflict prompt
  - [ ] "Reset all data" clears all four stores
- **Test Strategy:** Manual; unit test for the conflict detector.
- **Dependencies / Blockers:** T07, T08
- **Priority:** P2 - Medium
- **Target date:** 2026-11-02
- **Additional Notes:** —

## T20 — Automated tests and CI

- **Summary:** No test suite, no lint, no CI. Every task above changes persisted data or pure logic. That's exactly where a regression silently corrupts a user's plan.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** Contributors
- **Context:** CLAUDE.md §7 recommends testing `src/utils/` first.
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** —
- **In scope:** `jest-expo` setup; tests for `grocery.ts`, `units.ts`, `recipeCatalog.ts`, `migrateLegacyPlan`; ESLint (expo config); GitHub Actions running `tsc --noEmit`, lint, tests, and the T09 data validator on every push/PR; `npm test` script.
- **Out of scope:** E2E (Maestro/Detox) — P3.
- **Acceptance Criteria:**
  - [ ] `npm test` runs locally and in CI
  - [ ] CI blocks merges on red
  - [ ] ≥ 80% line coverage on `src/utils/`
- **Test Strategy:** CI is the test.
- **Dependencies / Blockers:** T01
- **Priority:** P1 - High
- **Target date:** 2026-10-12 (do early; it pays for T03–T10)
- **Additional Notes:** —

## T21 — Store readiness

- **Summary:** Everything needed to submit to the Play Store and App Store.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code + Owner (accounts, brand)
- **Reviewer(s):** Owner
- **End user(s):** Public
- **Context:** `app.json` has no `ios.bundleIdentifier`, no `android.package`, a placeholder icon and splash, `userInterfaceStyle: "light"`, and the name "MealApp", which is generic and not brandable. No EAS config.
- **Data Classification:** Credentials / secrets
- **Notes on data handling:** Signing keys go through EAS credentials only (see `.claude/rules/security.md` rule 1).
- **In scope:** Final app name (trademark search; no "Mealime" lookalikes); bundle IDs; icon, splash, and adaptive icon; `eas.json`; privacy policy page ("no data collected; allergy data stays on device"); Data Safety form and App Privacy labels; screenshots; store copy; dark mode (or an explicit decision to skip it); `npm audit` clean.
- **Out of scope:** Paid tiers.
- **Acceptance Criteria:**
  - [ ] An internal test build installs on a physical Android and iOS device
  - [ ] Privacy policy URL is live
  - [ ] Store listings drafted with screenshots
- **Test Strategy:** EAS internal distribution builds; checklist review.
- **Dependencies / Blockers:** T15, T02, T08 (privacy wording), T23
- **Priority:** P1 - High
- **Target date:** 2026-11-30
- **Additional Notes:** —

## T22 — Versioned persistence migrations (prerequisite)

- **Summary:** T03, T06, T07, T08, T11 and T18 all change persisted state. Today the only migration is ad-hoc logic in `onRehydrateStorage`. Use zustand persist's `version` + `migrate` per store so upgrades are deterministic and testable.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** Anyone upgrading
- **Context:** CLAUDE.md §9 requires a migration path for every shape change. `planStore.migrateLegacyPlan` is the existing precedent.
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** Never drop user data on a migration failure. Fall back to the old data and log locally.
- **In scope:** Add `version: 1` to all four stores; move legacy plan migration into `migrate`; a pattern doc in CLAUDE.md; tests feeding real v1/v2 persisted blobs.
- **Out of scope:** —
- **Acceptance Criteria:**
  - [ ] Every store declares `version` and `migrate`
  - [ ] A v1 weekly-plan blob migrates to a list-plan in a unit test
  - [ ] A corrupt blob doesn't crash the app (falls back to defaults, with a one-time notice)
- **Test Strategy:** Unit tests with fixture blobs.
- **Dependencies / Blockers:** T20 (test harness)
- **Priority:** P0 - Critical
- **Target date:** 2026-10-12
- **Additional Notes:** —

## T23 — Accessibility pass

- **Summary:** Icon-only buttons (add, remove, heart, back, trash, steppers) have no `accessibilityLabel`/`accessibilityRole`; screen readers announce "button" with no name. Several tap targets are 28–34 pt (the guideline is 44/48). Both stores reject or flag these.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** Users with assistive tech
- **Context:** `RecipeCard`, `BrowseScreen` add button (34 pt), `RecipeDetail` steppers (28 pt), grocery checkboxes (20 pt, though the whole row is pressable, so that one's OK).
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** —
- **In scope:** Labels, roles, and states (`checked`, `selected`) on all interactive elements; minimum 44 pt hit areas; Dynamic Type / font-scale doesn't break layouts; color-contrast check on the gold and sage text.
- **Out of scope:** —
- **Acceptance Criteria:**
  - [ ] VoiceOver/TalkBack can complete onboarding → add meal → check grocery item
  - [ ] All tap targets ≥ 44 pt
  - [ ] Text contrast ≥ 4.5:1
- **Test Strategy:** Manual screen-reader pass on device; contrast checker.
- **Dependencies / Blockers:** None
- **Priority:** P2 - Medium
- **Target date:** 2026-11-23
- **Additional Notes:** `colors.gold` (#C99A3C) on cream almost certainly fails 4.5:1 for the small eyebrow text.

## T24 — Local export and import (backup)

- **Summary:** Export the plan, favorites, history, notes, pantry, and preferences to a JSON file, and import it back. Mealime's biggest shutdown complaint is that users can't take their data with them. Answering that is cheap and a clear positioning point.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** All users; device switchers
- **Context:** No backend by design, so this is the only backup or restore path.
- **Data Classification:** PII / customer data
- **Notes on data handling:** The export contains allergy data. Ask the user to confirm before sharing, and use the OS share sheet only.
- **In scope:** Versioned export schema; import with validation and merge-or-replace choice; Settings entry point.
- **Out of scope:** Cloud sync; importing Mealime data (Mealime has no export to import from).
- **Acceptance Criteria:**
  - [ ] Export → reset all data → import restores everything
  - [ ] An invalid or old-version file shows a clear error and changes nothing
- **Test Strategy:** Unit tests for the schema round-trip; manual on device.
- **Dependencies / Blockers:** T22
- **Priority:** P2 - Medium
- **Target date:** 2026-11-30
- **Additional Notes:** —

## T25 — Positioning and launch decision

- **Summary:** Decide whether and how to publish, given that Mealime shuts down on 2026-10-21 and competitors are already targeting its users.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Owner
- **Reviewer(s):** —
- **End user(s):** Public
- **Context:** Mealime: 4.8★, 54k+ ratings, free core plus a $2.99/mo Pro tier, being shut down by Albertsons with no export and all data deleted. Competitors are already publishing "Mealime alternative" content. Our defensible angle is **fully offline, no account, private, exportable**. Our weakness is catalog depth (T16) and photos (T15).
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** —
- **In scope:** Go/no-go; name; free vs. paid (a one-time unlock fits "no account" better than a subscription); launch platform order (Android first is cheaper and faster through review); a landing page with a waitlist.
- **Out of scope:** Paid acquisition.
- **Acceptance Criteria:**
  - [ ] Decision recorded in `docs/` with name, price model, and target launch date
- **Test Strategy:** n/a
- **Dependencies / Blockers:** None. Decide early, because it sets how much of M3 matters.
- **Priority:** P1 - High
- **Target date:** 2026-10-12
- **Additional Notes:** Don't use "Mealime" in the app name, icon, or store title. Using it in keywords or comparison copy needs a trademark check first.

## T26 — RevenueCat project for the ad-free subscription

- **Summary:** Create the RevenueCat project that backs the $0.99/month ad-free subscription: apps, entitlement, product, offering, and public SDK keys.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code (via the RevenueCat MCP, approved by the owner on 2026-10-05)
- **Reviewer(s):** Owner
- **End user(s):** All users (ad removal)
- **Context:** App code expects entitlement `ad_free`, offering `default` (current), one `$rc_monthly` package (`src/config/purchases.ts`, `src/screens/RemoveAdsScreen.tsx`). Keys go in `.env` / EAS env as `EXPO_PUBLIC_RC_IOS_KEY` / `EXPO_PUBLIC_RC_ANDROID_KEY`.
- **Data Classification:** Credentials / secrets
- **Notes on data handling:** Only *public* SDK keys go into the app or env files; the RevenueCat secret key never enters the repo. `.env` is gitignored.
- **In scope:** Project "Dishcart"; App Store app (`com.bionicsun.dishcart`) and Play Store app (`com.bionicsun.dishcart`); entitlement `ad_free`; product `dishcart_adfree_monthly` on each store app attached to the entitlement; offering `default` with `$rc_monthly`; public keys recorded locally.
- **Out of scope:** Store credentials (.p8 key, Play service account) — T27/T28; paywall templates (the app has its own screen).
- **Acceptance Criteria:**
  - [ ] Project, both store apps, entitlement, products, offering, and package exist and are linked
  - [ ] Public SDK keys are in the local `.env` (not committed)
  - [ ] Store credentials step documented for the owner
- **Test Strategy:** Read back the configuration via the MCP; sandbox purchase in T32.
- **Dependencies / Blockers:** None (store-side products are created in T27/T28; RevenueCat products can exist first)
- **Priority:** P0 - Critical
- **Target date:** 2026-10-05
- **Additional Notes:** Free on RevenueCat until $2.5k monthly tracked revenue.

## T27 — App Store Connect: app record, ad-free subscription, agreements

- **Summary:** Everything on Apple's side so the ad-free subscription can be bought and tested.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Owner (account access); Claude Code registers credentials in RevenueCat
- **Reviewer(s):** Owner
- **End user(s):** iOS users
- **Context:** Bionic Sun LLC Apple Developer account. Product ID must match T26: `dishcart_adfree_monthly`.
- **Data Classification:** Credentials / secrets
- **Notes on data handling:** The In-App Purchase key (.p8) is a secret: upload it to RevenueCat directly or share it out-of-band; never commit it (`*.p8` is gitignored).
- **In scope:** App record (name "Dishcart", bundle `com.bionicsun.dishcart`); subscription group "Dishcart Ad-Free"; auto-renewable subscription `dishcart_adfree_monthly` at $0.99, 1 month, localized display name/description, review screenshot; Paid Applications agreement, tax, and banking; In-App Purchase key (Key ID, Issuer ID, .p8) → RevenueCat; sandbox tester account.
- **Out of scope:** App Store listing/screenshots (T34), submission (T21).
- **Acceptance Criteria:**
  - [ ] Subscription is "Ready to Submit" with price $0.99
  - [ ] Agreements, tax, banking active
  - [ ] RevenueCat shows the App Store app credentials as valid
- **Test Strategy:** RevenueCat credential validation; sandbox purchase in T32.
- **Dependencies / Blockers:** T26
- **Priority:** P0 - Critical
- **Target date:** 2026-10-19
- **Additional Notes:** The first subscription must be submitted *with* an app version for review.

## T28 — Google Play Console: app, ad-free subscription, RevenueCat access

- **Summary:** Everything on Google's side so the ad-free subscription can be bought and tested.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Owner (account access); Claude Code registers credentials in RevenueCat
- **Reviewer(s):** Owner
- **End user(s):** Android users
- **Context:** Package `com.bionicsun.dishcart`; product ID `dishcart_adfree_monthly` (T26).
- **Data Classification:** Credentials / secrets
- **Notes on data handling:** The service-account JSON key is a secret; upload it to RevenueCat directly.
- **In scope:** Play developer account (Bionic Sun LLC, organization verification); app record; an internal-testing release (Play requires an uploaded build before subscriptions can be created); subscription `dishcart_adfree_monthly` with a monthly base plan at $0.99; Google Cloud service account with Play access → RevenueCat; Real-time developer notifications (Pub/Sub) → RevenueCat; license testers.
- **Out of scope:** Store listing (T34), production rollout (T21).
- **Acceptance Criteria:**
  - [ ] Subscription active with a $0.99 monthly base plan
  - [ ] RevenueCat validates the service account and receives RTDN
- **Test Strategy:** RevenueCat validation; license-tester purchase in T32.
- **Dependencies / Blockers:** T26; an Android build from T32
- **Priority:** P0 - Critical
- **Target date:** 2026-10-26
- **Additional Notes:** New personal Play accounts need 12 testers for 14 days before production; an organization account (LLC) avoids that requirement.

## T29 — Promo codes for ad-free

- **Summary:** Set up store-issued codes that grant ad-free, redeemable in-app via Settings → Ads → Redeem a code.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Owner
- **Reviewer(s):** —
- **End user(s):** Friends, press, giveaways, support cases
- **Context:** App Store guideline 3.1.1 forbids custom unlock codes, so codes must come from Apple/Google. The app already opens Apple's redemption sheet (iOS) and the Play redeem page (Android).
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** Treat unused code batches like gift cards (don't post publicly).
- **In scope:** Apple Offer Codes on `dishcart_adfree_monthly` (e.g. 1–12 free months); Google Play promo codes for the subscription; a short internal doc on generating and tracking batches.
- **Out of scope:** Custom code systems (not allowed).
- **Acceptance Criteria:**
  - [ ] A test code on each platform redeems in-app and removes ads
- **Test Strategy:** Redeem on devices during T32.
- **Dependencies / Blockers:** T27, T28
- **Priority:** P2 - Medium
- **Target date:** 2026-11-02
- **Additional Notes:** Apple offer codes: up to 150,000 per app per quarter.

## T30 — Ad network integration (recommendation: Google AdMob)

- **Summary:** Choose an ad network and plug it into the existing `AdProvider` interface so free users see ads in the three placements.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Owner (network choice, account, ad units); Claude Code (integration)
- **Reviewer(s):** Owner
- **End user(s):** Free users
- **Context:** `src/ads/` is built: placements `browse-feed` (every 8th recipe), `recipe-detail`, `plan-footer`; nothing renders until `registerAdProvider()` is called. Never in onboarding, cooking mode, or settings.
- **Data Classification:** PII / customer data
- **Notes on data handling:** Ad SDKs collect device advertising IDs, coarse location, and interaction data. Never pass diet/allergy preferences to ad targeting. Privacy policy and store privacy answers must change in the same PR.
- **In scope:** AdMob account and app IDs; banner ad units per placement; `react-native-google-mobile-ads` + config plugin; `src/ads/admob.ts` AdProvider; Google UMP consent (EEA/UK); App Tracking Transparency on iOS (or non-personalized ads only); `app-ads.txt` on the developer site; privacy policy "Advertising" section; Apple/Google privacy answers; test ads in dev builds.
- **Out of scope:** Interstitials/rewarded ads (intrusive; revisit only with data).
- **Acceptance Criteria:**
  - [ ] Free users see test ads in all three placements; ad-free users see none
  - [ ] Consent flow shown where required; personalized ads only with consent/ATT
  - [ ] Privacy policy and both stores' privacy answers updated
- **Test Strategy:** Dev build with AdMob test IDs; unit test that AdSlot renders nothing for ad-free users; consent tested with a VPN/EEA debug geography.
- **Dependencies / Blockers:** Owner choice of network; T32 dev build
- **Priority:** P1 - High
- **Target date:** 2026-11-16
- **Additional Notes:** At $0.99/month (≈ $0.84 net after the 15% small-business commission), ads are likely the primary revenue.

## T31 — Trademark search for "Dishcart"

- **Summary:** Clear the name before investing in branding and store listings.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Owner (attorney or USPTO search)
- **Reviewer(s):** —
- **End user(s):** n/a
- **Context:** Only a web/app-store check was done (no app named Dishcart found; unrelated "Dish" brands exist, e.g. DISH Network).
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** —
- **In scope:** USPTO search (classes 9 and 42, plus 35 for retail-adjacent); domain and social handle availability; decide whether to file.
- **Out of scope:** International filings.
- **Acceptance Criteria:**
  - [ ] Written go/no-go on the name
- **Test Strategy:** n/a
- **Dependencies / Blockers:** None
- **Priority:** P1 - High
- **Target date:** 2026-10-19
- **Additional Notes:** Do this before T34 (icon/brand assets).

## T32 — Development build and device QA

- **Summary:** Build installable dev/preview apps and test everything the web build can't: purchases, codes, timers, keep-awake, share sheet, backup files, screen readers.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code (EAS builds, test plan); Owner (devices, store test accounts)
- **Reviewer(s):** Owner
- **End user(s):** All users
- **Context:** Purchases need a dev build (not Expo Go). Several features were only verified on web (see commit notes for T13, T24, the subscription work, and #23).
- **Data Classification:** Credentials / secrets
- **Notes on data handling:** EAS credentials stay in EAS; sandbox/tester accounts only.
- **In scope:** `eas build --profile development` for iOS + Android; test script covering: onboarding; plan/swap/cook/undo; grocery pantry/share; cooking-mode timer with app backgrounded (notification) and keep-awake; backup export → reinstall → import; sandbox subscribe → ads disappear; restore on a second device; redeem code; cancel → ads return after expiry; offline grace; VoiceOver/TalkBack walkthrough and largest text size (closes #23).
- **Out of scope:** Store submission (T21).
- **Acceptance Criteria:**
  - [ ] Every item in the test script passes on one iPhone and one Android phone, with results recorded in the issue
- **Test Strategy:** Manual script; bugs filed as new issues.
- **Dependencies / Blockers:** T26 (keys); T27/T28 for purchase steps; EAS account
- **Priority:** P0 - Critical
- **Target date:** 2026-10-26
- **Additional Notes:** —

## T33 — Publish the privacy policy and support contact

- **Summary:** Both stores require a public privacy-policy URL and a support contact; the app's Privacy link currently points at the private GitHub repo.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Owner (hosting, email); Claude Code (page + `PRIVACY_URL`)
- **Reviewer(s):** Owner
- **End user(s):** All users, store reviewers
- **Context:** Draft: `docs/release/privacy-policy.md` (placeholders: contact email, effective date). `PRIVACY_URL` in `src/config/purchases.ts` has a TODO.
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** —
- **In scope:** Support email (e.g. support@ a Bionic Sun domain); host the policy publicly (company site or a public GitHub Pages repo); fill placeholders; update `PRIVACY_URL`; a simple support page with that email.
- **Out of scope:** Terms of service beyond Apple's standard EULA.
- **Acceptance Criteria:**
  - [ ] Policy and support page reachable without login
  - [ ] App's Privacy link opens it
- **Test Strategy:** Open the links from the app on a device.
- **Dependencies / Blockers:** T30 if ads launch at the same time (policy must cover them)
- **Priority:** P1 - High
- **Target date:** 2026-10-26
- **Additional Notes:** —

## T34 — App icon, splash, and store screenshots

- **Summary:** Replace Expo placeholder icon/splash and produce store screenshots for Dishcart.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Owner (design); Claude Code (wiring assets, capturing screenshots from builds)
- **Reviewer(s):** Owner
- **End user(s):** Store visitors
- **Context:** `assets/` are Expo defaults. Screenshot content listed in `docs/release/STORE_CHECKLIST.md`. Depends on photo decision (#15) for appealing screenshots.
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** Use licensed or original artwork only.
- **In scope:** 1024×1024 icon (no transparency for iOS); Android adaptive icon (foreground/background/monochrome); splash; screenshots for 6.7"/6.5" iPhone and Android phone; feature graphic (Play).
- **Out of scope:** App preview videos.
- **Acceptance Criteria:**
  - [ ] Assets in `assets/` and referenced from `app.json`
  - [ ] Screenshot sets ready for both stores
- **Test Strategy:** Visual check on devices (home screen, splash).
- **Dependencies / Blockers:** T31 (name cleared), #15
- **Priority:** P1 - High
- **Target date:** 2026-11-23
- **Additional Notes:** —

## T35 — Retire the old element-dot/MealApp repository

- **Summary:** After the move to mjhanda/MealVine is verified, archive the old repo so nobody works in two places.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** Contributors
- **Context:** Full history was pushed to mjhanda/MealVine on 2026-10-05 and issues were recreated there. The old repo still has the original issue threads.
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** —
- **In scope:** Add a README pointer to the new repo; archive element-dot/MealApp (reversible); remove the `old-origin` remote locally.
- **Out of scope:** Deleting the old repo.
- **Acceptance Criteria:**
  - [ ] Old repo archived with a pointer to the new one
- **Test Strategy:** n/a
- **Dependencies / Blockers:** Owner confirms the new repo is complete; repo renamed to DishCart
- **Priority:** P3 - Low
- **Target date:** 2026-10-12
- **Additional Notes:** —

## T36 — Decide: ship CMU archive recipes as posted, or rewrite before store release

- **Summary:** 165 imported recipes use the posters' own instruction text (credited, no license stated). Decide how they ship.
- **Requester:** Claude Code (raised during the import)
- **Assignee(s) / AI agent:** Owner (decision); Claude Code (rewrite or release-build filter)
- **Reviewer(s):** Owner
- **End user(s):** All users
- **Context:** See docs/recipes/cmu-import-report.md. The 13 hand-adapted recipes (r121–r133) were rewritten; the bulk import (`source.kind: 'as-posted'`) was not.
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** Credits never include emails (enforced by test).
- **In scope:** Choose: ship as posted / rewrite the keepers / exclude from release builds.
- **Out of scope:** Further archive imports.
- **Acceptance Criteria:**
  - [ ] Decision recorded; release builds match it
- **Test Strategy:** If excluded or rewritten, a test enforces it (e.g. no `as-posted` recipes in release data).
- **Dependencies / Blockers:** None
- **Priority:** P1 - High
- **Target date:** 2026-10-26
- **Additional Notes:** Recommendation: rewrite ~60 of the best savory/breakfast recipes, exclude the rest from release.

## T37 — Grocery list: show which meals each item is for

- **Summary:** Each grocery line shows the planned meals that use it ("Garlic — Shrimp Scampi, Lemon Salmon"), with how much each meal needs, so you know what to skip if you drop a meal or what a lone item is for.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** Everyone shopping from the list
- **Context:** Owner request 2026-10-14 (screenshot of the Grocery tab). Lines are merged per canonical ingredient in `src/utils/grocery.ts`, which already walks every plan entry, so the per-meal breakdown is available at aggregation time and just isn't kept. Mealime shows the recipe names under each grocery item.
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** Derived from the plan; nothing new persisted.
- **In scope:**
  - `GroceryLine` gains `uses: { planItemId, recipeId, amount, unit }[]` (computed, not persisted).
  - A one-line subtitle under each item with the meal names (truncate after 2: "Shrimp Scampi + 1 more").
  - Tapping the subtitle expands a per-meal breakdown (amount each meal needs, scaled to that entry's servings); a meal name opens the recipe.
  - Pantry-staple section and checked items show it too; manual items show nothing.
  - Accessibility label includes the meals ("Garlic, 5 cloves, for Shrimp Scampi and Lemon Salmon").
- **Out of scope:** Removing a meal from the grocery screen; meal names in the shared/exported text (follow-up if wanted).
- **Acceptance Criteria:**
  - [ ] Every recipe-derived line lists exactly the plan entries that use it; amounts per meal sum to the line total (same unit family)
  - [ ] Two entries of the same recipe show as "Recipe ×2" with the combined amount
  - [ ] Removing a meal from the plan updates the subtitles immediately
  - [ ] No layout overflow at the largest text size
- **Test Strategy:** Unit tests in `grocery.test.ts` for `uses` (multi-meal, same recipe twice, unit conversion, pantry items); a11y static test; Maestro step in `03-grocery-list.yaml` asserting the meal name under an item; visual check on iOS and Android.
- **Dependencies / Blockers:** None
- **Priority:** P1 - High
- **Target date:** 2026-10-21
- **Additional Notes:** Prerequisite for T39 (a substitute has to know which meals it affects).

## T38 — Substitution catalog (data + safety rules)

- **Summary:** A curated table of substitutes for catalog ingredients (with amount ratios and when they work), filtered so a suggestion never breaks the user's allergies, diet, or dislikes.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code (draft table + rules + tests); Owner (spot-check the table)
- **Reviewer(s):** Owner
- **End user(s):** Everyone shopping from the list; especially users with allergies
- **Context:** Owner request 2026-10-14. 270 catalog ingredients in `src/data/ingredients.ts`. Allergen tags are a safety surface (`.claude/rules/security.md` rule 8): a substitute must be checked against the user's allergies with the same conservative tags.
- **Data Classification:** Health-related or sensitive personal data
- **Notes on data handling:** Allergy filtering runs on-device against existing preferences; nothing new stored or sent.
- **In scope:**
  - `src/data/substitutes.ts`: `ingredientId → { id, ratio, unit?, note?, context? }[]`, e.g. shrimp → chicken breast (1:1); fresh parsley → dried parsley (⅓); lemon (juiced) → lime (1:1) or bottled lemon juice; buttermilk → milk + 1 tbsp lemon juice per cup; brown sugar → sugar + molasses. `context` flags where a swap fails ("not for baking", "texture changes").
  - Coverage target: every non-staple ingredient used in ≥3 recipes has ≥1 substitute; staples optional.
  - `src/utils/substitutes.ts`: `safeSubstitutes(ingredientId, prefs)` drops any substitute whose tags hit the user's allergies, diet (via `src/utils/diets.ts`), or dislikes; ordered by closeness.
  - Composite substitutes (milk + lemon juice) are handled; amounts convert via `units.ts`/`GRAMS`.
- **Out of scope:** UI (T39); recipe-level rewriting of steps; brand products.
- **Acceptance Criteria:**
  - [ ] Every substitute id exists in the catalog and its amount converts (validated in tests, like the unit-family test)
  - [ ] Property test: for every ingredient × every allergen/diet, `safeSubstitutes` never returns a substitute tagged with an excluded allergen or that breaks the diet
  - [ ] Coverage target met; owner signs off on a 30-item sample
- **Test Strategy:** Data validation tests in `src/data/__tests__/`; util tests with ≥80% coverage; exhaustive allergen/diet sweep.
- **Dependencies / Blockers:** None (can run in parallel with T37)
- **Priority:** P2 - Medium
- **Target date:** 2026-10-28
- **Additional Notes:** Substitution ratios come from common kitchen practice, written by us; no copied charts. Never suggest a substitute for an allergy-relevant swap without showing its allergen note.

## T39 — Grocery list: substitutes when the store is out or you already have an alternative

- **Summary:** From a grocery item, see safe substitutes and swap: "Store's out of shrimp? Use chicken breast (12 oz)." If a substitute is already in your pantry, suggest it first so you don't buy the item at all.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** Everyone shopping from the list
- **Context:** Owner request 2026-10-14. Pantry state is `GroceryState.pantry` ('have'/'need') plus catalog `staple`. Builds on T37 (which meals are affected) and T38 (safe substitutes).
- **Data Classification:** Health-related or sensitive personal data
- **Notes on data handling:** Uses on-device allergy preferences only.
- **In scope:**
  - A "Substitutes" action on each grocery line (row menu or long-press) opening a sheet: safe substitutes with converted amounts, any context note, and the meals affected (from T37).
  - "In your pantry" badge on substitutes marked 'have' (or staples), listed first; a subtle hint on the line when one exists ("You may have a substitute").
  - Swap: the line is replaced by the substitute (merged if it's already on the list) and labelled "Swapped for shrimp"; undo via the global undo bar; "Use original" reverts.
  - Recipe page and cooking mode for affected meals show "(using chicken breast instead of shrimp)" next to that ingredient.
  - Persist swaps in the grocery store, keyed by plan entry + ingredient, with a version bump, migration, and backup support (`backupActions.ts` STORES/MIGRATORS); a swap is cleared when its meal leaves the plan.
- **Out of scope:** Rewriting step text; nutrition recalculation for swaps (show "nutrition is for the original" note); swaps outside the grocery list.
- **Acceptance Criteria:**
  - [ ] No substitute shown or applied conflicts with the user's allergies, diet, or dislikes
  - [ ] Swapping updates the list, the affected recipes' ingredient display, and undo restores exactly
  - [ ] Pantry substitutes appear first and the hint shows only when one exists
  - [ ] Swaps survive app restart and backup/restore; removing the meal clears its swaps
- **Test Strategy:** Unit tests for swap application in `grocery.ts`; migration test with a fixture blob; Maestro flow: add a shrimp recipe → open substitutes → swap to chicken → verify list + recipe page → undo; device pass on iOS and Android.
- **Dependencies / Blockers:** T37, T38
- **Priority:** P2 - Medium
- **Target date:** 2026-11-04
- **Additional Notes:** Keep it one tap from the line; Mealime has no substitutes, so this is a differentiator.

## T40 — Detailed cooking steps for the recipes we wrote

- **Summary:** Rewrite the steps of all 133 Dishcart recipes (originals r1–r120 and adapted r121–r133) into full methods a cook can follow in cooking mode, and add a test so they can't slide back.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** Everyone cooking from the app
- **Context:** Owner request 2026-10-18: "preparation instructions need to be more detailed, specifically for the items that you made." Many methods were 2–3 lines or said "cook according to package directions", which cooking mode can't time or split.
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** —
- **In scope:**
  - New step text for r1–r133 that names each step's ingredients and times (cooking mode derives timers and per-step ingredients from the text).
  - Fix data errors found along the way (r97 asked for 12 bunches of asparagus; now 1).
  - Guard test in `src/data/__tests__/recipes.test.ts`: our recipes have ≥ 4 steps and ≥ 250 characters, and never say "package directions".
- **Out of scope:** Archive `as-posted` recipes (their text is the poster's; see T36).
- **Acceptance Criteria:**
  - [x] Every original and adapted recipe passes the guard test
  - [x] Cooking-mode tests still pass
- **Test Strategy:** `npm test` (catalog + cooking tests); owner spot-check in cooking mode.
- **Dependencies / Blockers:** None
- **Priority:** P1 - High
- **Target date:** 2026-10-18
- **Additional Notes:** Done 2026-10-18.

## T41 — Second archive pass: recover more recipes from the review queue

- **Summary:** Pull more CMU Recipe Archive recipes in by mapping spelling variants and parse leftovers in the review queue to ingredients we already stock, plus four catalog additions with USDA nutrition.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** Everyone browsing recipes
- **Context:** Owner request 2026-10-18: "pull in the other menu items." The review queue (`docs/recipes/cmu-import-review.csv`) had 175 recipes blocked only on unknown ingredient names, many of them typos ("whole-what flour", "yogourt").
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** Same rules as the first import: credit the poster, no email addresses, skip cookbook/brand/repost sources.
- **In scope:**
  - Unambiguous aliases in `scripts/import-cmu/ingredient_map.py` (different products, e.g. fruit juice concentrate, stay unmapped).
  - Catalog additions now in use: oat bran, cardamom, bran flakes cereal, dried marjoram — with USDA mappings, grams per unit, and conservative allergen tags.
  - Regenerate `importedRecipes.ts`, the import report, and `nutritionData.ts`.
- **Out of scope:** Recipes blocked for other reasons (reposts, interleaved methods, missing main ingredient).
- **Acceptance Criteria:**
  - [x] Imported recipes 142 → 158 (dessert 57, breakfast 51, side 37, dinner 11, snack 2); catalog 291
  - [x] Every new ingredient has nutrition data; typecheck, lint, and tests pass
- **Test Strategy:** `npm test` (catalog validation, nutrition coverage, no-email check).
- **Dependencies / Blockers:** None
- **Priority:** P2 - Medium
- **Target date:** 2026-10-20
- **Additional Notes:** Done 2026-10-20.

## T42 — Personal deployment: get Dishcart onto the owner's own devices

- **Summary:** Make the app usable day to day by the owner without the App Store or Play Store — e.g. a hosted web build (installable as a home-screen app) or an EAS internal-distribution build.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** Owner (others welcome later)
- **Context:** Owner, 2026-10-18: "I want to get it deployed at least for myself to use. it's really a personal app and if others want to use it, great!" Store tasks (T26–T31, T33, T34) aren't needed for this. All data is on-device, so a static web host works; no hosting project exists yet.
- **Data Classification:** No sensitive data involved (nothing leaves the device; allergies stay in local storage)
- **Notes on data handling:** A web build stores data in the browser's local storage per device; use backup/restore to move it.
- **In scope:**
  - Owner picks the route (static web hosting vs. EAS internal build).
  - Production web export (`npx expo export --platform web`) checked in a browser, plus hosting config.
  - Deploy, after the owner's go-ahead to create the hosting project.
- **Out of scope:** Store listings, ads, subscription setup.
- **Acceptance Criteria:**
  - [ ] Owner can open Dishcart on their phone and their data survives a reload
  - [ ] Deploy steps written in `docs/release/`
- **Test Strategy:** Manual check on the owner's phone; Maestro web/device flow where practical.
- **Dependencies / Blockers:** Owner's choice of route and approval to create the hosting project.
- **Priority:** P1 - High
- **Target date:** 2026-10-25
- **Additional Notes:** —

## T44 — Grocery list: celebrate when everything is picked up

- **Summary:** When the last item on the grocery list is checked, show a short celebration (confetti) and a clear "All picked up" state, so it's obvious at a glance that nothing was missed.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** Everyone shopping from the list
- **Context:** Owner request 2026-10-20 while testing on Android: "just need a signifier that all is checked so nothing is missed while shopping." Today the only signal is the "N of N picked up" subtitle.
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** Nothing new persisted.
- **In scope:**
  - Confetti burst (built with RN `Animated`, no new dependency) the moment the count reaches N of N, once per completion.
  - A persistent "All picked up" banner at the top of the list while everything stays checked; subtitle reads "All N picked up".
  - Screen-reader announcement; reduced-motion setting skips the confetti but keeps the banner.
- **Out of scope:** Sounds, haptics settings, pantry items (not counted toward the total).
- **Acceptance Criteria:**
  - [ ] Checking the last item shows confetti and the banner; unchecking any item removes the banner
  - [ ] Opening the tab with everything already checked shows the banner without replaying confetti
  - [ ] No confetti with reduce motion on
- **Test Strategy:** Unit test for the completion rule in `shoppingList.test.ts`; a11y static test; visual check on the Android emulator.
- **Dependencies / Blockers:** None
- **Priority:** P2 - Medium
- **Target date:** 2026-10-20
- **Additional Notes:** —

## T45 — Buttons and text fit the screen (Browse chip rows cut off)

- **Summary:** The Browse filter rows can't scroll their last chip fully into view on Android ("Hide planned" stays cut off at the right edge). Fix it, and sweep the other screens for buttons or text that don't fit.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** Everyone
- **Context:** Owner screenshot 2026-10-20 (Android emulator, 1080×2400). The horizontal `ScrollView`s in `BrowseScreen.tsx` put `paddingHorizontal` on the scroll view's `style` instead of `contentContainerStyle`, which clips the content on Android.
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** —
- **In scope:**
  - Move the inset into the content container so both ends scroll fully into view.
  - Check every tab and the recipe, cook, and onboarding screens on the emulator for clipped buttons or text.
- **Out of scope:** Tablet layouts.
- **Acceptance Criteria:**
  - [ ] Scrolled to the end, every Browse chip is fully visible with the same margin as the screen edge
  - [ ] No clipped buttons or text found on the other screens
- **Test Strategy:** Visual check on the Android emulator (scrolled to both ends).
- **Dependencies / Blockers:** None
- **Priority:** P1 - High
- **Target date:** 2026-10-20
- **Additional Notes:** —

## T46 — Make-it-yourself recipes for dressings and sauces, with store-bought as the shortcut

- **Summary:** Every recipe that calls for a bottled dressing or sauce shows how to make it from scratch, with buying it as the time-saving alternative (e.g. "buy Caesar dressing to save time"). The grocery list follows the choice.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** Everyone cooking from the app
- **Context:** Owner request 2026-10-20. Eight store-bought sauces appear in our recipes: Caesar dressing, peanut sauce, pesto, marinara, salsa, enchilada sauce, cocktail sauce, balsamic glaze (21 uses across r8–r118).
- **Data Classification:** No sensitive data involved
- **Notes on data handling:** The per-meal choice is stored on the plan entry (plan store v2, with migration).
- **In scope:**
  - Eight new Dishcart "Sides & sauces" recipes (r134–r141), one per sauce, from ingredients already in the catalog.
  - `src/data/homemade.ts` maps each store-bought ingredient to its recipe and batch yield (same unit family, enforced by test).
  - Recipe page: under the sauce ingredient, a Make it / Buy it choice and a link to the sauce recipe. Default is make it; buy it is labeled as the time saver.
  - Plan entries remember the choice (`storeBought` list). Plan store v1 → v2 migration keeps existing entries on store-bought so current grocery lists don't change.
  - Grocery list: making it swaps the bottled item for the sauce recipe's ingredients (whole batches).
  - Cooking mode: when making it, a first step says to make the sauce, with its method.
  - Allergy, diet, and avoided-ingredient checks cover both versions (a recipe is flagged if either the bottled or the homemade sauce conflicts). Measured impact: r82 no longer fits low-carb/keto; new allergen flags soy (r8, r82), gluten (r82), sesame (r66), sulfite (r63).
- **Out of scope:** Nutrition and total time per choice (both stay on the store-bought version; e.g. making pesto adds 13 minutes the Quick meals chip doesn't count); "Cook again" from history starts over at make-it (history doesn't record the choice); sauces made inline in a recipe's own steps (vinaigrettes) are already from scratch.
- **Acceptance Criteria:**
  - [ ] Each of the 21 uses shows the choice and links to the right recipe
  - [ ] Switching to make it replaces the bottled line on the grocery list with the sauce's ingredients; switching back restores it
  - [ ] Existing plans are unchanged after the update
- **Test Strategy:** Unit tests for the homemade map, grocery expansion, and conflicts; migration test with a v1 fixture; catalog validation for r134–r141; visual check on the Android emulator.
- **Dependencies / Blockers:** None
- **Priority:** P1 - High
- **Target date:** 2026-10-21
- **Additional Notes:** —

## T47 — Your own recipes: create and edit by hand

- **Summary:** Add, edit, and delete your own recipes in the app (title, meal type, servings, times, emoji, ingredients, steps). They behave like catalog recipes: browse, search, favorite, add to the plan, grocery list, cooking mode.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** Owner (personal use first)
- **Context:** Owner request 2026-10-20. Mealime is shutting down and Dishcart replaces it for the owner, who has their own dishes. Today every recipe is compiled into the bundle (`src/data/recipes.ts`).
- **Data Classification:** User-entered content; on-device only
- **Notes on data handling:** New persisted store (`customRecipesStore`), included in backups (`STORES`/`MIGRATORS` in `backupActions.ts`). Never transmitted.
- **In scope:**
  - Persisted store of user recipes (ids `u-…`, never clashing with catalog ids), with `persistOptions` versioning and a migration test.
  - `recipeById` and Browse/search/favorites/plan/grocery/cooking all see user recipes; a "My recipes" chip in Browse.
  - Editor screen: ingredients picked from the catalog (search by name, unit limited to that ingredient's unit family) so the grocery list, nutrition, and allergy checks keep working; a free-text ingredient is allowed and goes to the grocery list's "Other" aisle as-is, marked "not checked for allergies".
  - Recipe page shows "Your recipe" with Edit / Delete (delete uses the undo bar); deleting removes it from the plan via the undo-able path.
- **Out of scope:** Photos; sharing recipes with others; editing catalog recipes (a "Duplicate and edit" could follow).
- **Acceptance Criteria:**
  - [ ] Create a recipe with catalog and free-text ingredients, add it to the plan, see it on the grocery list, cook it
  - [ ] Allergy/diet checks apply to catalog ingredients; free-text ones are flagged as unchecked
  - [ ] Survives app restart and backup → restore
- **Test Strategy:** Store + migration tests; util tests for validation and catalog integration; a11y static test; emulator walkthrough.
- **Dependencies / Blockers:** None
- **Priority:** P1 - High
- **Target date:** 2026-10-21
- **Additional Notes:** Prerequisite for T48.

## T48 — Import a recipe from a website (personal use)

- **Summary:** Paste a recipe page's link; Dishcart reads the page's recipe data, maps the ingredients to the catalog, and opens the T47 editor pre-filled so you can fix anything before saving. Also accept pasted recipe text when a site can't be read.
- **Requester:** Owner
- **Assignee(s) / AI agent:** Claude Code
- **Reviewer(s):** Owner
- **End user(s):** Owner (personal use)
- **Context:** Owner request 2026-10-20: "pull in recipes from a site for personal use." Most recipe sites publish schema.org `Recipe` JSON-LD (name, recipeIngredient, recipeInstructions, recipeYield, times). For personal use only: imported recipes stay on the device and are never redistributed.
- **Data Classification:** Third-party copyrighted content, saved privately on the user's device
- **Notes on data handling:** First network call in the app: one user-initiated GET to the URL the user pasted; nothing about the user is sent. Per `.claude/rules/security.md` rule 4, update `docs/project/security.md` and the rules file (data in transit, the URL fetch) in the same change. Keep the source URL and site name on the recipe as credit.
- **In scope:**
  - Pure parser in `src/utils/` for JSON-LD `Recipe` (including `@graph`, HowToStep/HowToSection), ingredient-line parsing (amount, unit, name) and catalog matching, reusing the unit rules; well tested against saved HTML fixtures.
  - Fetch on native (iOS/Android); on web, where browsers block most cross-site reads, offer paste-the-text instead.
  - "Paste recipe text" fallback using the same line parser.
  - Unmatched ingredients become free-text lines (T47 rules) for the user to map or keep.
- **Out of scope:** Scraping sites without structured data beyond the paste fallback; bulk import; sharing imported recipes; any server.
- **Acceptance Criteria:**
  - [ ] A typical recipe URL imports into the editor with title, servings, ingredients (most matched), and steps
  - [ ] A page without recipe data shows a clear message and the paste option
  - [ ] Security docs updated for the new network call
- **Test Strategy:** Parser unit tests with fixture pages (at least 3 structures); manual import on the Android emulator.
- **Dependencies / Blockers:** T47
- **Priority:** P1 - High
- **Target date:** 2026-10-21
- **Additional Notes:** —
