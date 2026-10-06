# Store Readiness Checklist (T21)

Status as of 2026-10-05. ✅ done in repo · 🟡 drafted, needs owner · ⛔ blocked on an owner decision.

## Owner decisions (blocking)

| | Item | Why it blocks | Issue |
|---|---|---|---|
| ⛔ | **App name** | Store title, bundle IDs, icon, privacy-policy URL all depend on it. Needs a trademark search; nothing resembling "Mealime". | #25 |
| ⛔ | **Publisher / legal entity** | Store accounts (Apple Developer $99/yr, Google Play $25 once) and the privacy policy name the publisher. | #25 |
| ⛔ | **Bundle identifier / package name** | e.g. `com.<yourdomain>.<appname>`; permanent once published. Set `expo.ios.bundleIdentifier` and `expo.android.package` in `app.json`. | — |
| ⛔ | **Recipe photos** | Emoji-only listings won't convert; screenshots depend on this. | #15 |
| ⛔ | **Price model** | Free / one-time unlock / subscription changes store setup. | #25 |

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

**Apple App Privacy:** "Data Not Collected". (No data leaves the device; local storage is not "collection". User-initiated share/export goes to destinations the user picks.)

**Google Play Data safety:** No data collected; no data shared. Data is not encrypted in transit (none is transmitted). Users can request deletion: yes, via Settings → Reset all data.

**Permissions requested:** Notifications only (for cooking timers, asked on first timer start).

## Store listing draft

**Short description (80 chars):** Pick meals, get one aisle-sorted grocery list, cook step by step. Fully offline.

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
