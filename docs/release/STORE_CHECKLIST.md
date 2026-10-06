# Store Readiness Checklist (T21)

Status as of 2026-10-05. ✅ done in repo · 🟡 drafted, needs owner · ⛔ blocked on an owner decision.

## Decisions (2026-10-05)

| | Item | Decision |
|---|---|---|
| ✅ | App name | **MealVine**. ⚠️ A meal-planning app named "MealTwine" exists; run a proper USPTO search (classes 9 and 42) before launch. |
| ✅ | Publisher | **Bionic Sun LLC** |
| ✅ | Bundle ID / package | **com.bionicsun.mealvine** (set in `app.json`) |
| ✅ | Price model | Subscription via **RevenueCat**: **$4.99/month** + yearly plan, **14-day free trial**, then hard paywall (shown right after onboarding). Entitlement id `pro`. |
| ✅ | Platforms | Apple App Store and Google Play |
| ⛔ | **Recipe photos** | Still open (#15); emoji-only listings won't convert. |
| ⛔ | **Yearly price** | Not set yet; $29.99/yr (save 50%) is the recommendation. |

## Subscription setup (owner + Claude)

- [ ] **RevenueCat project "MealVine"** with iOS (app_store) + Android (play_store) apps, entitlement `pro`, offering `default` with `$rc_monthly` and `$rc_annual` packages. (Claude can do this via the RevenueCat MCP once you OK it.)
- [ ] **App Store Connect:** create the app (com.bionicsun.mealvine), a subscription group "MealVine", products `mealvine_monthly` ($4.99) and `mealvine_yearly`, each with a **14-day free introductory offer**; In-App Purchase key (.p8) → RevenueCat. Paid Applications agreement, tax, and banking must be signed for subscriptions to work.
- [ ] **Google Play Console:** create the app, subscriptions `mealvine_monthly` / `mealvine_yearly` with base plans + a **14-day free trial** offer; service-account JSON → RevenueCat; RTDN Pub/Sub topic.
- [ ] Put the public SDK keys in `.env` (`EXPO_PUBLIC_RC_IOS_KEY`, `EXPO_PUBLIC_RC_ANDROID_KEY`) and in EAS env vars for builds.
- [ ] Sandbox test on devices (dev build, not Expo Go): trial start, renewal, cancel, restore, offline grace (3 days past verified expiry).

## Built / drafted

| | Item | Notes |
|---|---|---|
| ✅ | `eas.json` | `development` (dev client), `preview` (internal; Android APK), `production` (auto-increment, remote versioning). |
| 🟡 | Privacy policy | `docs/release/privacy-policy.md`, accurate to the code. Fill the bracketed values and host it publicly (a simple GitHub Pages page is enough). |
| 🟡 | App Privacy (Apple) / Data safety (Google) answers | See below; both are "no data collected". |
| ✅ | Dependency audit | `npm audit --omit=dev`: 3 advisories, all transitive in build tooling (`braces`, `node-forge`, `uuid` via Expo CLI/config plugins), none in the shipped JS bundle. npm's suggested fix downgrades Expo to SDK 44, so it was **not** applied. Re-run after the next Expo SDK upgrade. |
| ✅ | Dark mode | **Decision: light only for v1** (`userInterfaceStyle: "light"`). The palette and the contrast tests are light-only; adding dark mode is a theme project. Revisit after launch. |
| ✅ | Accessibility (code) | Contrast, roles/labels, 44pt targets (T23). Device screen-reader pass still open on #23. |

## Still to do once decisions land

- [ ] App icon (1024×1024, no transparency for iOS), Android adaptive icon foreground/background/monochrome, splash. Current assets are Expo placeholders.
- [ ] `app.json`: `name`, `slug`, `ios.bundleIdentifier`, `android.package`, `ios.infoPlist.ITSAppUsesNonExemptEncryption: false` (no custom encryption).
- [ ] `eas build --profile preview` → install on a physical iPhone and Android phone; run through onboarding → plan → grocery → cook → backup.
- [ ] Screenshots: 6.7" and 6.5" iPhone, plus Android phone. Show Plan, Browse (with filters), Grocery (aisles + pantry), Cooking mode, Settings (allergies).
- [ ] Store listing copy (draft below) with the final name.
- [ ] Submit Android first (faster review), then iOS.

## Privacy questionnaire answers

**Apple App Privacy** (because of RevenueCat): **Purchases → Purchase History** and **Identifiers → User ID** (RevenueCat's anonymous app user ID), both *linked to the user? No*, *used for tracking? No*, purpose **App Functionality**. Everything else: not collected. Re-check against RevenueCat's current "Apple App Privacy" guide before submitting.

**Google Play Data safety:** Collected: **Financial info → Purchase history** and **App info & performance / Device or other IDs** as required by RevenueCat's Play guidance; purpose App functionality; not shared for advertising; encrypted in transit: yes. Meal data, preferences, and allergies: not collected (on-device only). Deletion: Settings → Reset all data (on-device); subscription records on request via the support email.

**Permissions requested:** Notifications only (for cooking timers, asked on first timer start).

## Store listing draft

**Short description (80 chars):** Pick meals, get one aisle-sorted grocery list, cook step by step. Try 14 days free.

**Full description:**

> Plan meals without the planning. Pick a few recipes that fit how you eat,
> and [App name] builds one grocery list sorted by store aisle, then walks you
> through cooking, one step at a time.
>
> • 8 diets: Classic, Flexitarian, Pescetarian, Vegetarian, Vegan, Low carb, Keto, Paleo
> • Hides recipes with your allergies or the ingredients you won't eat
> • Grocery list merges ingredients across meals, skips pantry staples, and shares as text
> • Cooking mode with step timers, and it keeps your screen on
> • Notes and ratings so your favorites get better every time
> • No account. No ads. Works offline. Your data stays on your phone, and you can export it anytime.
>
> Try MealVine free for 14 days, then $4.99/month (or save with yearly). Cancel anytime in your
> App Store / Google Play settings.
