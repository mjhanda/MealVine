# Security Rules — MealVine

Generated per `docs/project/security_bootstrap_instruction.md`, from `docs/project/architecture.md`
and `docs/project/security.md`. Read those two files for full detail; this
is the operative, Claude-Code-facing summary.

## Architecture context (why this isn't treated as a standard web/API app)

`architecture.md` establishes that MealVine is a fully offline, single-user
Expo (React Native + TypeScript) app: no backend, no API, no accounts, no
network calls of any kind. The default web/API security priorities (HTTP
boundary, auth/authz, CORS, session management) do not apply — they're
correctly marked "Not applicable" in `docs/project/security.md`, not
unresolved. This repo is still early-stage in the sense that it's pre-release
and has no CI/linting configured yet, so the sections below follow the
early-stage template regardless.

## Required Security Inputs

These are the facts this file depends on. If any of these change, re-run the
bootstrap against the updated `architecture.md`:

- No backend of our own. **One third-party SDK with network access: RevenueCat** (`react-native-purchases`), used only for subscription status/purchases; it receives an anonymous app user ID and store purchase data, never meal data or preferences. All RevenueCat calls go through `src/services/purchases.ts`.
- No account, no identity, no network. The one health-adjacent field stored is the user's **allergy list** (`Preferences.allergies`, since prefs v2) — on-device only, never logged, never transmitted. See `docs/project/security.md`.
- Persistence is AsyncStorage via Zustand `persist`: preferences (household size, diet, allergies, disliked ingredients, meal types), plan, cooking history, favorites, grocery state — see `src/store/`.
- ESLint (`eslint-config-expo`) and jest are configured; the GitHub Actions workflow runs typecheck, lint, and tests on every push/PR.

## Provisional Security Rules

Apply these now, while the app is local-only:

1. **Never commit release-signing credentials.** When this app is first built for App Store/Play Store distribution, iOS/Android signing keys and any EAS/Expo account tokens must go through EAS's own credential storage or local gitignored files — never committed. `.gitignore` already excludes `*.jks`, `*.p8`, `*.p12`, `*.key`, `*.mobileprovision`; keep that intact.
2. **Don't silently swallow AsyncStorage failures.** Reads/writes to local storage should fail soft (app keeps working, doesn't crash) rather than throw uncaught — consistent with `General_Code_Quality_Prompts.md`'s "never swallow exceptions silently — handle or rethrow" rule; "handle" here means degrade gracefully, not ignore.
3. **Re-check PII exposure before adding any third-party SDK** (analytics, crash reporting, a future payment/subscription provider). These commonly collect device identifiers or usage data implicitly — `docs/project/security.md`'s "PII in scope" answer is only true as long as no such SDK is present.
4. **Before any Phase 2/3 work that adds a backend, auth, or remote content sync** (see `docs/product-plan.md`), stop and re-resolve `docs/project/security.md` in full — its "Not applicable" answers for auth, API security, rate limiting, and data-in-transit all assume the current no-backend architecture and become real questions the moment that changes.
5. **Never send app data to RevenueCat.** No `setAttributes`, `logIn` with identifying IDs, or custom attributes carrying preferences/allergies. Public SDK keys only (`appl_`/`goog_`) via `EXPO_PUBLIC_RC_*` env vars; the RevenueCat secret key never enters this repo or the app.
6. **Treat allergy data as sensitive.** Never `console.log` preferences, never include them in crash reports or analytics if those SDKs are ever added, and any export/share of them (T24) must ask the user first.
7. **Allergen tagging is a safety surface.** `src/data/ingredients.ts` tags are deliberately conservative; never remove an allergen tag to make a recipe show up — fix the recipe or the ingredient choice instead. The in-app disclaimer (`ALLERGY_DISCLAIMER`) must stay visible wherever allergies are set.
8. **Run `npm audit` before releases** as the current (manual) supply-chain check, since no automated scanner is configured — see `docs/project/security.md`'s Dependency & Supply Chain section.

## Prompt placeholders to resolve

- `{{HANDACODE_CODE_QUALITY_PROMPT}}` → `General_Code_Quality_Prompts.md` (repo root). Stack is known (Expo/React Native/TypeScript), so this placeholder resolves directly to the local file rather than the original template path (`/Volumes/big2/Claude_bootstrap_template_files/General_Code_Quality_Prompts.md`, which doesn't exist on this machine).
- No other stack-specific prompt files exist for this project yet — none left as `UNKNOWN`, since the stack is fully decided (see `architecture.md`).
