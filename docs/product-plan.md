# MealVine — Product Plan

Last updated 2026-10-05. Work items live in GitHub issues (mirrored in
[`docs/TASKS.md`](TASKS.md)); this file covers what the product is, what's
built, and the decisions behind it.

## 1. Product

A personal meal planner. **Pick meals that fit how you eat → get one
aisle-sorted grocery list → cook from clear step-by-step instructions.** The
plan is a list of meals you intend to cook, not a calendar: you cook them
whenever you like and tick them off.

- **Who it's for:** individuals and households that want weeknight dinners
  (and optionally breakfasts, lunches, snacks) without the "what's for
  dinner + what do I buy" overhead.
- **Positioning:** works offline, no account, private by default, and your
  data stays exportable. Competitive context (Mealime's 2026-10-21 shutdown) is
  in `TASKS.md` and issue #25.
- **Name / publisher:** **MealVine**, published by **Bionic Sun LLC** on the App Store and Google Play
  (`com.bionicsun.mealvine`). No competitor's name or branding may appear in the app or store listing.
- **Business model:** subscription, $4.99/month plus a yearly plan, 14-day free trial, then a hard
  paywall (shown after onboarding). RevenueCat handles purchases and entitlement (`pro`).

## 2. Core loop and what's built

| Step | Built |
|---|---|
| **Set up** | Onboarding: household size → diet (8 options) → allergies (12) → ingredients to avoid → meal types. Everything is editable in Settings. |
| **Pick** | Browse/search 100 recipes by title or ingredient, filtered by meal type and diet; allergens and dislikes always excluded. ⊕ adds to the plan, ✓ removes it again (undoable). |
| **Plan** | List grouped by meal type; each entry has its own servings. Swap (⟳) replaces a meal with another of the same type. Conflicts with preferences are flagged. |
| **Shop** | Grocery list derived live from the plan: one line per ingredient, units merged within a family (cups + tbsp), grouped by store aisle, checkable, plus your own items. Check-offs reset when an ingredient leaves the plan. |
| **Cook** | Recipe detail with servings scaling, ingredients, and steps. ✓ "Cooked it" moves a meal into Recently cooked, with "Cook again". |
| **Keep** | Favorites (allergen-conflicting ones are hidden, with a count). |

Gaps against a polished competitor are tracked as issues: unit/fraction display
and pantry staples (#10, #11), grocery sharing and manual-item aisles (#12),
cooking mode with timers (#13), richer filters (#14), photos (#15), catalog
depth (#16), nutrition (#17), notes and ratings (#18), export/backup (#24),
store readiness (#21, #23).

## 3. Architecture (summary)

Expo (React Native + TypeScript), one codebase for iOS, Android, and web. No
backend, no network calls, no auth. State is in Zustand stores persisted to
AsyncStorage with versioned migrations. Recipes and a canonical ingredient
catalog are bundled TypeScript data. Diets and allergen exclusions are
derived from ingredient tags. See `CLAUDE.md` for the code map and rules, and
`docs/project/architecture.md` and `docs/project/security.md` for the formal
architecture and security notes.

## 4. Decisions log

| Date | Decision | Why |
|---|---|---|
| 2026-09 | Plan is a flat list, not a 7-day grid (v2) | Matches how people actually cook; no generator or regenerate needed. Old weekly plans migrate automatically. |
| 2026-09 | AsyncStorage via Zustand `persist`, not SQLite | A handful of small JSON blobs; revisit only if search at scale becomes slow. |
| 2026-09 | Emoji instead of photos for v1 | Speed. A publish blocker; see #15. |
| 2026-10-05 | Canonical ingredient catalog; recipes reference ids | Free-text names caused duplicate grocery lines and made diet/allergy filtering impossible. |
| 2026-10-05 | Diets derived from tags; eight diets | Hand-tagging drifts. Each diet must have ≥10 recipes (enforced by test). |
| 2026-10-05 | Allergen tags are conservative | A missed tag is a safety bug; an extra tag only hides a recipe. Disclaimer shown wherever allergies are set. |
| 2026-10-05 | v1 "veg + lean protein" maps to Flexitarian | It was exactly "no red meat, no pork". |
| 2026-10-05 | Undo instead of confirm for reversible actions | Faster, and less nagging; confirmations only for bulk-destructive actions. |
| 2026-10-05 | Name MealVine, publisher Bionic Sun LLC, both stores | Owner decision (#25). Trademark caution: an app called "MealTwine" exists. |
| 2026-10-05 | $4.99/mo + yearly subscription, 14-day trial, hard paywall, RevenueCat | Owner decision. Trade-off accepted: one third-party SDK with network access, so store privacy labels declare purchase history + an anonymous ID; meal data stays on-device. |

## 5. Open decisions (owner)

- **Yearly price** (recommendation: $29.99, "save 50%") and **launch date**.
- **#15 Photos:** self-shot, licensed, or AI-generated with disclosure; bundled vs CDN.
- **Red meat and pork recipes (#16):** none exist today, so Classic is
  effectively Flexitarian. Adding them is needed for a general audience.
