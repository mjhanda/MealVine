# Store Readiness Checklist (T21)

Status as of 2026-10-05. ✅ done in repo · 🟡 drafted, needs owner · ⛔ blocked on an owner decision.

## Decisions (2026-10-05)

| | Item | Decision |
|---|---|---|
| ✅ | App name | **Dishcart** (replaced MealVine). Quick web/app-store check found no app by that name; still run a USPTO search (classes 9 and 42) before launch. |
| ✅ | Publisher | **Bionic Sun LLC** |
| ✅ | Bundle ID / package | **com.bionicsun.dishcart** (set in `app.json`) |
| ✅ | Business model | **Free with ads.** One subscription, **$0.99/month**, removes ads (entitlement `ad_free`). No trial, no annual plan. Store-issued codes (Apple Offer Codes, Google Play promo codes) also remove ads. |
| ✅ | Platforms | Apple App Store and Google Play |
| ⛔ | **Ad network** | Not chosen. Slots are built (`src/ads/`) and render nothing in release builds until a provider is registered. See "Adding ads" below. |
| ⛔ | **Recipe photos** | Still open (#15). |

## Ad-free subscription setup

- [ ] **RevenueCat project "Dishcart"**: iOS (app_store) + Android (play_store) apps, entitlement `ad_free`, offering `default` with one `$rc_monthly` package. (Claude can create this via the RevenueCat MCP once you OK it.)
- [ ] **App Store Connect:** app `com.bionicsun.dishcart`; subscription group "Dishcart Ad-Free"; product `dishcart_adfree_monthly` at **$0.99** (lowest tier); App Store Connect In-App Purchase key (.p8) → RevenueCat. Sign the Paid Applications agreement, tax, and banking.
- [ ] **Google Play Console:** subscription `dishcart_adfree_monthly`, base plan monthly $0.99; service-account JSON → RevenueCat; RTDN Pub/Sub topic.
- [ ] **Codes:** Apple → Subscriptions → Offer Codes (free months of ad-free; up to 150k codes per quarter). Google → Monetize → Promo codes for the subscription. Users redeem in-app via Settings → Ads → Redeem a code. (Custom codes are not allowed: App Store guideline 3.1.1.)
- [ ] Public SDK keys in `.env` / EAS env vars (`EXPO_PUBLIC_RC_IOS_KEY`, `EXPO_PUBLIC_RC_ANDROID_KEY`).
- [ ] Sandbox test on devices (dev build): subscribe, restore, redeem code, cancel, offline grace.

## Adding ads (when you pick a network)

Recommended: **Google AdMob** via `react-native-google-mobile-ads` (Expo config plugin, works with dev builds).

1. Create AdMob app IDs (iOS + Android) and banner ad unit IDs per placement (`browse-feed`, `recipe-detail`, `plan-footer`).
2. Implement `src/ads/admob.ts` exporting an `AdProvider` (`init` runs consent then SDK start; `Banner` renders a `BannerAd`). Register it once in `App.tsx` with `registerAdProvider(...)`. No screen changes needed.
3. Consent: Google UMP form (GDPR/UK), then Apple **App Tracking Transparency** prompt on iOS (`NSUserTrackingUsageDescription`) if serving personalized ads; otherwise request non-personalized ads only.
4. Add `app-ads.txt` to the developer website.
5. **Rewrite the privacy policy's Advertising section and both stores' privacy answers** (AdMob collects device IDs, coarse location, usage/ad data; Apple labels become "Data Used to Track You" if personalized).
6. Families/kids policies: keep ads non-personalized if the app could be seen as child-directed (it isn't today).

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

**Apple App Privacy** (RevenueCat only, while no ad network is installed): **Purchases → Purchase History** and **Identifiers → User ID** (RevenueCat's anonymous app user ID), both *linked to the user? No*, *used for tracking? No*, purpose **App Functionality**. Everything else: not collected. Re-check against RevenueCat's current "Apple App Privacy" guide before submitting.

**Google Play Data safety:** Collected: **Financial info → Purchase history** and **App info & performance / Device or other IDs** as required by RevenueCat's Play guidance; purpose App functionality; not shared for advertising; encrypted in transit: yes. Meal data, preferences, and allergies: not collected (on-device only). Deletion: Settings → Reset all data (on-device); subscription records on request via the support email.

**Permissions requested:** Notifications only (for cooking timers, asked on first timer start). Adding personalized ads adds App Tracking Transparency on iOS.

## Store listing draft

**Short description (80 chars):** Pick meals, get one aisle-sorted grocery list, cook step by step. Free.

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
> Dishcart is free. Go ad-free for $0.99/month — cancel anytime in your App Store / Google Play settings.
