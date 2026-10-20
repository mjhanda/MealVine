Security Rules
==============

> Baseline security and code-quality rules for Dishcart. Filled in against the current architecture: a single-user, local-only Expo/React Native app with no backend and no accounts. Its only app-initiated network use is one user-initiated GET of a recipe page the user pastes (recipe import, T48; see "Network: recipe import" below) plus the RevenueCat SDK for the ad-free subscription (see `.claude/rules/security.md`). Most standard web/API security domains below are genuinely Not Applicable at this stage — that's a fact about the current architecture, not an unresolved placeholder. Revisit this file (see Notes) before any Phase 2/3 work that adds a backend, auth, or remote content updates.

* * * * *

Code Quality Standards
----------------------

-   **Cyclomatic complexity limit:** ≤ 5 target, refactor if > 7. *(How many branches/paths — if/else, loops — a single function has. Lower = easier to test and maintain.)* Enforced via: no linter configured yet — enforced by convention per `General_Code_Quality_Prompts.md`; add `eslint "complexity": ["error", 8]` if this becomes a multi-contributor project.

-   **Cognitive complexity limit:** ≤ 5 target, refactor if > 7. Enforced via: convention only (see above).

-   **Linting/formatting tool:** Not yet configured (no ESLint/Prettier config in the repo) — enforced in CI, blocking merge on failure: No (no CI configured; single-developer local project).

* * * * *

Authentication & Authorization
------------------------------

*(Authentication = proving who you are. Authorization = what you're allowed to do once logged in.)*

-   **Auth method:** Not applicable — no accounts exist in the app.
-   **Password hashing algorithm:** Not applicable — no passwords are stored.
-   **Session/token model:** Not applicable — no sessions or tokens.
-   **Authorization model:** Not applicable — single local user, no roles.
-   **MFA:** Not applicable.

* * * * *

Client-Side Security (web and/or mobile)
----------------------------------------

-   **Applicable platform(s):** Both — one Expo/React Native codebase targets Web, iOS, and Android.
-   **Sensitive data storage on device:** One health-adjacent field: the user's allergy list (`Preferences.allergies`). It is stored only in on-device AsyncStorage alongside the other preferences (diet, disliked ingredients, plan, history, favorites, grocery check-state, the user's own recipes), never transmitted (recipe import sends only the pasted URL; see below) and never logged. Treat it as sensitive: no logging, and any export must be user-initiated with consent.
-   **Certificate/TLS validation:** Platform default (iOS ATS / Android network security config) for the recipe-import fetch; no custom trust, no pinning, no cleartext exceptions. Plain `http://` links are therefore refused by the OS on native builds.
-   **If web frontend exists:** (yes, via Expo web export)
    -   DOM injection handling (e.g., sanitize before `dangerouslySetInnerHTML` or equivalent): Not applicable — no raw HTML injection anywhere in the app; all content renders through React Native Web components.
    -   User-supplied URL handling in links: An imported recipe keeps the URL the user pasted as its credit and offers "View original" (`Linking.openURL`). Only `http(s)` URLs are accepted (`normalizeRecipeUrl` rejects `javascript:`, `file:`, and anything else); page content never supplies a link we open.
    -   CSRF protection: Not applicable — no server, no cookies, no state-changing requests.
    -   Cookie flags (`HttpOnly`, `Secure`, `SameSite`): Not applicable — the app sets no cookies.
    -   CORS allowed origins: Not applicable — no API for CORS to apply to.

* * * * *

API Security
------------

-   **Input validation:** Free text the user types (grocery items, their own recipes in the editor — validated by `validateDraft` in `src/utils/customRecipes.ts`) is stored and displayed locally only, never executed or sent anywhere. Imported web pages are untrusted input: `src/utils/recipeImport.ts` only `JSON.parse`s the page's JSON-LD blocks and keeps plain text (tags stripped, entities decoded); nothing from the page is executed, rendered as HTML, or used as a URL, and the result lands in the editor for the user to review before saving. Free-text ingredients are never assumed allergen-free (shown as "Not checked for allergies").
-   **Database access:** Not applicable — no database; state reads/writes go through Zustand's `persist` middleware to AsyncStorage as JSON.
-   **Error responses:** Not applicable — no server responses. Client-side errors from AsyncStorage failures should fail soft (the app should not crash if local storage is briefly unavailable) rather than surface raw errors to the user.
-   **Security headers:** Not applicable for the packaged app. If the static web export is ever hosted, standard headers (CSP, X-Content-Type-Options, etc.) should be added at the hosting layer — not yet done since no hosting is configured.

* * * * *

Rate Limiting & Abuse Prevention
--------------------------------

-   **API rate limit:** Not applicable — no API.
-   **Brute-force lockout:** Not applicable — no login.

* * * * *

Secrets Management
------------------

*(A "secret" is any password, API key, or credential the app needs.)*

-   Secrets storage: Not applicable today — the app uses no API keys, backend credentials, or third-party service tokens. This will change when native builds are signed for release (see below).
-   No secrets committed to source control — confirmed via: manual review before each commit (no automated pre-commit secret scanner configured). **Action item before any App Store/Play Store release:** iOS/Android signing credentials and any future EAS/Expo account tokens must never be committed — keep them in EAS's own credential storage or local, gitignored files, and confirm `.gitignore` covers `*.jks`, `*.p8`, `*.p12`, `*.key`, `*.mobileprovision` (it already does).

* * * * *

Dependency & Supply Chain Security
----------------------------------

-   Vulnerability scanning tool: `npm audit` (manual, ad hoc) — no automated scanner (Dependabot/Snyk) configured yet.
-   Scan trigger: Manual, run on demand — not on a schedule or per-PR since there's no CI yet.
-   Dependency versions locked/pinned: Yes — `package-lock.json` is committed.

* * * * *

Data Classification & Handling
------------------------------

-   **Data collected:** None beyond the user's own on-device app preferences (household size, diet choice, meal plan, favorites, grocery list, recipes they write themselves). Nothing is transmitted anywhere.
-   **PII in scope:** Limited. No identity or account data. Allergy preferences are health-adjacent personal data held on-device only. No third-party SDKs (analytics, payment/subscription providers) are integrated — if any are added later, re-check this line, since they commonly collect device identifiers implicitly and must never receive preferences.
-   **Encryption at rest:** Relies on OS sandboxing and device encryption (iOS Data Protection / Android file-based encryption). App-level encryption of AsyncStorage not added: the only sensitive field is an allergy list with no identity attached. Revisit if accounts, sync, or any identifying data are introduced.
-   **Encryption in transit:** Recipe import fetches over HTTPS (platform TLS; cleartext blocked by OS defaults on native). No app data is in transit: see below.
-   **Audit logging:** Not applicable — no server-side actions to audit.

* * * * *

Network: recipe import (T48)
----------------------------

-   **What:** One `GET` of the recipe page URL the user pastes on the Import screen, started only by tapping "Read recipe from link" (`src/services/recipeFetch.ts`, the only caller). Native iOS/Android only; on web the browser's CORS rules block it, so web offers paste-text instead.
-   **What is sent:** The URL itself and the platform's default request headers. `credentials: 'omit'` (no cookies), no custom headers beyond `Accept`, no identifiers, no preferences, allergies, plan, or recipes. Never add query parameters or headers carrying app data.
-   **Limits:** 15 s timeout, 5 MB cap, `http(s)` only. Errors are shown in plain words; nothing is retried in the background.
-   **What is kept:** The parsed recipe, after the user reviews and saves it, in the on-device `customRecipesStore` with the source URL and site name as credit. Imported recipes are third-party content saved for personal use: never redistributed or shared by the app.
-   **Third parties:** The site the user chose sees a request from the device's IP address, as if the user opened the page in a browser. No other party is involved.

* * * * *

Notes
-----

-   Revisit this file when the stack, data handled, or platform changes — in particular, if Phase 2 (remote recipe content updates) or Phase 3 (optional account + cloud backup, shared household lists) from `docs/product-plan.md` is picked up. Those introduce a real backend, network calls, and possibly auth — every "Not applicable" above tied to "no backend/no network/no accounts" would need to be replaced with real answers at that point.
-   This file was resolved against known, verified facts about the current architecture (see `docs/project/architecture.md`) rather than left as `[TBD]`, per the general rule that an unresolved bracket should stay visible until genuinely unknown — these answers were knowable now.
