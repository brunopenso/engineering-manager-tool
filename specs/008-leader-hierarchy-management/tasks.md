# Tasks: Leader Hierarchy Management

**Input**: Design documents from `/specs/008-leader-hierarchy-management/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are MANDATORY for this feature. Every user story and requirement must include automated test coverage before merge.

**Organization**: Tasks are grouped by user story to allow independent implementation and validation.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare feature scaffolding and test directories.

- [X] T001 Create feature test directory structure in `tests/008-leader-hierarchy-management/` (contract, integration, ui, unit placeholders)
- [X] T002 Create backend test bootstrap file for hierarchy management in `packages/backend/src/__tests__/hierarchy-management.setup.ts`
- [X] T003 [P] Create web test bootstrap file for hierarchy management page in `packages/web/src/__tests__/leader-hierarchy-management.setup.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement shared domain primitives and authorization hooks required by all stories.

**⚠️ CRITICAL**: No user story work starts until this phase is complete.

- [X] T004 Define shared hierarchy-management DTO types in `packages/backend/src/types/hierarchyManagement.ts`
- [X] T005 [P] Add leader-role authorization guard helper for hierarchy endpoints in `packages/backend/src/services/authorizationService.ts`
- [X] T006 [P] Add orphan-user query helper and assignment precondition helper in `packages/backend/src/services/userService.ts`
- [X] T007 [P] Add assignment audit-event persistence interface in `packages/backend/src/services/userService.ts`
- [X] T008 Add frontend API client methods for orphan search and assignment in `packages/web/src/services/usersApi.ts`
- [X] T009 Add route-level leader guard utility for hierarchy screen in `packages/web/src/routes/shellOptions.ts`

**Checkpoint**: Foundation complete - user stories can proceed.

---

## Phase 3: User Story 1 - Assign Orphan Users to Logged-In Leader (Priority: P1) 🎯 MVP

**Goal**: Leaders can search orphan users by full/partial name or email and assign them to themselves.

**Independent Test**: As a leader, search by partial name/email, assign a returned orphan user, and verify user is no longer eligible for orphan list.

### Tests for User Story 1 (MANDATORY)

- [X] T010 [P] [US1] Add contract test for `GET /users/orphans` in `tests/008-leader-hierarchy-management/contract/orphan-search.contract.test.md`
- [X] T011 [P] [US1] Add contract test for `POST /users/{userId}/assign-leader` in `tests/008-leader-hierarchy-management/contract/assign-leader.contract.test.md`
- [X] T012 [P] [US1] Add backend integration test for partial/full name-email orphan search in `packages/backend/src/__tests__/hierarchy-orphan-search.test.ts`
- [X] T013 [P] [US1] Add backend integration test for successful orphan assignment and re-check of orphan status in `packages/backend/src/__tests__/hierarchy-assign.test.ts`
- [X] T014 [P] [US1] Add web integration test for leader search + assignment workflow in `packages/web/src/__tests__/leader-hierarchy-management-page.test.tsx`

### Implementation for User Story 1

- [X] T015 [US1] Implement `GET /users/orphans` route with query validation in `packages/backend/src/routes/users.ts`
- [X] T016 [US1] Implement case-insensitive partial/full name-email orphan search service logic in `packages/backend/src/services/userService.ts`
- [X] T017 [US1] Implement `POST /users/{userId}/assign-leader` route in `packages/backend/src/routes/users.ts`
- [X] T018 [US1] Implement orphan-only assignment transaction with concurrency-safe eligibility check in `packages/backend/src/services/userService.ts`
- [X] T019 [US1] Persist hierarchy assignment audit event for successful assignments in `packages/backend/src/services/userService.ts`
- [X] T020 [US1] Create `LeaderHierarchyManagementPage` with Material UI and `frontend-design` skill in `packages/web/src/pages/LeaderHierarchyManagementPage.tsx`
- [X] T021 [US1] Wire orphan search and assignment actions from page to API client in `packages/web/src/services/usersApi.ts`
- [X] T022 [US1] Register hierarchy management route in `packages/web/src/App.tsx`
- [X] T023 [US1] Add leader-only menu entry for hierarchy management in `packages/web/src/routes/shellOptions.ts`
- [X] T024 [US1] Add success/error feedback states for search and assignment results in `packages/web/src/pages/LeaderHierarchyManagementPage.tsx`

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Restrict Hierarchy Management to Leaders (Priority: P2)

**Goal**: Non-leaders and unauthenticated users are blocked from hierarchy-management data and actions.

**Independent Test**: Verify non-leader and unauthenticated users cannot load page data or execute orphan search/assignment endpoints.

### Tests for User Story 2 (MANDATORY)

- [X] T025 [P] [US2] Add backend authorization deny test for orphan search endpoint in `packages/backend/src/__tests__/hierarchy-access-deny.test.ts`
- [X] T026 [P] [US2] Add backend authorization deny test for assignment endpoint in `packages/backend/src/__tests__/hierarchy-access-deny.test.ts`
- [X] T027 [P] [US2] Add web route-guard deny test for non-leader user in `packages/web/src/__tests__/leader-hierarchy-management-guard.test.tsx`
- [X] T028 [P] [US2] Add web unauthenticated deny test for hierarchy route entry in `packages/web/src/__tests__/leader-hierarchy-management-guard.test.tsx`

### Implementation for User Story 2

- [X] T029 [US2] Enforce leader-role authorization in orphan search route boundary in `packages/backend/src/routes/users.ts`
- [X] T030 [US2] Enforce leader-role authorization in assignment route boundary in `packages/backend/src/routes/users.ts`
- [X] T031 [US2] Implement non-leader/unauthenticated guard handling on hierarchy page load in `packages/web/src/pages/LeaderHierarchyManagementPage.tsx`
- [X] T032 [US2] Implement consistent unauthorized UI error state in `packages/web/src/pages/LeaderHierarchyManagementPage.tsx`

**Checkpoint**: User Story 2 is independently functional and testable.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final alignment, documentation, and verification across stories.

- [X] T033 [P] Update feature documentation references to final endpoint names in `specs/008-leader-hierarchy-management/quickstart.md`
- [X] T034 Validate contract/spec/plan consistency for removed transfer scope in `specs/008-leader-hierarchy-management/spec.md`
- [X] T035 [P] Add additional backend unit tests for orphan matching edge cases in `packages/backend/src/__tests__/hierarchy-orphan-search.test.ts`
- [X] T036 Run full feature verification steps and capture outcomes in `specs/008-leader-hierarchy-management/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2; delivers MVP.
- **Phase 4 (US2)**: Depends on Phase 2; can run in parallel with late US1 tasks if no file conflict.
- **Phase 5 (Polish)**: Depends on completion of selected user stories.

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational; no dependency on US2.
- **US2 (P2)**: Starts after Foundational; independent from US1 from business perspective, but may reuse US1 route/page touchpoints.

### Within Each User Story

- Write tests first and confirm they fail.
- Implement backend service/route logic.
- Implement frontend integration and guard behaviors.
- Re-run story-specific tests before moving forward.

### Parallel Opportunities

- Foundational tasks marked `[P]` (T005, T006, T007) can run in parallel.
- US1 tests marked `[P]` (T010-T014) can run in parallel.
- US2 tests marked `[P]` (T025-T028) can run in parallel.
- US1 UI tasks and backend tasks can run in parallel once shared API contracts are stable.

---

## Parallel Example: User Story 1

```bash
# Parallel test authoring for US1
Task: "T010 Add contract test for GET /users/orphans in tests/008-leader-hierarchy-management/contract/orphan-search.contract.test.md"
Task: "T011 Add contract test for POST /users/{userId}/assign-leader in tests/008-leader-hierarchy-management/contract/assign-leader.contract.test.md"
Task: "T014 Add web integration test for leader workflow in packages/web/src/__tests__/leader-hierarchy-management-page.test.tsx"

# Parallel implementation after contracts are settled
Task: "T016 Implement orphan search service logic in packages/backend/src/services/userService.ts"
Task: "T020 Create LeaderHierarchyManagementPage in packages/web/src/pages/LeaderHierarchyManagementPage.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup (Phase 1).
2. Complete Foundational (Phase 2).
3. Deliver US1 (Phase 3).
4. Validate US1 independently using quickstart scenarios.

### Incremental Delivery

1. Ship US1 for immediate hierarchy cleanup value.
2. Add US2 guard-hardening behaviors.
3. Finish with Polish tasks and full verification.

### Parallel Team Strategy

1. One engineer handles backend foundational + US1 service/route work.
2. One engineer handles frontend page, route, and guard work.
3. Both collaborate on contract and integration test completion.

---

## Notes

- `[P]` tasks indicate file-level parallelism with no blocking dependency.
- `[US1]` and `[US2]` labels maintain traceability from tasks to user stories.
- All tasks include concrete paths so implementation can start directly.
