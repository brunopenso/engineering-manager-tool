# Tasks: Leader Hierarchy View

**Input**: Design documents from `/specs/009-leader-hierarchy-view/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are MANDATORY for this feature. Every user story and requirement must include automated test coverage before merge.

**Organization**: Tasks are grouped by user story to allow independent implementation and validation.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare feature scaffolding, dependencies, and test directories.

- [X] T001 Create feature test directory structure in `tests/009-leader-hierarchy-view/` with `hierarchy-tree-display.test.md`, `hierarchy-tree-interaction.test.md`, and `hierarchy-view-access-control.test.md`
- [X] T002 Create backend test directory and bootstrap in `packages/backend/tests/hierarchy-view/hierarchy-view.setup.ts`
- [X] T003 [P] Create web test directory and bootstrap in `packages/web/tests/hierarchy-view/hierarchy-view.setup.test.tsx`
- [X] T004 [P] Add `@mui/x-tree-view` dependency (latest stable compatible with `@mui/material@^6.4.2`) in `packages/web/package.json` and verify `npm run build --workspace @em-tool/web`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared DTOs, API client surface, and route constants required by all stories.

**⚠️ CRITICAL**: No user story work starts until this phase is complete.

- [X] T005 Define hierarchy view DTO types (`HierarchyViewNode`, `LeaderHierarchyViewResponse`) in `packages/backend/src/types/hierarchyView.ts`
- [X] T006 [P] Add `displayName` helper (`fullName` trim or `email` fallback) in `packages/backend/src/services/userService.ts`
- [X] T007 [P] Add `fetchLeaderHierarchyView` client method and response types in `packages/web/src/services/usersApi.ts`
- [X] T008 [P] Add `LEADER_HIERARCHY_VIEW_ROUTE` constant and placeholder nav id in `packages/web/src/routes/shellOptions.ts`

**Checkpoint**: Foundation complete — user stories can proceed.

---

## Phase 3: User Story 1 - View Organizational Tree Around Current Position (Priority: P1) 🎯 MVP

**Goal**: Leaders see direct manager (max one level up), themselves, and full descendant subtree with names on every node.

**Independent Test**: As a leader with manager and nested reports, open hierarchy view and verify manager (only one), self, all reports by name, and no out-of-scope users in API or UI.

### Tests for User Story 1 (MANDATORY)

- [X] T009 [P] [US1] Add contract test plan for `GET /users/leader/hierarchy-view` in `tests/009-leader-hierarchy-view/hierarchy-tree-display.test.md` aligned with `specs/009-leader-hierarchy-view/contracts/hierarchy-view-api.yaml`
- [X] T010 [P] [US1] Add backend integration test for scoped tree payload (manager hop, full subtree, `displayName` on nodes, no peers/other branches) in `packages/backend/tests/hierarchy-view/hierarchy-view-tree.us1.test.ts`
- [X] T011 [P] [US1] Add backend integration test for leader with no manager (`manager: null`) in `packages/backend/tests/hierarchy-view/hierarchy-view-no-manager.us1.test.ts`
- [X] T012 [P] [US1] Add web integration test for hierarchy view page rendering manager section and report names in `packages/web/tests/hierarchy-view/leader-hierarchy-view-page.us1.test.tsx`

### Implementation for User Story 1

- [X] T013 [US1] Implement `getLeaderHierarchyView(actorUserId)` with recursive descendant CTE and tree assembly in `packages/backend/src/services/userService.ts`
- [X] T014 [US1] Register `GET /users/leader/hierarchy-view` with `assertLeaderForHierarchyManagement` in `packages/backend/src/routes/users.ts`
- [X] T015 [US1] Create `HierarchyTree.tsx` with `SimpleTreeView`, nodes built from `reports`, and `displayName` labels in `packages/web/src/components/hierarchy/HierarchyTree.tsx`
- [X] T016 [US1] Create `LeaderHierarchyViewPage.tsx` using `frontend-design` skill (manager summary + tree, loading/error states) in `packages/web/src/pages/LeaderHierarchyViewPage.tsx`
- [X] T017 [US1] Wire page data load via `fetchLeaderHierarchyView` in `packages/web/src/pages/LeaderHierarchyViewPage.tsx`
- [X] T018 [US1] Register `/app/leader/hierarchy/view` route behind `LeaderRoute` in `packages/web/src/App.tsx`
- [X] T019 [US1] Add leader-only shell menu entry **Hierarchy view** pointing to `LEADER_HIERARCHY_VIEW_ROUTE` in `packages/web/src/routes/shellOptions.ts`

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Navigate and Identify Current Position (Priority: P2)

**Goal**: Current position is visually distinct; expand/collapse reveals one layer at a time; initial expand state is only the leader’s node.

**Independent Test**: Load hierarchy view, confirm “you” emphasis on self node, only self expanded initially, expand/collapse descendant nodes without showing out-of-scope users.

### Tests for User Story 2 (MANDATORY)

- [X] T020 [P] [US2] Add interaction test plan in `tests/009-leader-hierarchy-view/hierarchy-tree-interaction.test.md`
- [X] T021 [P] [US2] Add web test for initial `expandedItems` containing only self id in `packages/web/tests/hierarchy-view/hierarchy-tree-expand.us2.test.tsx`
- [X] T022 [P] [US2] Add web test for current-position visual marker and expand/collapse of nested report in `packages/web/tests/hierarchy-view/hierarchy-tree-interaction.us2.test.tsx`

### Implementation for User Story 2

- [X] T023 [US2] Implement controlled `expandedItems` state (default `[self.id]` only) in `packages/web/src/components/hierarchy/HierarchyTree.tsx`
- [X] T024 [US2] Apply current-position styling when `isCurrentPosition` is true in `packages/web/src/components/hierarchy/HierarchyTree.tsx`
- [X] T025 [US2] Render optional **Your manager** section above tree when `manager` is present in `packages/web/src/pages/LeaderHierarchyViewPage.tsx`
- [X] T026 [US2] Ensure read-only page has no orphan search or assign controls (FR-009) in `packages/web/src/pages/LeaderHierarchyViewPage.tsx`

**Checkpoint**: User Story 2 is independently functional and testable.

---

## Phase 5: User Story 3 - Restrict Hierarchy View to Leaders (Priority: P3)

**Goal**: Non-leaders and unauthenticated users cannot access hierarchy view API or route.

**Independent Test**: Non-leader navigates to view route → denied with no tree data; unauthenticated API call → 401; non-leader API call → 403.

### Tests for User Story 3 (MANDATORY)

- [X] T027 [P] [US3] Add access-control test plan in `tests/009-leader-hierarchy-view/hierarchy-view-access-control.test.md`
- [X] T028 [P] [US3] Add backend deny tests (401 unauthenticated, 403 non-leader) for `GET /users/leader/hierarchy-view` in `packages/backend/tests/hierarchy-view/hierarchy-view-access.us3.test.ts`
- [X] T029 [P] [US3] Add web route-guard tests (non-leader redirect, unauthenticated login redirect) in `packages/web/tests/hierarchy-view/leader-hierarchy-view-guard.us3.test.tsx`

### Implementation for User Story 3

- [X] T030 [US3] Verify leader-only guard and consistent 401/403 error payloads on `GET /users/leader/hierarchy-view` in `packages/backend/src/routes/users.ts`
- [X] T031 [US3] Confirm `LeaderRoute` wraps hierarchy view page and blocks data fetch for non-leaders in `packages/web/src/App.tsx` and `packages/web/src/pages/LeaderHierarchyViewPage.tsx`

**Checkpoint**: User Story 3 is independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, DAC evidence, documentation, and full verification.

- [X] T032 [P] Add backend test for `displayName` email fallback when `fullName` is blank in `packages/backend/tests/hierarchy-view/hierarchy-view-display-name.test.ts`
- [X] T033 [P] Add backend DAC test proving second-level manager and peer users are excluded from payload in `packages/backend/tests/hierarchy-view/hierarchy-view-dac.test.ts`
- [X] T034 Validate contract/spec/plan alignment for `GET /users/leader/hierarchy-view` in `specs/009-leader-hierarchy-view/contracts/hierarchy-view-api.yaml`
- [X] T035 Run full feature verification (`npm test` backend/web hierarchy-view suites) and record outcomes in `specs/009-leader-hierarchy-view/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2; delivers MVP.
- **Phase 4 (US2)**: Depends on Phase 2 and US1 page/tree components.
- **Phase 5 (US3)**: Depends on Phase 2; can start in parallel with US1 after T014 route exists.
- **Phase 6 (Polish)**: Depends on US1–US3 completion.

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational; no dependency on US2/US3.
- **US2 (P2)**: Builds on US1 `HierarchyTree` and page; independently testable via interaction tests.
- **US3 (P3)**: Independent from US1/US2 behavior; can implement guards as soon as route exists (T014).

### Within Each User Story

- Write tests first and confirm they fail.
- Implement backend service/route before frontend integration.
- Re-run story-specific tests before checkpoint.

### Parallel Opportunities

- Phase 1: T003 and T004 in parallel after T001.
- Phase 2: T006, T007, T008 in parallel after T005.
- US1 tests T009–T012 in parallel.
- US1 implementation: T013/T014 (backend) parallel with T015 (component scaffold) after T005–T008.
- US3 tests T027–T029 can run in parallel with late US1 tasks once route is registered.

---

## Parallel Example: User Story 1

```bash
# Parallel test authoring
Task: "T010 Backend tree payload test in packages/backend/tests/hierarchy-view/hierarchy-view-tree.us1.test.ts"
Task: "T012 Web page render test in packages/web/tests/hierarchy-view/leader-hierarchy-view-page.us1.test.tsx"

# Parallel implementation after DTOs exist
Task: "T013 getLeaderHierarchyView in packages/backend/src/services/userService.ts"
Task: "T015 HierarchyTree.tsx in packages/web/src/components/hierarchy/HierarchyTree.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup).
2. Complete Phase 2 (Foundational).
3. Deliver Phase 3 (US1).
4. Validate with quickstart “Leader with manager and team” scenario.

### Incremental Delivery

1. Ship US1 — read-only tree with correct scoped data (MVP).
2. Add US2 — expand/collapse UX and current-position emphasis.
3. Add US3 — access hardening tests and guard verification.
4. Finish Phase 6 polish and DAC edge-case tests.

### Parallel Team Strategy

1. Engineer A: backend T013–T014 + US3 backend tests.
2. Engineer B: frontend T015–T019 + US2 interaction.
3. Shared: contract test plans under `tests/009-leader-hierarchy-view/`.

---

## Notes

- `[P]` tasks = different files, no blocking dependency.
- `[US1]` / `[US2]` / `[US3]` map to spec.md user stories.
- Constitution Principle VII exception: only direct manager in `manager` field; T033 must prove no deeper superiors.
- Hierarchy **management** remains on `/app/leader/hierarchy` (feature 008); do not add assignment UI to view page.
- All new screens must use `frontend-design` skill per constitution Principle VIII.
