Project Architecture
====================

> Defines the project's technical stack, including the backend framework, client-side framework, API style, and data model. Provides foundational context for all development activities.

System Overview
---------------

-   **Purpose:** MealApp — a Mealime-style weekly meal planner. Generates a 7-day meal plan from a curated recipe set based on the user's household size, diet, and selected meal types, and derives a grocery list from that plan.
-   **Target Users:** Individuals or households planning their own weekly meals and groceries. Single-user per install — no shared/multi-user accounts.

Technology Stack
----------------

-   **Backend:** None. Fully local/offline — no server, no API calls of any kind.
-   **Frontend:** Expo (React Native) + TypeScript, one codebase for web, iOS, and Android. React Navigation (native-stack + bottom tabs) for routing. Zustand (`persist` middleware) for state, backed by `@react-native-async-storage/async-storage`.
-   **API Style:** N/A — no client-server API. All data (recipes, preferences, plan, favorites, grocery list) lives on-device.
-   **Data Model:** Recipe catalog bundled as a TypeScript array (`src/data/recipes.ts`); user-generated data (preferences, active plan, favorites, grocery check-state) persisted as JSON in AsyncStorage via four independent Zustand stores. See `src/types.ts` for the full shape.

Infrastructure & Deployment
---------------------------

-   **Deployment Model:** Client-only mobile/web app distributed via Expo (EAS Build for native binaries → App Store / Play Store; static web export for browser). No servers to deploy or scale.
-   **Session Management:** N/A — no accounts, no auth, no sessions. State is scoped to the device's local storage only.

Notes for future phases (not built yet)
----------------------------------------
The original project plan's Phase 2/3 (remote recipe content updates, optional account + cloud backup, shared household lists) would reintroduce a real backend, auth, and API surface. If any of those are picked up, this file and `project directory/security.md` need a real update before that work starts — the current "N/A" answers above are only true for the local-only MVP.
