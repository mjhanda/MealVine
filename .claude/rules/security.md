# Security Rules — MealApp

Generated per `security_bootstrap_instruction.md`, from `project directory/architecture.md`
and `project directory/security.md`. Read those two files for full detail; this
is the operative, Claude-Code-facing summary.

## Architecture context (why this isn't treated as a standard web/API app)

`architecture.md` establishes that MealApp is a fully offline, single-user
Expo (React Native + TypeScript) app: no backend, no API, no accounts, no
network calls of any kind. The default web/API security priorities (HTTP
boundary, auth/authz, CORS, session management) do not apply — they're
correctly marked "Not applicable" in `project directory/security.md`, not
unresolved. This repo is still early-stage in the sense that it's pre-release
and has no CI/linting configured yet, so the sections below follow the
early-stage template regardless.

## Required Security Inputs

These are the facts this file depends on. If any of these change, re-run the
bootstrap against the updated `architecture.md`:

- No backend, no network calls, no third-party SDKs — confirmed in `architecture.md`.
- No PII or sensitive data is collected or stored — confirmed in `project directory/security.md`.
- Persistence is AsyncStorage via Zustand `persist`, storing only app preferences (household size, diet, plan, favorites, grocery state) — see `src/store/`.
- No CI pipeline and no linter/formatter config exist yet in this repo.

## Provisional Security Rules

Apply these now, while the app is local-only:

1. **Never commit release-signing credentials.** When this app is first built for App Store/Play Store distribution, iOS/Android signing keys and any EAS/Expo account tokens must go through EAS's own credential storage or local gitignored files — never committed. `.gitignore` already excludes `*.jks`, `*.p8`, `*.p12`, `*.key`, `*.mobileprovision`; keep that intact.
2. **Don't silently swallow AsyncStorage failures.** Reads/writes to local storage should fail soft (app keeps working, doesn't crash) rather than throw uncaught — consistent with `General_Code_Quality_Prompts.md`'s "never swallow exceptions silently — handle or rethrow" rule; "handle" here means degrade gracefully, not ignore.
3. **Re-check PII exposure before adding any third-party SDK** (analytics, crash reporting, a future payment/subscription provider). These commonly collect device identifiers or usage data implicitly — `project directory/security.md`'s "No PII in scope" answer is only true as long as no such SDK is present.
4. **Before any Phase 2/3 work that adds a backend, auth, or remote content sync** (per `mealplan-app-project-plan.md`), stop and re-resolve `project directory/security.md` in full — its "Not applicable" answers for auth, API security, rate limiting, and data-in-transit all assume the current no-backend architecture and become real questions the moment that changes.
5. **Run `npm audit` before releases** as the current (manual) supply-chain check, since no automated scanner is configured — see `project directory/security.md`'s Dependency & Supply Chain section.

## Prompt placeholders to resolve

- `{{HANDACODE_CODE_QUALITY_PROMPT}}` → `General_Code_Quality_Prompts.md` (repo root). Stack is known (Expo/React Native/TypeScript), so this placeholder resolves directly to the local file rather than the original template path (`/Volumes/big2/Claude_bootstrap_template_files/General_Code_Quality_Prompts.md`, which doesn't exist on this machine).
- No other stack-specific prompt files exist for this project yet — none left as `UNKNOWN`, since the stack is fully decided (see `architecture.md`).
