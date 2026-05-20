# Tasks: Authenticated Application Shell

**Input**: Design documents from `/specs/003-authenticated-app-shell/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are mandatory. Every user story includes automated test tasks that must fail before implementation and pass before merge.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish web test/tooling baseline required for story-level automated validation.

- [ ] T001 Add web test scripts and test dependencies in packages/web/package.json
- [ ] T002 Create Vitest configuration for React/browser tests in packages/web/vitest.config.ts
- [ ] T003 Create testing library setup entrypoint in packages/web/src/test/setup.ts
- [ ] T004 Create shared render helpers with router/auth wrappers in packages/web/src/test/renderWithProviders.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build shell primitives and route/auth guard foundations that all stories depend on.

**CRITICAL**: No user story work starts until this phase is complete.

- [ ] T005 Create shell route option model and default route constants in packages/web/src/routes/shellOptions.ts
- [ ] T006 Create base shell layout with header, left-nav container, and outlet region in packages/web/src/components/shell/AppShellLayout.tsx
- [ ] T007 Add nested protected shell route tree (`/`, `/login`, `/app`) in packages/web/src/App.tsx
- [ ] T008 Add reusable session-shape validator utilities for shell identity requirements in packages/web/src/auth/sessionGuards.ts
- [ ] T009 Enforce protected-route redirects for missing token or missing email in packages/web/src/auth/ProtectedRoute.tsx
- [ ] T010 Add contract fixture for shell route expectations in packages/web/src/test/fixtures/shellRouteContract.ts

**Checkpoint**: Foundation complete. User stories can proceed.

---

## Phase 3: User Story 1 - Access the authenticated shell (Priority: P1) 🎯 MVP

**Goal**: Deliver authenticated default landing shell with fixed top banner/system name and header email identity display.

**Independent Test**: Successful login lands on fixed default route and renders fixed shell header; unauthenticated or missing-email sessions redirect to login.

### Tests for User Story 1 (MANDATORY)

- [ ] T011 [US1] Add protected-route redirect tests (unauthenticated + missing email) in packages/web/src/__tests__/auth-guard.us1.test.tsx
- [ ] T012 [US1] Add shell header rendering test (system name + user email) in packages/web/src/__tests__/shell-header.us1.test.tsx
- [ ] T013 [US1] Add fixed post-login default route test in packages/web/src/__tests__/default-route.us1.test.tsx

### Implementation for User Story 1

- [ ] T014 [US1] Implement fixed top banner and system-name region in packages/web/src/components/shell/AppShellLayout.tsx
- [ ] T015 [US1] Implement header user-email rendering with required identity checks in packages/web/src/components/shell/AppShellLayout.tsx
- [ ] T016 [US1] Normalize login success navigation to configured shell default route in packages/web/src/pages/LoginPage.tsx
- [ ] T017 [US1] Align route-guard behavior with session utilities in packages/web/src/auth/ProtectedRoute.tsx
- [ ] T018 [US1] Add shell route contract assertions for `/app` default behavior in packages/web/src/__tests__/shell-route-contract.us1.test.tsx

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Navigate through menu options (Priority: P2)

**Goal**: Deliver expandable/collapsible left menu with route-based option selection and auto-collapse after selection.

**Independent Test**: User can expand menu, choose option, URL/content update, and menu auto-collapses while preserving active route content.

### Tests for User Story 2 (MANDATORY)

- [ ] T019 [US2] Add menu default-collapsed and expand interaction tests in packages/web/src/__tests__/menu-toggle.us2.test.tsx
- [ ] T020 [US2] Add menu selection route-transition and auto-collapse tests in packages/web/src/__tests__/menu-selection.us2.test.tsx
- [ ] T021 [US2] Add deep-link route render tests for menu option routes in packages/web/src/__tests__/deep-link-routing.us2.test.tsx

### Implementation for User Story 2

- [ ] T022 [US2] Implement left navigation menu interactions and option list rendering in packages/web/src/components/shell/ShellNavigation.tsx
- [ ] T023 [US2] Integrate route-driven menu state and outlet content switching in packages/web/src/components/shell/AppShellLayout.tsx
- [ ] T024 [US2] Add unavailable-option fallback content view in packages/web/src/pages/OptionUnavailablePage.tsx
- [ ] T025 [US2] Register menu option routes and route metadata in packages/web/src/routes/shellOptions.ts
- [ ] T026 [US2] Add route contract assertions for `/`, `/login`, and `/app` behavior in packages/web/src/__tests__/shell-route-contract.us2.test.tsx

**Checkpoint**: User Stories 1 and 2 work independently.

---

## Phase 5: User Story 3 - Sign out from user identity control (Priority: P3)

**Goal**: Deliver inline two-step logout confirmation from header identity control with confirm/cancel behavior.

**Independent Test**: First click shows inline confirmation only; confirm logs out and redirects; cancel preserves active session and route.

### Tests for User Story 3 (MANDATORY)

- [ ] T027 [US3] Add first-click inline confirmation visibility test in packages/web/src/__tests__/logout-confirm.us3.test.tsx
- [ ] T028 [US3] Add confirm-logout session-clear and redirect test in packages/web/src/__tests__/logout-confirm.us3.test.tsx
- [ ] T029 [US3] Add cancel-logout state-preservation test in packages/web/src/__tests__/logout-confirm.us3.test.tsx

### Implementation for User Story 3

- [ ] T030 [US3] Implement inline two-step header identity action component in packages/web/src/components/shell/HeaderIdentityAction.tsx
- [ ] T031 [US3] Wire confirm/cancel logout flow to auth session state in packages/web/src/components/shell/AppShellLayout.tsx
- [ ] T032 [US3] Ensure logout confirmation state resets correctly on route/session changes in packages/web/src/components/shell/useHeaderIdentityAction.ts
- [ ] T033 [US3] Add logout interaction contract assertions in packages/web/src/__tests__/shell-route-contract.us3.test.tsx

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening and documentation updates spanning all stories.

- [ ] T034 Document final shell behavior verification matrix in specs/003-authenticated-app-shell/quickstart.md
- [ ] T035 Sync finalized shell contract details and examples in specs/003-authenticated-app-shell/contracts/app-shell-routes.yaml
- [ ] T036 Add implementation notes for future menu-option expansion in specs/003-authenticated-app-shell/research.md
- [ ] T037 Record final validation outcomes (lint/build/test + story checks) in specs/003-authenticated-app-shell/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 (Setup): starts immediately.
- Phase 2 (Foundational): depends on Phase 1 and blocks all story work.
- Phase 3 (US1): depends on Phase 2 and defines MVP.
- Phase 4 (US2): depends on Phase 2 and integrates with shell from US1.
- Phase 5 (US3): depends on Phase 2 and header identity surface from US1.
- Phase 6 (Polish): depends on all selected stories being complete.

### User Story Dependencies

- US1 (P1): no dependency on other stories after Foundational.
- US2 (P2): depends on Foundational and uses shell surfaces introduced in US1.
- US3 (P3): depends on Foundational and uses header identity surfaces introduced in US1.

### Within Each User Story

- Tests first and initially failing.
- UI/state primitives before route wiring.
- Route wiring before contract assertions/documentation updates.

### Execution Notes

- Execute tasks sequentially in listed order.
- Complete each story's tests before implementation tasks in that story.

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1 and Phase 2.
2. Deliver Phase 3 (US1).
3. Validate login landing, fixed header, and route protection behavior.
4. Demo/deploy MVP before adding additional stories.

### Incremental Delivery

1. Foundation complete (Phases 1-2).
2. Add US1 (MVP), validate independently.
3. Add US2, validate independently.
4. Add US3, validate independently.
5. Complete Phase 6 polish and final validation evidence.

### Parallel Team Strategy

1. Pair on setup/foundation.
2. After Phase 2:
   - Developer A: US1
   - Developer B: US2
   - Developer C: US3
3. Merge by story checkpoints with contract and quickstart updates.
