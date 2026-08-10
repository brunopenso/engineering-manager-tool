# Tasks: Leader Team Deliverables

**Input**: Design documents from `/specs/010-leader-team-deliverables/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are MANDATORY for this feature. Every user story and requirement must include automated test coverage before merge.

**Organization**: Tasks are grouped by user story to allow independent implementation and validation.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare feature scaffolding and test directories.

- [x] T001 Verify feature test plan files exist in `tests/010-leader-team-deliverables/` (`team-deliverables-search.us1.test.md`, `team-deliverables-date-filter.us2.test.md`, `team-deliverables-reviewed.us3.test.md`, `team-deliverables-access-control.us4.test.md`)
- [x] T002 Create backend test directory and shared bootstrap in `packages/backend/tests/team-deliverables/team-deliverables.setup.ts`
- [x] T003 [P] Create web test directory and shared bootstrap in `packages/web/tests/team-deliverables/team-deliverables.setup.test.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Migration, entity, DTOs, subtree helpers, and route constants required by all stories.

**⚠️ CRITICAL**: No user story work starts until this phase is complete.

- [x] T004 Add TypeORM migration for `deliverable_reviews` table in `packages/backend/database/migrations/*-AddDeliverableReviews.ts`
- [x] T005 [P] Add `DeliverableReview` entity in `packages/backend/src/database/entities/DeliverableReview.ts`
- [x] T006 Register `DeliverableReview` entity in `packages/backend/src/database/connection.ts`
- [x] T007 [P] Define team deliverables DTO types in `packages/backend/src/types/teamDeliverables.ts`
- [x] T008 Implement `getLeaderTeamMembers(actorUserId)` and `assertUserInLeaderSubtree(actorUserId, targetUserId)` using recursive CTE in `packages/backend/src/services/userService.ts`
- [x] T009 [P] Add `LEADER_TEAM_DELIVERABLES_ROUTE` constant and placeholder nav id in `packages/web/src/routes/shellOptions.ts`
- [x] T010 [P] Add `teamDeliverablesApi.ts` client module skeleton with typed response shapes in `packages/web/src/services/teamDeliverablesApi.ts`

**Checkpoint**: Foundation complete — user stories can proceed.

---

## Phase 3: User Story 1 - Leader browses a team member's recent deliverables (Priority: P1) 🎯 MVP

**Goal**: Leader opens Team Deliverables, selects a team member, and sees deliverables (title, description, reviewed) for the default last-30-days range in a table.

**Independent Test**: As a leader with reports and recent deliverables, open Team Deliverables, confirm team member select populated, default date range last 30 days, no rows until person selected, then table shows title/description/reviewed for matching items.

### Tests for User Story 1 (MANDATORY)

- [x] T011 [P] [US1] Align acceptance test plan with contract in `tests/010-leader-team-deliverables/team-deliverables-search.us1.test.md` and `specs/010-leader-team-deliverables/contracts/team-deliverables-api.yaml`
- [x] T012 [P] [US1] Add backend integration test for `GET /users/leader/team-members` (descendants only, displayName fallback) in `packages/backend/tests/team-deliverables/team-deliverables-search.us1.test.ts`
- [x] T013 [P] [US1] Add backend integration test for `GET /users/leader/team-deliverables` with default date window in `packages/backend/tests/team-deliverables/team-deliverables-search.us1.test.ts`
- [x] T014 [P] [US1] Add web integration test for page load (team select, default dates, empty table until selection) in `packages/web/tests/team-deliverables/team-deliverables-search.us1.test.tsx`

### Implementation for User Story 1

- [x] T015 [US1] Implement `listTeamDeliverablesForReview(ownerUserId, reviewerUserId, startDate, endDate)` with `updated_at` filter and reviewed left-join (default `false`) in `packages/backend/src/services/deliverableService.ts`
- [x] T016 [US1] Register `GET /users/leader/team-members` with leader guard in `packages/backend/src/routes/users.ts`
- [x] T017 [US1] Register `GET /users/leader/team-deliverables` with leader guard, date validation, and subtree check in `packages/backend/src/routes/users.ts`
- [x] T018 [US1] Implement `fetchTeamMembers` and `searchTeamDeliverables` in `packages/web/src/services/teamDeliverablesApi.ts`
- [x] T019 [US1] Create `LeaderTeamDeliverablesPage.tsx` using `frontend-design` skill (person Select, start/end date inputs defaulting to last 30 days, results Table with title/description/reviewed columns, empty/loading/error states) in `packages/web/src/pages/LeaderTeamDeliverablesPage.tsx`
- [x] T020 [US1] Wire auto-search on team member selection when date range is valid in `packages/web/src/pages/LeaderTeamDeliverablesPage.tsx`
- [x] T021 [US1] Register `/app/leader/team-deliverables` route behind `LeaderRoute` in `packages/web/src/App.tsx`
- [x] T022 [US1] Add leader-only shell menu entry **Team Deliverables** pointing to `LEADER_TEAM_DELIVERABLES_ROUTE` in `packages/web/src/routes/shellOptions.ts`

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Changeable date filter with last-30-days default (Priority: P1)

**Goal**: Leader can change start/end dates; screen defaults to last 30 days; search re-runs on date change when a team member is selected.

**Independent Test**: With a team member selected, change date range to include/exclude deliverables by `updated_at`; confirm default last-30-days on load and boundary-day inclusion.

### Tests for User Story 2 (MANDATORY)

- [x] T023 [P] [US2] Add date-filter acceptance mapping notes in `tests/010-leader-team-deliverables/team-deliverables-date-filter.us2.test.md`
- [x] T024 [P] [US2] Add backend tests for inclusive date boundaries and out-of-range exclusion in `packages/backend/tests/team-deliverables/team-deliverables-date-filter.us2.test.ts`
- [x] T025 [P] [US2] Add backend test rejecting invalid range (`endDate < startDate`) with 400 in `packages/backend/tests/team-deliverables/team-deliverables-date-filter.us2.test.ts`
- [x] T026 [P] [US2] Add web test for default last-30-days inputs and auto-search on date change in `packages/web/tests/team-deliverables/team-deliverables-date-filter.us2.test.tsx`

### Implementation for User Story 2

- [x] T027 [US2] Enforce inclusive UTC day bounds for `updated_at` filtering in `packages/backend/src/services/deliverableService.ts`
- [x] T028 [US2] Return 400 with clear message for invalid date range in `packages/backend/src/routes/users.ts`
- [x] T029 [US2] Add client-side date range validation and inline error before search in `packages/web/src/pages/LeaderTeamDeliverablesPage.tsx`
- [x] T030 [US2] Trigger search when start or end date changes and team member is selected in `packages/web/src/pages/LeaderTeamDeliverablesPage.tsx`

**Checkpoint**: User Stories 1 and 2 are independently functional and testable.

---

## Phase 5: User Story 3 - Leader marks deliverables as reviewed (Priority: P2)

**Goal**: Leader toggles reviewed per row; state persists per leader–deliverable pair across sessions.

**Independent Test**: Mark deliverable reviewed, reload and search again — still reviewed for that leader; second leader sees independent state; toggle off returns to unreviewed.

### Tests for User Story 3 (MANDATORY)

- [x] T031 [P] [US3] Add reviewed acceptance mapping notes in `tests/010-leader-team-deliverables/team-deliverables-reviewed.us3.test.md`
- [x] T032 [P] [US3] Add backend tests for reviewed upsert, clear, persistence, and leader isolation in `packages/backend/tests/team-deliverables/team-deliverables-reviewed.us3.test.ts`
- [x] T033 [P] [US3] Add backend deny test for reviewed toggle without read access in `packages/backend/tests/team-deliverables/team-deliverables-reviewed.us3.test.ts`
- [x] T034 [P] [US3] Add web test for checkbox toggle with optimistic update and error rollback in `packages/web/tests/team-deliverables/team-deliverables-reviewed.us3.test.tsx`

### Implementation for User Story 3

- [x] T035 [US3] Implement `setDeliverableReviewed(deliverableId, reviewerUserId, reviewed)` in `packages/backend/src/services/deliverableReviewService.ts`
- [x] T036 [US3] Register `PUT /deliverables/:deliverableId/reviewed` with leader role and `assertCanReadDeliverables` in `packages/backend/src/routes/deliverables.ts`
- [x] T037 [US3] Implement `setDeliverableReviewed` client method in `packages/web/src/services/teamDeliverablesApi.ts`
- [x] T038 [US3] Wire reviewed checkbox toggle with optimistic UI and rollback on failure in `packages/web/src/pages/LeaderTeamDeliverablesPage.tsx`

**Checkpoint**: User Story 3 is independently functional and testable.

---

## Phase 6: User Story 4 - Restrict Team Deliverables to leaders (Priority: P2)

**Goal**: Non-leaders and unauthenticated users cannot access Team Deliverables screen or APIs; out-of-subtree search denied.

**Independent Test**: Non-leader navigates to route → denied; unauthenticated API → 401; non-leader API → 403; subtree violation → 403.

### Tests for User Story 4 (MANDATORY)

- [x] T039 [P] [US4] Add access-control acceptance mapping notes in `tests/010-leader-team-deliverables/team-deliverables-access-control.us4.test.md`
- [x] T040 [P] [US4] Add backend deny tests (401 unauthenticated, 403 non-leader) for team-members and team-deliverables in `packages/backend/tests/team-deliverables/team-deliverables-access-control.us4.test.ts`
- [x] T041 [P] [US4] Add backend deny test for out-of-subtree `userId` on team-deliverables search in `packages/backend/tests/team-deliverables/team-deliverables-access-control.us4.test.ts`
- [x] T042 [P] [US4] Add web route-guard tests (non-leader redirect, no data fetch) in `packages/web/tests/team-deliverables/team-deliverables-access-control.us4.test.tsx`

### Implementation for User Story 4

- [x] T043 [US4] Verify consistent 401/403 payloads on all team deliverables endpoints in `packages/backend/src/routes/users.ts` and `packages/backend/src/routes/deliverables.ts`
- [x] T044 [US4] Confirm `LeaderRoute` blocks non-leaders and page skips API calls when not leader in `packages/web/src/App.tsx` and `packages/web/src/pages/LeaderTeamDeliverablesPage.tsx`

**Checkpoint**: User Story 4 is independently functional and testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, DAC evidence, contract alignment, and full verification.

- [x] T045 [P] Add backend test for empty team member list when leader has no reports in `packages/backend/tests/team-deliverables/team-deliverables-empty-team.test.ts`
- [x] T046 [P] Add backend DAC test proving peers and out-of-branch users are excluded from team-members payload in `packages/backend/tests/team-deliverables/team-deliverables-dac.test.ts`
- [x] T047 Validate contract/spec/plan alignment for team deliverables endpoints in `specs/010-leader-team-deliverables/contracts/team-deliverables-api.yaml`
- [x] T048 Run full feature verification (`npm test` backend/web team-deliverables suites) and record outcomes in `specs/010-leader-team-deliverables/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **blocks all user stories**
- **User Story 1 (Phase 3)**: Depends on Foundational — **MVP**
- **User Story 2 (Phase 4)**: Depends on US1 page and search endpoint (extends date behavior)
- **User Story 3 (Phase 5)**: Depends on Foundational migration; integrates with US1 table (reviewed toggle)
- **User Story 4 (Phase 6)**: Can start after Foundational; full value when US1 routes exist
- **Polish (Phase 7)**: Depends on desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no dependency on other stories
- **US2 (P1)**: After US1 — extends filter bar and search triggers on same page
- **US3 (P2)**: After Phase 2 migration; best after US1 table exists
- **US4 (P2)**: After Phase 2; validation complete once US1–US3 endpoints exist

### Within Each User Story

- Tests written first and must **fail** before implementation
- Backend services before routes
- Routes before frontend API client usage
- Page integration last within each story

### Parallel Opportunities

- Phase 1: T002 and T003 in parallel
- Phase 2: T005, T007, T009, T010 in parallel after T004 starts
- US1 tests: T011–T014 in parallel
- US2 tests: T023–T026 in parallel
- US3 tests: T031–T034 in parallel
- US4 tests: T039–T042 in parallel
- Polish: T045 and T046 in parallel

---

## Parallel Example: User Story 1

```bash
# Tests first (parallel):
Task T012: packages/backend/tests/team-deliverables/team-deliverables-search.us1.test.ts
Task T014: packages/web/tests/team-deliverables/team-deliverables-search.us1.test.tsx

# Backend routes after service (sequential within story):
Task T015 → T016 → T017

# Frontend after API client:
Task T018 → T019 → T020 → T021 → T022
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Leader can select team member and see filtered deliverables
5. Demo if ready

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → browse team deliverables (MVP)
3. US2 → changeable date range behavior hardened
4. US3 → reviewed persistence and toggle
5. US4 → access control regression suite
6. Polish → DAC edge cases and quickstart verification

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. After Foundational:
   - Developer A: US1 + US2 (search UI and dates)
   - Developer B: US3 (reviewed backend + toggle)
   - Developer C: US4 (access control tests/guards)
3. Merge when each story's checkpoint passes independently

---

## Notes

- Every screen task uses the `frontend-design` skill with Material UI best practices
- Subtree authorization MUST use DB CTE (`leader_id`), not the test-only injectable hierarchy resolver
- Reviewed column appears in US1 (default `false`); toggle mutation ships in US3
- Run migration (`npm run db:migration:run --workspace @em-tool/backend`) after T004 before backend integration tests
- Commit after each task or logical group
