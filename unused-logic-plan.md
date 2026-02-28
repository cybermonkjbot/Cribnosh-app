## Plan to Integrate Unused Logic and Lint Findings

This document describes how to turn **unused variables, functions, and related lint findings** into real, intentional logic instead of simply deleting them. The core rule is:

> **Every unused variable represents intended behavior; we will either wire it into the UI/logic or explicitly de-scope it with a clear reason.**

Scope of this plan:

- **Included apps**: `apps/mobile`, `apps/driver-app`, `apps/food-creator-app`
- **Current lint status**:
  - `apps/mobile`: `expo lint` reports many `@typescript-eslint/no-unused-vars` plus some import/path and React Hooks issues.
  - `apps/driver-app`: `expo lint` reports a smaller set of unused vars plus hooks and JSX issues.
  - `apps/food-creator-app`: `expo lint` reports a large set of unused vars plus parsing and hooks issues.
  - `apps/web`: `next lint` currently fails with an "Invalid project directory" error before producing per-file results; fixing that wiring is a separate pre-step.

We will implement changes **in phases**, starting with variables that clearly map to user-visible behavior (loading/error flags, modal toggles, key data from queries).

---

## Global principles

- **Prefer wiring over deletion**
  - Treat `isLoading*`, `error`, `user`, `foodCreator`, `activeSessions`, etc. as part of intentional UX:
    - Show skeletons/spinners when `isLoading*` is `true`.
    - Disable actions while `isUpdating*` or `isRequesting*` is `true`.
    - Render inline error banners/toasts when `error` is set.
  - Only delete variables if we **explicitly decide** that the behavior is not needed anymore and update this plan accordingly.

- **Consistent UX patterns**
  - Introduce/standardize shared primitives (where they don’t already exist):
    - `LoadingOverlay` / skeleton components.
    - `ErrorBanner` / toast hooks.
    - Common modal/sheet patterns for "payouts", "top up", "add card", etc.
  - Use those primitives when we wire unused flags, so behavior feels consistent across apps.

- **React Hooks discipline**
  - For any unused hook result (e.g. `const [state, setState] = useState(...)` where `state` is unused but `setState` is used), refactor to only declare what we actually need (or start using `state` intentionally).
  - For `useEffect`/`useCallback` dependency warnings:
    - If a variable is logically intended to influence behavior, **add it to dependencies and ensure it is used**.
    - If a variable is intentionally ignored (rare), wrap logic or value in `useRef` or a deliberate pattern and document the reason.

- **Data-fetch results and selectors**
  - For unused results from queries/selectors (e.g. `user`, `foodCreator`, `isAuthenticated`, `cartLoading`):
    - Use them to:
      - Gate access to screens.
      - Pre-fill form fields (profile, bank details, onboarding).
      - Display contextual info (names, avatars, badges).
    - If the feature is not ready yet, consider **guarded placeholders** (e.g. "Coming soon" UI that still references the data for future behavior).

- **Lint as guardrail**
  - Keep `@typescript-eslint/no-unused-vars` and `react-hooks/exhaustive-deps` **enabled** and strict.
  - Add **zero** `eslint-disable` lines for unused vars in new changes; reworking code is preferred.

---

## apps/mobile: intentional use of unused logic

### 1. Async UI states and backend errors

Representative lint findings:

- `apps/mobile/components/ui/MealItemDetails.tsx`
  - `isLoadingFavorite`, `isAddingFavorite`, `isRemovingFavorite`, multiple `error` variables unused.
- `apps/mobile/components/ui/MainScreen.tsx`
  - `offersLoading`, `offersError`, `cartError`, `cartLoading`, `weatherLoading`, `userBehaviorLoading`, `userBehaviorError`, `isUserScrolling` unused.
- `apps/mobile/components/ui/SpecialOffersSection.tsx`, `PopularMealsSection.tsx`, `FeaturedFoodCreatorsSection.tsx`, etc.
  - `backendError` unused in multiple list/section components.

**Intended behavior & plan**

- **Loading flags**
  - For each `isLoading*`/`is*Loading` flag:
    - Show **per-section skeletons** or `ActivityIndicator` components.
    - Disable related CTA buttons while loading (e.g. "Add to Cart", "Favorite", "Top Up").
    - In carousels/sections, show skeleton tiles instead of empty space.
  - Implementation outline:
    - Identify all `isLoading*` flags from queries/hooks in the component.
    - Introduce a `LoadingState` branch in render:
      - Early return skeleton layout; or
      - Inline conditional wrapper around content (`if (isLoading) return <Skeleton />;`).

- **Error variables**
  - For all `error` vars from hooks or API helpers:
    - Render a consistent `ErrorBanner` at the top of that section/screen.
    - Optionally add a "Retry" button that re-calls the relevant loader function.
  - Implementation outline:
    - Create shared `ErrorBanner` / `ErrorToast` component if not present.
    - In each component with unused `error`, render it when truthy and surface a human-readable message (network vs. validation vs. unknown).

- **Backend/domain errors (e.g. `backendError`)**
  - Use them to:
    - Show "We couldn’t load <X>" messages.
    - Optionally log to a central logger/analytics hook for observability.

### 2. Authentication & identity context

Representative findings:

- `PopularMealsSection.tsx`, `SpecialOffersSection.tsx`, `TakeAways.tsx`, etc.:
  - `user`, `isAuthenticated` unused.
- `AddFamilyMemberSheet.tsx`, `FamilyOrdersSheet.tsx`, etc.:
  - `isAuthenticated`, family-related data unused.

**Intended behavior & plan**

- Use `user`/`isAuthenticated` to:
  - Gate **premium/personalized** content (e.g. show offers only for logged-in users).
  - Customize copy ("Hi, {user.firstName}") on sections and headers.
  - Guard CTA flows that require authentication (e.g. "Order again", "Invite family", "Top up balance").
- Implementation outline:
  - For each component with unused `user`/`isAuthenticated`:
    - Decide whether:
      - Content should be **hidden**, replaced with a sign-in prompt, or show a generic fallback.
    - Wire conditionals accordingly, e.g.:
      - `if (!isAuthenticated) return <SignInPrompt />;`
      - or show limited functionality with a lock icon / tooltips.

### 3. Animation and visual detail flags

Representative findings:

- `AnimatedSplashScreen.tsx`: `useEffect` dependencies left unused.
- `NoshHeavenModal.tsx`, `GachaMealSpinner.tsx`, `CalorieCompareCard.tsx`, etc.:
  - Animation refs/values declared but not reflected in UI states or dependencies.

**Intended behavior & plan**

- Treat animation flags and refs as **real UX polish**, not dead code:
  - Use them to:
    - Drive entrance animations (scale/opacity/translate).
    - Show progress bars and interactive transitions, tied to real data.
  - Implementation outline:
    - For each component:
      - Map animation values to actual `Animated.View`/reanimated styles (opacity, transform).
      - Ensure effects depend on the values they are meant to react to (fix `exhaustive-deps` while still using those values).

### 4. Miscellaneous unused helpers and refs

Examples:

- `AIChatDrawer.tsx`: `specialInstructions` unused.
- `CountryCodePicker.tsx`: `insets` unused.
- `CartButton.tsx`: `withTiming` imported but unused.

**Plan**

- Evaluate each helper:
  - If it clearly maps to a UX idea (e.g. using `specialInstructions` to pre-fill AI prompts), plan to expose it in the UI.
  - If truly obsolete (feature abandoned), remove variable and any associated dead logic and document that in PR description.

---

## apps/driver-app: wiring operational states into UI

### 1. Active order management and driver state

Representative findings (`app/active-order.tsx`):

- `isLoadingOrder`, `isUpdatingStatus`, `isNavigating` unused.
- Assignment `assignment` unused.
- `locationService` and `updateDriverLocation` missing from `useEffect` dependencies.

**Intended behavior & plan**

- **Loading/Updating flags**
  - Use `isLoadingOrder` to:
    - Show a loader while fetching active order details.
    - Disable accept/reject/complete actions until data is available.
  - Use `isUpdatingStatus` to:
    - Disable status-changing buttons while a mutation is in-flight.
    - Show subtle "Updating…" state in the bottom sheet or header.
- **Navigation flag `isNavigating`**
  - Use to:
    - Disable repeated "Start navigation" taps.
    - Show a small "Opening maps…" indicator.
- **Location services**
  - Include `locationService` and `updateDriverLocation` in `useEffect` dependencies and:
    - Use them to keep the driver position updated and reflected in the map/pill UI.

### 2. Earnings, withdrawals, and payouts

Representative findings:

- `app/earnings.tsx`: `showPayoutModal`, `setShowPayoutModal`, `isLoadingEarnings`, `isRequestingPayout` unused.
- `app/withdrawals.tsx`: `isRequestingPayout` unused.

**Intended behavior & plan**

- **Payout modal flags**
  - Wire `showPayoutModal` + `setShowPayoutModal` to:
    - Control visibility of a payout bottom sheet / modal.
    - Tie CTA buttons ("Request payout") to toggling this state.
- **Earnings loading & payout in-flight states**
  - Use `isLoadingEarnings` to show an earnings skeleton/spinner.
  - Use `isRequestingPayout` to:
    - Disable the payout button after tap.
    - Render inline "Processing payout…" message.

### 3. Profile, bank details, vehicle, and KYC

Representative findings:

- `bank-details.tsx`: `isUpdating` unused.
- `privacy.tsx`: `isUpdating`, `Id` unused.
- `vehicle.tsx`: `ActivityIndicator` import, `isUpdating`, and `fuelTypesToShow` unused.
- `profile/edit.tsx`: `ImagePicker` unused, `isUpdating` unused, `WebView` undefined.

**Intended behavior & plan**

- Use `isUpdating` flags across profile/bank/vehicle screens to:
  - Disable submit buttons during API calls.
  - Show an `ActivityIndicator` in place of button text while saving.
- For `fuelTypesToShow`, `Id`, and other domain vars:
  - Use them to:
    - Populate dropdowns/selects.
    - Pre-fill forms based on existing driver data.
- Fix `WebView` reference:
  - Ensure `WebView` is imported from `react-native-webview` and used where intended (KYC or document viewer), or refactor that UI away.

### 4. Authentication & notifications

Representative findings:

- `login.tsx`: `verifyDriverOTP`, `handleForgotPassword` unused.
- `otp-auth.tsx`: multiple unused OTP helpers and state flags.
- `notifications.tsx`: `driver`, `user` unused.

**Intended behavior & plan**

- **OTP and password recovery**
  - Wire `verifyDriverOTP` into the OTP submit handler.
  - Wire `handleForgotPassword` into the "Forgot password" button/link.
  - Use unused flags (`isVerifyingPhone`, `isSendingOTP`) for:
    - Button disabling.
    - Showing spinners around OTP actions.
- **Notifications**
  - Use `driver`/`user` context to:
    - Filter notifications per driver.
    - Display personalized messaging and targeted announcements.

---

## apps/food-creator-app: onboarding, live, and creator tools

### 1. Live streaming and dashboard state

Representative findings:

- `components/ui/LiveStreamDashboard.tsx`:
  - Parse error at line 44; multiple unused flags like `LiveStreamSetupOverlay`, `closeCameraModal`, `closePhotoPreview`, etc. (from overall lint output).
- `app/(tabs)/food-creator/live/[sessionId].tsx` and `live/index.tsx`:
  - `width`, `height`, `foodCreator`, `activeSessions`, `streamError` unused.

**Intended behavior & plan**

- **Dashboard & overlays**
  - Fix parse error first so that all diagnostics are reliable.
  - Use overlay-related vars (`LiveStreamSetupOverlay`, etc.) to:
    - Show onboarding/tooltips before going live.
    - Present confirmation modals when starting/stopping streams.
- **Stream layout**
  - Use `width`/`height` to:
    - Adapt layout for different devices (responsive canvas).
    - Calculate video preview sizes and positioning.
- **Creator context and `streamError`**
  - Use `foodCreator` to:
    - Display avatar, name, and channel branding on live screens.
  - Use `streamError` to:
    - Show retry prompts or diagnostics when stream setup fails.

### 2. Courses, modules, quizzes, and onboarding

Representative findings:

- `onboarding/course/[id].tsx`: hook calls conditionally; `useEffect` with missing deps like `enrollInCourse`, `syncModules`.
- `onboarding/course/[id]/module/[moduleId].tsx`: `moduleName` unused; complex refs for video timeouts.
- `onboarding/course/[id]/module/[moduleId]/quiz.tsx`: `timeRemaining`, `allAnswered`, `currentQuestionAnswered`, `isFirstQuestion` unused.

**Intended behavior & plan**

- **Course enrollment & progress**
  - Use `moduleName` and other identifiers to:
    - Display meaningful titles in headers and breadcrumbs.
    - Track analytics (e.g. which module is being accessed).
- **Quiz state variables**
  - Use `timeRemaining` to:
    - Show countdown timers and disable submissions when time expires.
  - Use `allAnswered`, `currentQuestionAnswered`, `isFirstQuestion` to:
    - Enable/disable navigation buttons ("Next", "Previous", "Submit").
    - Display progress indicators (e.g. "Question 3 of 10").

### 3. Earnings, orders, and support

Representative findings:

- `app/(tabs)/earnings/index.tsx`: `averageLineProgress`, `barsProgress` missing from dependencies.
- `app/(tabs)/orders/[id].tsx`: `STATUS_OPTIONS` unused.
- `app/(tabs)/orders/index.tsx` parsing error.
- `app/(tabs)/food-creator/support/index.tsx`: `foodCreator`, `router` unused; dependency warnings.

**Intended behavior & plan**

- **Earnings visuals**
  - Use `averageLineProgress` and `barsProgress` to:
    - Animate bar charts and comparison lines.
    - Provide intuitive visual feedback on earning trends.
- **Order statuses**
  - Use `STATUS_OPTIONS` to:
    - Drive status dropdowns/filters in order details UI.
    - Enforce allowed state transitions in UI only (matching backend rules).
- **Support context**
  - Use `foodCreator` to:
    - Pre-fill identity in support forms and show personalized help.
  - Use `router` to:
    - Navigate to detailed support cases or FAQ entries from summary lists.

### 4. Shared UI components and sheets

Representative findings:

- `CreateMealModal.tsx`: unused quotes in copy; likely unused state around advanced fields.
- `EditMealModal.tsx`: `ALLERGEN_OPTIONS`, `foodCreator`, `handleAddIngredient`, `handleRemoveIngredient` unused.
- `DietaryPreferencesSheet.tsx`, `ManageAllergiesSheet.tsx`, `NoshPassModal.tsx`, `TopUpBalanceSheet.tsx` and others:
  - Multiple `error`, `isLoading`, `displayAmount`, `showToast` unused.

**Intended behavior & plan**

- **Meal creation & editing**
  - Use `ALLERGEN_OPTIONS` to:
    - Render a multi-select list for allergens.
  - Use `handleAddIngredient`/`handleRemoveIngredient`:
    - Wire to plus/minus icon buttons that manipulate ingredient arrays.
  - Use `foodCreator`:
    - To pre-fill creator-specific defaults (e.g. kitchen name, cuisine tags).
- **Financial and preference sheets**
  - Use `displayAmount` in top-up and payout UIs to:
    - Show formatted currency values.
  - Use `error` and `showToast`:
    - Provide immediate feedback on failed requests (top-up failed, saving preferences failed).

---

## apps/web: lint wiring and unused logic strategy

- `npm run lint` in `apps/web` currently fails before reporting per-file issues:
  - **Invalid project directory provided, no such directory: `apps/web/lint`**
  - This comes from Next.js ESLint configuration pointing at a non-existent directory; the fix is configuration-only, not functional logic.

**Pre-step: fix Next lint configuration**

- Inspect Next’s lint configuration (via `next.config.*` or `.eslintrc.*`) to:
  - Remove or correct any `dir` / `dirs` entry that includes `lint`.
  - Ensure it targets real source roots, e.g.:
    - `app`, `pages`, `components`, `lib`, `convex`, `tests`, etc.
- After adjusting config, re-run `npm run lint` in `apps/web` to obtain:
  - Unused import/variable warnings.
  - React hooks and other structural issues (similar to the mobile and Convex-heavy code).

**Strategy for using web’s unused logic**

While we don’t yet have the exact unused-variable list from `next lint`, we will apply the same guiding principles used for the mobile/native apps:

- **Loading and error states**
  - For any unused `isLoading*` / `error` variables in React server/client components:
    - Drive skeleton UIs, disabled buttons, and error banners or toast notifications.
    - Tie them to Convex queries/mutations or third-party SDK calls (Stripe, S3, Basehub, etc.).

- **Auth and identity**
  - Unused `user`, `session`, `isAuthenticated`, or role flags will:
    - Gate access to admin/creator dashboards and settings pages.
    - Personalize copy and navigation (e.g. “Welcome back, {user.name}”).

- **Convex and backend integration**
  - For unused Convex query/mutation results:
    - Surface related data in dashboards, lists, and tables (e.g. earnings, orders, content stats).
    - Use them to drive computed metrics, summaries, and filters, rather than leaving them unused.

- **Form and UI helpers**
  - Unused Zod schemas, DTOs, or helper functions will be:
    - Wired into form validation and API handlers for the matching routes.
    - Or explicitly removed if the corresponding feature has been superseded.

**Planned implementation phases for web**

- **Phase W1 – Fix lint config and capture signal**
  - Correct Next’s lint directory configuration to stop pointing at `lint/`.
  - Run `npm run lint` and group unused-variable warnings by feature area (marketing site, admin, dashboard, auth, etc.).

- **Phase W2 – High-impact dashboards and admin**
  - Prioritize unused logic in:
    - Admin/ops dashboards (where unused metrics and flags most clearly signal missing UX).
    - Auth/session-aware pages that should use `user` or role information.

- **Phase W3 – Marketing, blog, and integrations**
  - Use unused variables/hooks around:
    - Blog / marketing sections (e.g. unused analytics or A/B test flags).
    - Third-party integrations (Stripe, S3, email, logging) to improve observability and UX.

- **Phase W4 – Cleanup and consolidation**
  - After wiring high-value unused logic:
    - Remove remaining truly obsolete variables and helpers with clear justification in PR notes.
    - Keep ESLint strict so new unused logic can be treated as an intentional signal for future UX work.

---

## Implementation phases

### Phase 1 – High-signal driver and earnings flows

- **Driver app**
  - `active-order.tsx`: wire all loading/updating/navigation flags into UI and effects.
  - `earnings.tsx` + `withdrawals.tsx`: integrate `isLoadingEarnings`, `isRequestingPayout`, and payout modal flags.
  - `login.tsx` + `otp-auth.tsx`: wire `verifyDriverOTP`, `handleForgotPassword`, and OTP-related loading flags.

### Phase 2 – Mobile home and core ordering flows

- **Mobile app**
  - `MainScreen.tsx`, `MealItemDetails.tsx`, `CartScreen.tsx`, `BottomSearchDrawer.tsx`:
    - Use all loading/error flags to drive skeletons, disabled actions, and error banners.
  - Auth-sensitive sections (`PopularMealsSection`, `SpecialOffersSection`, etc.):
    - Use `user`/`isAuthenticated` for gating and personalization.

### Phase 3 – Food creator onboarding, live, and courses

- **Food-creator app**
  - Fix all parsing errors (`LiveStreamDashboard.tsx`, onboarding screens) so lint signal is reliable.
  - Wire unused state in live streaming and onboarding flows as described.
  - Implement quiz timers and progression logic using existing unused quiz vars.

### Phase 4 – Cleanup, consolidation, and web app

- Consolidate repeated patterns (loading/error banners, skeletons, toasts) into shared components/hooks.
- Fix `apps/web` lint misconfiguration and create a similar mapping plan for any unused logic it surfaces.

At the end of these phases, **all currently lint-reported unused variables that represent real behavior will either be wired into UX/logic or explicitly removed as deprecated with clear justification.**

