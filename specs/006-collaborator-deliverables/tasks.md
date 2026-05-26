# Tasks: Collaborator Deliverables

**Input**: Design documents from `/specs/006-collaborator-deliverables/`  
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/deliverables-api.yaml`, `quickstart.md`

**Tests**: Tests are mandatory. Every user story and functional requirement includes automated backend and/or web test tasks.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (`[US1]`–`[US5]`) for story-phase tasks only
- Every task includes an explicit file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Validate contracts and prepare test scaffolds.

- [x] T001 Validate Deliverables API contract consistency in `specs/006-collaborator-deliverables/contracts/deliverables-api.yaml` against `specs/006-collaborator-deliverables/spec.md`
- [x] T002 [P] Create backend test scaffold for deliverables feature in `packages/backend/src/__tests__/deliverables.setup.test.ts`
- [x] T003 [P] Create web test scaffold for deliverables routes in `packages/web/src/__tests__/deliverables.setup.test.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Data model, DAC primitives, tag catalog read for picker, and shared API clients required by all user stories.

**⚠️ CRITICAL**: No user story work begins until this phase is complete.

- [x] T004 Add `Deliverable` entity in `packages/backend/src/database/entities/Deliverable.ts`
- [x] T005 [P] Add `DeliverableSystemTag` junction entity in `packages/backend/src/database/entities/DeliverableSystemTag.ts`
- [x] T006 [P] Add `DeliverableUserTag` entity in `packages/backend/src/database/entities/DeliverableUserTag.ts`
- [x] T007 [P] Add `DeliverableLink` entity in `packages/backend/src/database/entities/DeliverableLink.ts`
- [x] T008 Register deliverable entities in ORM configuration in `packages/backend/src/database/ormconfig.ts`
- [x] T009 Create migration for deliverables tables and indexes in `packages/backend/database/migrations/*-AddDeliverables.ts`
- [x] T010 [P] Add deliverable validation helpers (field lengths, URLs, tag/link limits, business impact) in `packages/backend/src/services/deliverableValidation.ts`
- [x] T011 [P] Add deliverable error codes (`INVALID_SYSTEM_TAG`, `DELIVERABLE_FORBIDDEN`) in `packages/backend/src/auth/types.ts`
- [x] T012 Add `OrganizationalHierarchyResolver` interface and test injection hook in `packages/backend/src/services/organizationalHierarchy.ts`
- [x] T013 Extend `canReadDeliverablesForOwner` DAC helper in `packages/backend/src/services/authorizationService.ts`
- [x] T014 [P] Add hierarchy tree fixtures for DAC tests in `packages/backend/src/test/fixtures/organizationalHierarchy.ts`
- [x] T015 Create shared deliverable service primitives (load with relations, map to API DTOs) in `packages/backend/src/services/deliverableService.ts`
- [x] T016 Implement `GET /tags/catalog` authenticated read-only route in `packages/backend/src/routes/tags.ts`
- [x] T017 [P] Add `fetchTagCatalog` to web tags client in `packages/web/src/services/tagsApi.ts`
- [x] T018 [P] Create deliverables API client types and base helpers in `packages/web/src/services/deliverablesApi.ts`
- [x] T019 Add `DELIVERABLES_ROUTE`, `DELIVERABLES_VIEW_ROUTE`, and shell menu entry in `packages/web/src/routes/shellOptions.ts`

**Checkpoint**: Foundation complete; user story phases can proceed.

---

## Phase 3: User Story 1 - Collaborator records a new deliverable (Priority: P1) 🎯 MVP

**Goal**: Allow owners to create a deliverable with all required fields, valid system tags, and optional children; persist stable ID.

**Independent Test**: As collaborator, `POST /deliverables` with required payload succeeds; invalid/missing fields and bad tag IDs rejected; created row appears on next owner list load.

### Tests for User Story 1 (MANDATORY)

- [x] T020 [P] [US1] Add backend integration test for `POST /deliverables` success in `packages/backend/src/__tests__/deliverables-create.us1.test.ts`
- [x] T021 [P] [US1] Add backend integration tests for create validation failures (missing required, invalid impact, bad URLs) in `packages/backend/src/__tests__/deliverables-create-validation.us1.test.ts`
- [x] T022 [P] [US1] Add backend integration test for invalid/missing system tag rejection in `packages/backend/src/__tests__/deliverables-create-tags.us1.test.ts`
- [x] T023 [P] [US1] Add web test for create form submit and success in `packages/web/src/__tests__/deliverables-create.us1.test.tsx`
- [x] T024 [P] [US1] Add web test for create form validation and inline errors in `packages/web/src/__tests__/deliverables-create-validation.us1.test.tsx`

### Implementation for User Story 1

- [x] T025 [US1] Implement `createDeliverable` transactional service in `packages/backend/src/services/deliverableService.ts`
- [x] T026 [US1] Implement `POST /deliverables` route in `packages/backend/src/routes/deliverables.ts`
- [x] T027 [US1] Register deliverables routes in backend bootstrap in `packages/backend/src/index.ts`
- [x] T028 [US1] Implement `createDeliverable` API client method in `packages/web/src/services/deliverablesApi.ts`
- [x] T029 [US1] Implement deliverables page create form (required/optional groups, system tag multi-select) using `frontend-design` skill with Material UI in `packages/web/src/pages/DeliverablesPage.tsx`
- [x] T030 [US1] Add `/app/deliverables` protected route in `packages/web/src/App.tsx`

**Checkpoint**: User Story 1 works independently (owner create + persistence + validation).

---

## Phase 4: User Story 2 - Collaborator views their deliverable portfolio (Priority: P1)

**Goal**: Allow owners to list all own deliverables with summary fields and empty state on the management screen.

**Independent Test**: As owner, `GET /deliverables` returns only own items; empty state when none; peer `GET /users/{peerId}/deliverables` returns 403.

### Tests for User Story 2 (MANDATORY)

- [x] T031 [P] [US2] Add backend integration test for `GET /deliverables` owner list shape and ordering in `packages/backend/src/__tests__/deliverables-list.us2.test.ts`
- [x] T032 [P] [US2] Add backend integration test for peer forbidden list on `GET /users/{userId}/deliverables` in `packages/backend/src/__tests__/deliverables-list-peer-deny.us2.test.ts`
- [x] T033 [P] [US2] Add web test for portfolio list rendering (title, impact, tag chips) in `packages/web/src/__tests__/deliverables-list.us2.test.tsx`
- [x] T034 [P] [US2] Add web test for empty-state rendering in `packages/web/src/__tests__/deliverables-empty-state.us2.test.tsx`

### Implementation for User Story 2

- [x] T035 [US2] Implement `listDeliverablesForOwner` service in `packages/backend/src/services/deliverableService.ts`
- [x] T036 [US2] Implement `GET /deliverables` route in `packages/backend/src/routes/deliverables.ts`
- [x] T037 [US2] Implement `listMyDeliverables` API client and data-loading in `packages/web/src/services/deliverablesApi.ts`
- [x] T038 [US2] Implement deliverables list table and empty state using `frontend-design` skill with Material UI in `packages/web/src/pages/DeliverablesPage.tsx`

**Checkpoint**: User Stories 1 and 2 each run independently (create and owner list).

---

## Phase 5: User Story 3 - Collaborator updates an existing deliverable (Priority: P2)

**Goal**: Allow owners to update all fields with validation; deny non-owner updates; stable ID.

**Independent Test**: Owner `PATCH /deliverables/{id}` updates fields; non-owner receives 403; removed system tag IDs rejected.

### Tests for User Story 3 (MANDATORY)

- [x] T039 [P] [US3] Add backend integration test for `PATCH /deliverables/{id}` success with ID stability in `packages/backend/src/__tests__/deliverables-update.us3.test.ts`
- [x] T040 [P] [US3] Add backend integration test for non-owner forbidden update in `packages/backend/src/__tests__/deliverables-update-forbidden.us3.test.ts`
- [x] T041 [P] [US3] Add backend integration test for update validation and invalid system tags in `packages/backend/src/__tests__/deliverables-update-validation.us3.test.ts`
- [x] T042 [P] [US3] Add web test for edit/save update flow in `packages/web/src/__tests__/deliverables-update.us3.test.tsx`

### Implementation for User Story 3

- [x] T043 [US3] Implement `updateDeliverable` transactional replace-children service in `packages/backend/src/services/deliverableService.ts`
- [x] T044 [US3] Implement `PATCH /deliverables/{deliverableId}` route in `packages/backend/src/routes/deliverables.ts`
- [x] T045 [US3] Implement `updateDeliverable` API client method in `packages/web/src/services/deliverablesApi.ts`
- [x] T046 [US3] Implement edit form/dialog reusing create layout using `frontend-design` skill with Material UI in `packages/web/src/pages/DeliverablesPage.tsx`

**Checkpoint**: User Story 3 independently complete and testable.

---

## Phase 6: User Story 4 - Collaborator removes a deliverable (Priority: P3)

**Goal**: Allow owners to delete with UI confirmation; deny non-owner delete; predictable not-found.

**Independent Test**: Owner `DELETE /deliverables/{id}` returns 204 and item absent on reload; non-owner 403; missing id 404.

### Tests for User Story 4 (MANDATORY)

- [x] T047 [P] [US4] Add backend integration test for `DELETE /deliverables/{id}` success in `packages/backend/src/__tests__/deliverables-delete.us4.test.ts`
- [x] T048 [P] [US4] Add backend integration test for delete not-found and non-owner forbidden in `packages/backend/src/__tests__/deliverables-delete-errors.us4.test.ts`
- [x] T049 [P] [US4] Add web test for delete confirmation workflow in `packages/web/src/__tests__/deliverables-delete.us4.test.tsx`

### Implementation for User Story 4

- [x] T050 [US4] Implement `deleteDeliverable` service in `packages/backend/src/services/deliverableService.ts`
- [x] T051 [US4] Implement `DELETE /deliverables/{deliverableId}` route in `packages/backend/src/routes/deliverables.ts`
- [x] T052 [US4] Implement `deleteDeliverable` API client method in `packages/web/src/services/deliverablesApi.ts`
- [x] T053 [US4] Implement delete confirmation dialog using `frontend-design` skill with Material UI in `packages/web/src/pages/DeliverablesPage.tsx`

**Checkpoint**: User Story 4 independently complete and testable.

---

## Phase 7: User Story 5 - Superior reviews subordinate deliverables (Priority: P3)

**Goal**: Allow read-only portfolio access for direct/indirect superiors up to top of chain; deny peers and upward reads.

**Independent Test**: With hierarchy fixtures, manager `GET /users/{reportId}/deliverables` succeeds with `readOnly: true`; peer and subordinate-viewing-superior denied; superior cannot PATCH/DELETE.

### Tests for User Story 5 (MANDATORY)

- [x] T054 [P] [US5] Add backend DAC tests for direct manager allow and top-of-chain indirect allow in `packages/backend/src/__tests__/deliverables-dac-superior-allow.us5.test.ts`
- [x] T055 [P] [US5] Add backend DAC tests for peer deny and subordinate-upward deny in `packages/backend/src/__tests__/deliverables-dac-deny.us5.test.ts`
- [x] T056 [P] [US5] Add backend integration test for superior forbidden mutate on subordinate deliverable in `packages/backend/src/__tests__/deliverables-dac-mutate-deny.us5.test.ts`
- [x] T057 [P] [US5] Add backend integration test for `GET /deliverables/{id}` read-only detail for superior in `packages/backend/src/__tests__/deliverables-detail-readonly.us5.test.ts`
- [x] T058 [P] [US5] Add web test for read-only superior portfolio view in `packages/web/src/__tests__/deliverables-view.us5.test.tsx`

### Implementation for User Story 5

- [x] T059 [US5] Implement `GET /users/{userId}/deliverables` with DAC in `packages/backend/src/routes/deliverables.ts`
- [x] T060 [US5] Implement `GET /deliverables/{deliverableId}` detail with DAC and `readOnly` flag in `packages/backend/src/routes/deliverables.ts`
- [x] T061 [US5] Implement `listUserDeliverables` and `getDeliverable` API client methods in `packages/web/src/services/deliverablesApi.ts`
- [x] T062 [US5] Implement read-only `DeliverablesViewPage` with owner banner using `frontend-design` skill with Material UI in `packages/web/src/pages/DeliverablesViewPage.tsx`
- [x] T063 [US5] Add `/app/deliverables/view/:userId` protected route in `packages/web/src/App.tsx`

**Checkpoint**: All user stories complete and independently testable.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, documentation sync, and regression verification.

- [x] T064 [P] Update feature quickstart with final commands and verification steps in `specs/006-collaborator-deliverables/quickstart.md`
- [x] T065 [P] Confirm end-to-end regression notes in `specs/006-collaborator-deliverables/plan.md` match implemented routes
- [x] T066 Run backend lint/tests for deliverables scope via `packages/backend/package.json` scripts
- [x] T067 Run web lint/tests for deliverables scope via `packages/web/package.json` scripts
- [x] T068 Run full workspace verification (`build`, `lint`, `test`) from repository root `package.json` scripts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Starts immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2; MVP slice.
- **Phase 4 (US2)**: Depends on Phase 2; can proceed after foundation (benefits from US1 create for richer list tests).
- **Phase 5 (US3)**: Depends on Phase 2 and deliverable load/update plumbing from US1/US2.
- **Phase 6 (US4)**: Depends on Phase 2 and shared routes/service from earlier stories.
- **Phase 7 (US5)**: Depends on Phase 2 DAC helpers and list/detail routes; extends read paths only.
- **Phase 8 (Polish)**: Depends on all story phases complete.

### User Story Dependencies

- **US1 (P1)**: Independent after foundation (needs `GET /tags/catalog` from Phase 2).
- **US2 (P1)**: Independent for empty list; shares `DeliverablesPage.tsx` with US1 technically.
- **US3 (P2)**: Requires existing deliverable records (US1) for meaningful tests but independently specified.
- **US4 (P3)**: Requires existing deliverable records; independently testable delete behavior.
- **US5 (P3)**: Requires list/detail endpoints; DAC tests use fixtures, not full org persistence.

### Within Each User Story

- Write tests first and confirm they fail.
- Implement service logic before route handlers.
- Implement backend API before web API client integration.
- Implement UI after API client methods exist.
- Validate story checkpoint before moving on.

---

## Parallel Opportunities

- Foundational parallel tasks: `T005`–`T007`, `T010`–`T011`, `T014`, `T017`–`T018`.
- US1 parallel tests: `T020`–`T024`.
- US2 parallel tests: `T031`–`T034`.
- US3 parallel tests: `T039`–`T042`.
- US4 parallel tests: `T047`–`T049`.
- US5 parallel tests: `T054`–`T058`.
- Polish parallel tasks: `T064`, `T065`.

---

## Parallel Example: User Story 1

```bash
# US1 tests in parallel:
Task: "T020 [US1] Backend POST success in packages/backend/src/__tests__/deliverables-create.us1.test.ts"
Task: "T021 [US1] Backend validation in packages/backend/src/__tests__/deliverables-create-validation.us1.test.ts"
Task: "T023 [US1] Web create flow in packages/web/src/__tests__/deliverables-create.us1.test.tsx"

# US1 implementation in parallel where safe:
Task: "T026 [US1] POST route in packages/backend/src/routes/deliverables.ts"
Task: "T029 [US1] Create form UI in packages/web/src/pages/DeliverablesPage.tsx"
```

## Parallel Example: User Story 5

```bash
Task: "T054 [US5] Superior allow DAC tests in packages/backend/src/__tests__/deliverables-dac-superior-allow.us5.test.ts"
Task: "T055 [US5] Peer/upward deny DAC tests in packages/backend/src/__tests__/deliverables-dac-deny.us5.test.ts"
Task: "T062 [US5] Read-only view page in packages/web/src/pages/DeliverablesViewPage.tsx"
```

---

## Implementation Strategy

### MVP First (US1 + minimal US2)

1. Complete Phase 1 and Phase 2.
2. Deliver Phase 3 (US1 create end-to-end).
3. Deliver Phase 4 list (US2) for immediate feedback on created items.
4. Validate SC-001 and create validation (SC-003 partial).
5. Demo MVP.

### Incremental Delivery

1. Add US3 (owner update).
2. Add US4 (owner delete with confirmation).
3. Add US5 (superior read-only portfolio + DAC suite for SC-002).
4. Run Phase 8 full regression.

### Parallel Team Strategy

1. Team aligns on Phase 2 migration and DAC fixtures.
2. After Phase 2:
   - Dev A: `deliverableService.ts` + `routes/deliverables.ts`
   - Dev B: `DeliverablesPage.tsx` + `deliverablesApi.ts`
   - Dev C: Backend/web test suites per story phase
3. Merge per-story checkpoints.

---

## Notes

- `[P]` tasks indicate different files and low merge-conflict risk.
- All story tasks include explicit file paths for direct execution.
- Frontend screen tasks require the `frontend-design` skill with Material UI.
- Hierarchy resolver remains fixture-backed until org persistence ships; US5 tests lock the clarified superior-chain read contract.
- Administrator tag CRUD (`/tags` mutations) remains unchanged; collaborators use `GET /tags/catalog` only.
