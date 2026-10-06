Project Architecture
====================

> Defines the project's technical stack, including the backend framework, client-side framework, API style, and data model. Provides foundational context for all development activities.

System Overview
---------------

-   **Purpose:** MealVine — a free-form meal planner. Users pick recipes from a curated catalog (filtered by their diet, allergies, and disliked ingredients) into a plan list — not a calendar — and the app derives an aisle-sorted grocery list from it. Meals are cooked whenever the user likes and marked as cooked.
-   **Target Users:** Individuals or households planning their own weekly meals and groceries. Single-user per install — no shared/multi-user accounts.

Technology Stack
----------------

-   **Backend:** None. Fully local/offline — no server, no API calls of any kind.
-   **Frontend:** Expo (React Native) + TypeScript, one codebase for web, iOS, and Android. React Navigation (native-stack + bottom tabs) for routing. Zustand (`persist` middleware) for state, backed by `@react-native-async-storage/async-storage`.
-   **API Style:** N/A — no client-server API. All data (recipes, preferences, plan, favorites, grocery list) lives on-device.
-   **Data Model:** Recipe catalog and canonical ingredient catalog bundled as TypeScript data (`src/data/recipes.ts`, `src/data/ingredients.ts`). User data (preferences incl. diet/allergies/dislikes, plan, cooking history, favorites, grocery check-state) persisted as JSON in AsyncStorage via independent, versioned Zustand stores. See `src/types.ts` for the full shape.

Infrastructure & Deployment
---------------------------

-   **Deployment Model:** Client-only mobile/web app distributed via Expo (EAS Build for native binaries → App Store / Play Store; static web export for browser). No servers to deploy or scale.
-   **Session Management:** N/A — no accounts, no auth, no sessions. State is scoped to the device's local storage only.

Notes for future phases (not built yet)
----------------------------------------
The original project plan's Phase 2/3 (remote recipe content updates, optional account + cloud backup, shared household lists) would reintroduce a real backend, auth, and API surface. If any of those are picked up, this file and `docs/project/security.md` need a real update before that work starts — the current "N/A" answers above are only true for the local-only MVP.
