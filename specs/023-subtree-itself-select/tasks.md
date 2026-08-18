# Tasks: Hierarchy Subtree and Itself Selection

**Input**: Design documents from `/specs/023-subtree-itself-select/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Mandatory. Spec requires automated coverage under `tests/023-subtree-itself-select/` plus package tests in `packages/backend/tests/023-subtree-itself-select/` and `packages/web/tests/023-subtree-itself-select/`.

**Organization**: Tasks grouped by user story. API per `contracts/hierarchy-selection-scope-api.yaml`; shared picker + three leader consumers; i18n + `frontend-design` for picker UX. No schema migration.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete work)
- **[Story]**: US1–US3 maps to spec user stories
- Include exact file paths in every task

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Feature scaffolds, i18n placeholders, and shared test folders.

- [x] T001 Create feature test doc stubs under `tests/023-subtree-itself-select/` (`subtree-select.us1.test.md`, `itself-option.us2.test.md`, `scope-feedback.us3.test.md`) aligned with spec US1–US3
- [x] T002 [P] Create backend test directory scaffold in `packages/backend/tests/023-subtree-itself-select/`
- [x] T003 [P] Create web test directory scaffold in `packages/web/tests/023-subtree-itself-select/`
- [x] T004 [P] Add placeholder `picker.itself`, `picker.scopeSubtree`, `picker.scopeItself`, and related hint keys to `packages/web/src/locales/en-US/leader.json` and `packages/web/src/locales/pt-BR/leader.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared scope types + DAC-safe owner-ID resolver used by all stories and endpoints. No schema migration.

**⚠️ CRITICAL**: No user-story endpoint or picker wiring that depends on subtree/Itself expansion starts until this phase is complete.

- [x] T005 Add `HierarchyScope` (`subtree` | `itself`) and related filter/DTO types in `packages/backend/src/types/hierarchySelectionScope.ts` per `specs/023-subtree-itself-select/data-model.md` and `contracts/hierarchy-selection-scope-api.yaml`
- [x] T006 Implement `resolveScopedOwnerUserIds(actorUserId, userId?, scope?)` in `packages/backend/src/services/userService.ts` (or thin helper module imported by services): no `userId` → actor descendants; `itself` → `[userId]`; `subtree`/default → `userId` + recursive descendants; validate/ignore `scope` when `userId` omitted; reject invalid `scope` values
- [x] T007 [P] Add unit/integration tests for resolver defaults, leaf equivalence, deep subtree inclusion, and intersection with actor tree in `packages/backend/tests/023-subtree-itself-select/resolve-scoped-owner-user-ids.test.ts`
- [x] T008 [P] Add DAC tests that out-of-subtree `userId` never expands and peer/superior cases remain denied in `packages/backend/tests/023-subtree-itself-select/scope-dac.test.ts`

**Checkpoint**: Shared resolver returns correct `ownerUserIds` for cleared / Itself / subtree cases with DAC coverage.

---

## Phase 3: User Story 1 - Select a person to include their full team subtree (Priority: P1) 🎯 MVP

**Goal**: Selecting a person with reports scopes Team Deliverables, Team Analytics, and Team PR Performance to that person **plus all descendants**; leaves stay person-only; behavior consistent across the three screens.

**Independent Test**: With Alice→Bob, Carol→Dave, selecting Alice (subtree) includes all four people in each screen’s data; selecting leaf Eve includes only Eve; foreign `userId` returns 403.

### Tests for User Story 1 (MANDATORY)

- [x] T009 [P] [US1] Add backend tests that `scope=subtree` (and omitted `scope` default) expands owner sets on analytics and PR performance in `packages/backend/tests/023-subtree-itself-select/subtree-select.us1.test.ts`
- [x] T010 [P] [US1] Add backend tests that Team Deliverables returns combined rows for subtree owners (multi-owner `In(...)`) in `packages/backend/tests/023-subtree-itself-select/team-deliverables-subtree.us1.test.ts`
- [x] T011 [P] [US1] Add web tests that picker person-row selection sends `userId` + subtree scope and pages refetch accordingly in `packages/web/tests/023-subtree-itself-select/subtree-select.us1.test.tsx`
- [x] T012 [P] [US1] Add i18n key-parity smoke for new picker/subtree strings in `packages/web/tests/023-subtree-itself-select/i18n-parity.us1.test.ts`

### Implementation for User Story 1

- [x] T013 [US1] Wire `resolveScopedOwnerUserIds` into `packages/backend/src/services/leaderAnalyticsService.ts` `resolveOwnerUserIds` so optional `userId` + default/subtree expands beyond a singleton
- [x] T014 [US1] Wire `resolveScopedOwnerUserIds` into `packages/backend/src/services/leaderPrPerformanceService.ts` `resolveOwnerUserIds` with the same subtree default semantics
- [x] T015 [US1] Extend `listTeamDeliverablesForReview` in `packages/backend/src/services/deliverableService.ts` to accept multiple owner IDs (`In(ownerUserIds)`), preserve date range + per-leader reviewed flags, and include `ownerUserId` / `ownerDisplayName` on rows when the owner set size is greater than 1
- [x] T016 [US1] Accept optional `scope` query param on `GET /users/leader/team-deliverables`, `GET /users/leader/team-analytics`, and `GET /users/leader/team-pr-performance` in `packages/backend/src/routes/users.ts` (assert subtree membership when `userId` present; default `scope=subtree`; echo `scope` on deliverables response per contract)
- [x] T017 [US1] Update API clients `packages/web/src/services/teamDeliverablesApi.ts`, `packages/web/src/services/leaderAnalyticsApi.ts`, and `packages/web/src/services/leaderPrPerformanceApi.ts` to pass `scope` with `userId`
- [x] T018 [US1] Extend `TeamMemberHierarchyPicker` in `packages/web/src/components/team-deliverables/TeamMemberHierarchyPicker.tsx` using `frontend-design` + Material UI so selecting a person with children emits `{ userId, scope: 'subtree' }` (leaf → single-person scope); keep expand/collapse hierarchy browsing
- [x] T019 [US1] Wire subtree selection state through `packages/web/src/pages/LeaderTeamDeliverablesPage.tsx`, `packages/web/src/pages/LeaderTeamAnalyticsPage.tsx`, `packages/web/src/pages/LeaderTeamPrPerformancePage.tsx`, and `packages/web/src/components/leader-pr-performance/TeamPrPerformanceFilters.tsx` so fetches include `scope` and Team Deliverables shows owner attribution when multi-person
- [x] T020 [US1] Finalize subtree-related copy in `packages/web/src/locales/{en-US,pt-BR}/leader.json` (hints, owner column labels as needed)

**Checkpoint**: MVP — selecting a manager includes their full subtree on all three leader team screens.

---

## Phase 4: User Story 2 - "Itself" option for person-only scope (Priority: P1)

**Goal**: People with reports expose an **"Itself"** choice that scopes data to that person only; switching from subtree ↔ Itself refreshes results; leaves do not require a separate Itself control.

**Independent Test**: Alice shows Itself; choosing it returns Alice-only data on each screen; Eve has no separate Itself requirement; switching modes refreshes without full page reload.

### Tests for User Story 2 (MANDATORY)

- [x] T021 [P] [US2] Add backend tests that `scope=itself` returns singleton owner sets and does not include descendants in `packages/backend/tests/023-subtree-itself-select/itself-option.us2.test.ts`
- [x] T022 [P] [US2] Add web UI tests for Itself visibility on parents, omission on leaves, selection, and refresh on mode switch in `packages/web/tests/023-subtree-itself-select/itself-option.us2.test.tsx`

### Implementation for User Story 2

- [x] T023 [US2] Add discoverable **"Itself"** selectable control for nodes with children in `packages/web/src/components/team-deliverables/TeamMemberHierarchyPicker.tsx` using `frontend-design` + MUI (accessible label/aria via i18n; does not break expand/collapse)
- [x] T024 [US2] Ensure Itself selection emits `{ userId, scope: 'itself' }` and selected state distinguishes Itself vs subtree in `packages/web/src/components/team-deliverables/TeamMemberHierarchyPicker.tsx`
- [x] T025 [US2] Confirm route handlers already accept `scope=itself` end-to-end in `packages/backend/src/routes/users.ts` and consumers pass it from `LeaderTeamDeliverablesPage.tsx`, `LeaderTeamAnalyticsPage.tsx`, `LeaderTeamPrPerformancePage.tsx`, and `TeamPrPerformanceFilters.tsx`
- [x] T026 [US2] Add/complete `picker.itself` and related strings in `packages/web/src/locales/{en-US,pt-BR}/leader.json` (natural pt-BR wording)

**Checkpoint**: Leaders can choose person-only scope without losing subtree selection.

---

## Phase 5: User Story 3 - Clear scope feedback and empty results (Priority: P2)

**Goal**: Closed picker clearly shows subtree vs Itself; empty filtered results explain no matches for the current scope/filters; clearing selection restores full-team behavior without stale scope.

**Independent Test**: Closed input distinguishes Alice team vs Alice Itself; empty states are non-auth errors; clear on analytics/PR performance omits `userId` and `scope`.

### Tests for User Story 3 (MANDATORY)

- [x] T027 [P] [US3] Add web UI tests for closed-picker scope presentation, empty-state copy, and clear-selection behavior in `packages/web/tests/023-subtree-itself-select/scope-feedback.us3.test.tsx`
- [x] T028 [P] [US3] Add i18n key-parity tests for scope/empty strings in `packages/web/tests/023-subtree-itself-select/i18n-parity.us3.test.ts`

### Implementation for User Story 3

- [x] T029 [US3] Update closed-picker display in `packages/web/src/components/team-deliverables/TeamMemberHierarchyPicker.tsx` using `frontend-design` + MUI to show person name plus subtree vs Itself indicator (chip/suffix via i18n)
- [x] T030 [US3] Ensure clear/“all my team” paths in `packages/web/src/pages/LeaderTeamAnalyticsPage.tsx`, `packages/web/src/pages/LeaderTeamPrPerformancePage.tsx`, and `packages/web/src/components/leader-pr-performance/TeamPrPerformanceFilters.tsx` clear both `userId` and `scope`
- [x] T031 [US3] Align empty-state messaging for scoped filters in `packages/web/src/pages/LeaderTeamDeliverablesPage.tsx`, `packages/web/src/pages/LeaderTeamAnalyticsPage.tsx`, and `packages/web/src/pages/LeaderTeamPrPerformancePage.tsx` with i18n keys (no auth-failure implication)
- [x] T032 [US3] Add remaining scope-feedback / empty-state keys to `packages/web/src/locales/{en-US,pt-BR}/leader.json`

**Checkpoint**: Leaders can tell which scope is active and interpret empty results correctly.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Consistency, regression, and quickstart validation across all stories.

- [x] T033 [P] Cross-screen consistency check/tests that Team Deliverables, Team Analytics, and Team PR Performance apply identical subtree/Itself rules in `packages/web/tests/023-subtree-itself-select/cross-screen-consistency.test.tsx`
- [x] T034 [P] Invalid `scope` value returns 400 on affected endpoints in `packages/backend/tests/023-subtree-itself-select/scope-validation.test.ts`
- [x] T035 Run manual validation scenarios from `specs/023-subtree-itself-select/quickstart.md` and fix any gaps
- [x] T036 [P] Confirm no hard-coded user-visible picker/scope strings remain in `packages/web/src/components/team-deliverables/TeamMemberHierarchyPicker.tsx` and consumer pages

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **US1 (Phase 3)**: Depends on Foundational — MVP
- **US2 (Phase 4)**: Depends on Foundational; builds on US1 picker/API `scope` plumbing
- **US3 (Phase 5)**: Depends on US1+US2 selection modes existing so feedback can distinguish them
- **Polish (Phase 6)**: Depends on desired stories complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational — delivers subtree default end-to-end
- **User Story 2 (P1)**: After US1 API/client `scope` path exists — adds Itself UX and singleton mode
- **User Story 3 (P2)**: After US1+US2 — scope labels, empty states, clear behavior

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Backend scope wiring before/with web clients
- Picker behavior before page wiring where the story is UI-led
- Story complete before moving to next priority when sequential

### Parallel Opportunities

- T002–T004 in Setup can run in parallel
- T007–T008 in Foundational can run in parallel after T006
- US1 tests T009–T012 in parallel; US1 service wires T013–T014 in parallel after resolver
- US2 tests T021–T022 in parallel
- US3 tests T027–T028 in parallel
- Polish T033, T034, T036 in parallel

---

## Parallel Example: User Story 1

```bash
# Launch US1 tests together:
Task: "subtree-select.us1.test.ts in packages/backend/tests/023-subtree-itself-select/"
Task: "team-deliverables-subtree.us1.test.ts in packages/backend/tests/023-subtree-itself-select/"
Task: "subtree-select.us1.test.tsx in packages/web/tests/023-subtree-itself-select/"
Task: "i18n-parity.us1.test.ts in packages/web/tests/023-subtree-itself-select/"

# After resolver exists, wire analytics + PR services in parallel:
Task: "leaderAnalyticsService.ts resolveOwnerUserIds"
Task: "leaderPrPerformanceService.ts resolveOwnerUserIds"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational resolver + DAC tests
3. Complete Phase 3: User Story 1 (subtree across three screens)
4. **STOP and VALIDATE**: Select a mid-level manager and confirm multi-level inclusion
5. Demo if ready

### Incremental Delivery

1. Setup + Foundational → shared expansion ready
2. US1 → subtree selection works application-wide (MVP)
3. US2 → Itself restores person-only views
4. US3 → clear labels + empty/clear behavior
5. Polish → cross-screen + validation hardening

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. After Foundational:
   - Developer A: US1 backend endpoint/service wires
   - Developer B: US1 picker + page clients (after contract agreed)
3. US2/US3 follow on the shared picker once subtree path exists

---

## Notes

- [P] tasks = different files, no incomplete-task dependencies
- No DB migration for this feature
- Default `scope` when `userId` present is `subtree` (research.md)
- Clearing selection must drop both `userId` and `scope`
- Commit after each task or logical group
- Stop at checkpoints to validate independently
