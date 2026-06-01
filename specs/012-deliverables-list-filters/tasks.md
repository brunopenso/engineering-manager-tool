# Tasks: Deliverables Portfolio Filters

**Input**: Design documents from `/specs/012-deliverables-list-filters/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are MANDATORY for this feature. Every user story and requirement must include automated test coverage before merge.

**Organization**: Tasks are grouped by user story. **Backend filtering** and **default last-30-day** range apply throughout (see spec Clarifications 2026-06-01).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Feature test scaffolding and directories.

- [ ] T001 Verify acceptance test plan files exist in `tests/012-deliverables-list-filters/` (`deliverables-filters-date.us1.test.md`, `deliverables-filters-impact.us2.test.md`, `deliverables-filters-tags.us3.test.md`, `deliverables-filters-combined.us4.test.md`)
- [ ] T002 [P] Create backend test file scaffold `packages/backend/tests/deliverables/deliverables-list-filters.setup.ts` (reuse patterns from `packages/backend/tests/deliverables/` existing setup)
- [ ] T003 [P] Create web test directory `packages/web/tests/deliverables-portfolio-filters/` with shared render/auth helpers aligned to `packages/web/tests/team-deliverables/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Server-side list filtering contract, shared date utilities, and API client — required before any user story UI work.

**⚠️ CRITICAL**: No user story work starts until this phase is complete.

- [ ] T004 Add `DeliverableListFilters` type (`startDate`, `endDate`, `businessImpacts?`, `systemTagIds?`) in `packages/backend/src/types/deliverableListFilters.ts`
- [ ] T005 Implement `listDeliverablesForOwner(ownerUserId, filters)` with `created_at` UTC inclusive bounds via `validateDateRange` from `packages/backend/src/services/teamDeliverablesDate.ts` and **default last-30-day range** when dates omitted in `packages/backend/src/services/deliverableService.ts`
- [ ] T006 Add `createdAt` to `DeliverableSummaryDto` and `mapDeliverableSummary()` in `packages/backend/src/services/deliverableService.ts`
- [ ] T007 Parse `startDate`/`endDate` query params on `GET /deliverables`, return `400` when `endDate < startDate`, in `packages/backend/src/routes/deliverables.ts`
- [ ] T008 [P] Create `packages/web/src/utils/dateRange.ts` with `formatDateInput`, `defaultLast30DayRange`, `isValidDateRange`; update `packages/web/src/services/teamDeliverablesApi.ts` to re-export from `dateRange.ts`
- [ ] T009 [P] Extend `listMyDeliverables(accessToken, filters)` to append query parameters in `packages/web/src/services/deliverablesApi.ts`
- [ ] T010 [P] Add `createdAt` to `DeliverableSummary` type in `packages/web/src/services/deliverablesApi.ts`

**Checkpoint**: `GET /deliverables?startDate&endDate` returns owner rows filtered by `created_at`; client can call with explicit dates.

---

## Phase 3: User Story 1 - Creation date filter with last-30-day default (Priority: P1) 🎯 MVP

**Goal**: Collaborator opens `/app/deliverables` with last-30-day dates pre-filled; backend returns only deliverables created in that range; changing valid dates refetches; invalid range blocked.

**Independent Test**: Load page → network request includes last-30-day params → table shows only in-range items; change dates → new request; `end < start` → error, no misleading list.

### Tests for User Story 1 (MANDATORY)

- [ ] T011 [P] [US1] Align acceptance scenarios in `tests/012-deliverables-list-filters/deliverables-filters-date.us1.test.md` with `specs/012-deliverables-list-filters/contracts/deliverables-list-filters-api.yaml`
- [ ] T012 [P] [US1] Add backend test for default last-30-day `created_at` filtering in `packages/backend/tests/deliverables/deliverables-list-filters-date.us1.test.ts`
- [ ] T013 [P] [US1] Add backend test for inclusive boundary days and out-of-range exclusion in `packages/backend/tests/deliverables/deliverables-list-filters-date.us1.test.ts`
- [ ] T014 [P] [US1] Add backend test returning `400` when `endDate < startDate` in `packages/backend/tests/deliverables/deliverables-list-filters-date.us1.test.ts`
- [ ] T015 [P] [US1] Add web test for default date inputs and initial fetch query params in `packages/web/tests/deliverables-portfolio-filters/deliverables-filters-date.us1.test.tsx`
- [ ] T016 [P] [US1] Add web test blocking fetch / showing error on invalid date range in `packages/web/tests/deliverables-portfolio-filters/deliverables-filters-date.us1.test.tsx`

### Implementation for User Story 1

- [ ] T017 [US1] Add filter `Paper` with start/end `TextField type="date"` defaulting to `defaultLast30DayRange()` using `frontend-design` skill in `packages/web/src/pages/DeliverablesPage.tsx`
- [ ] T018 [US1] Wire `useEffect` to call `listMyDeliverables` with date query params on mount and when dates change (valid range only) in `packages/web/src/pages/DeliverablesPage.tsx`
- [ ] T019 [US1] Show inline `dateRangeError` when `!isValidDateRange(startDate, endDate)` in `packages/web/src/pages/DeliverablesPage.tsx`
- [ ] T020 [US1] Update existing `packages/backend/tests/deliverables/deliverables-list.us2.test.ts` to expect `createdAt` on summary items and accept date query params

**Checkpoint**: User Story 1 independently functional — date-filtered portfolio with 30-day default.

---

## Phase 4: User Story 2 - Business impact filter (Priority: P1)

**Goal**: Collaborator multi-selects impact levels; backend returns OR union within active date window; empty selection omits impact filter.

**Independent Test**: With date range set, select High only → only High rows; select Medium+High → union; clear impact → all impacts in date range return.

### Tests for User Story 2 (MANDATORY)

- [ ] T021 [P] [US2] Update acceptance notes in `tests/012-deliverables-list-filters/deliverables-filters-impact.us2.test.md`
- [ ] T022 [P] [US2] Add backend tests for single and multiple `businessImpact` query params (OR) in `packages/backend/tests/deliverables/deliverables-list-filters-impact.us2.test.ts`
- [ ] T023 [P] [US2] Add backend test that omitted impact param does not filter by impact in `packages/backend/tests/deliverables/deliverables-list-filters-impact.us2.test.ts`
- [ ] T024 [P] [US2] Add web test for impact multi-select refetch in `packages/web/tests/deliverables-portfolio-filters/deliverables-filters-impact.us2.test.tsx`

### Implementation for User Story 2

- [ ] T025 [US2] Parse repeatable `businessImpact` query param and validate enum values in `packages/backend/src/routes/deliverables.ts`
- [ ] T026 [US2] Apply `business_impact IN (...)` when impacts provided in `packages/backend/src/services/deliverableService.ts`
- [ ] T027 [US2] Add impact multi-select `FormControl`/`Select multiple` to filter bar in `packages/web/src/pages/DeliverablesPage.tsx` using `frontend-design` skill
- [ ] T028 [US2] Include `businessImpact` query params in `listMyDeliverables` calls when selection non-empty in `packages/web/src/pages/DeliverablesPage.tsx`

**Checkpoint**: User Stories 1 and 2 work together (date AND impact on server).

---

## Phase 5: User Story 3 - System tags filter (Priority: P1)

**Goal**: Collaborator multi-selects catalog tags; backend returns deliverables with at least one selected tag (OR) within date window; invalid tag ids rejected.

**Independent Test**: Select one tag → matching rows only; select two tags → union; no tags selected → no tag dimension filter.

### Tests for User Story 3 (MANDATORY)

- [ ] T029 [P] [US3] Update acceptance notes in `tests/012-deliverables-list-filters/deliverables-filters-tags.us3.test.md`
- [ ] T030 [P] [US3] Add backend tests for `systemTagIds` OR filter and AND with date in `packages/backend/tests/deliverables/deliverables-list-filters-tags.us3.test.ts`
- [ ] T031 [P] [US3] Add backend test returning `400` for unknown `systemTagIds` in `packages/backend/tests/deliverables/deliverables-list-filters-tags.us3.test.ts`
- [ ] T032 [P] [US3] Add web test for tag multi-select options from catalog in `packages/web/tests/deliverables-portfolio-filters/deliverables-filters-tags.us3.test.tsx`

### Implementation for User Story 3

- [ ] T033 [US3] Parse repeatable `systemTagIds` query param; validate against tag catalog; return `400` on invalid ids in `packages/backend/src/routes/deliverables.ts`
- [ ] T034 [US3] Apply tag join / `IN` filter with OR semantics when `systemTagIds` provided in `packages/backend/src/services/deliverableService.ts`
- [ ] T035 [US3] Load `fetchTagCatalog` on mount and add tag multi-select with colored chips in `packages/web/src/pages/DeliverablesPage.tsx` using `frontend-design` skill
- [ ] T036 [US3] Include `systemTagIds` in list API calls when selection non-empty in `packages/web/src/pages/DeliverablesPage.tsx`

**Checkpoint**: User Stories 1–3 independently testable with full server-side AND across dimensions.

---

## Phase 6: User Story 4 - Combined filters and reset (Priority: P2)

**Goal**: All filters work together; distinct empty states; **Clear all filters** resets to last 30 days and clears impact/tags; delete refresh respects active filters.

**Independent Test**: Apply date+impact+tag → AND on server; zero results → filtered empty message; Clear all → 30-day default query; delete row → refetch with same params.

### Tests for User Story 4 (MANDATORY)

- [ ] T037 [P] [US4] Update acceptance notes in `tests/012-deliverables-list-filters/deliverables-filters-combined.us4.test.md`
- [ ] T038 [P] [US4] Add backend integration test for date+impact+tags AND combination in `packages/backend/tests/deliverables/deliverables-list-filters-combined.us4.test.ts`
- [ ] T039 [P] [US4] Add web test for filtered empty vs portfolio-empty messaging in `packages/web/tests/deliverables-portfolio-filters/deliverables-filters-combined.us4.test.tsx`
- [ ] T040 [P] [US4] Add web test that **Clear all filters** resets dates to `defaultLast30DayRange()` and clears impact/tags in `packages/web/tests/deliverables-portfolio-filters/deliverables-filters-combined.us4.test.tsx`

### Implementation for User Story 4

- [ ] T041 [US4] Implement **Clear all filters** button (visible when any filter differs from default) resetting last-30-day dates and clearing impact/tag selections in `packages/web/src/pages/DeliverablesPage.tsx`
- [ ] T042 [US4] Distinguish **no deliverables yet** vs **no deliverables match your filters** empty states in `packages/web/src/pages/DeliverablesPage.tsx`
- [ ] T043 [US4] Ensure `handleDelete` / `refreshData` passes current filter params to `listMyDeliverables` in `packages/web/src/pages/DeliverablesPage.tsx`
- [ ] T044 [US4] Abort in-flight list requests on filter change (request id pattern) in `packages/web/src/pages/DeliverablesPage.tsx`

**Checkpoint**: Full filter bar complete per spec FR-001–FR-012.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Contract alignment, DAC regression, documentation.

- [ ] T045 [P] Merge `GET /deliverables` query parameters and `createdAt` on `DeliverableSummary` into `specs/006-collaborator-deliverables/contracts/deliverables-api.yaml` per `specs/012-deliverables-list-filters/contracts/deliverables-list-filters-api.yaml`
- [ ] T046 [P] Regression test: `GET /deliverables` still owner-only; peer cannot list another user's portfolio in `packages/backend/tests/deliverables/deliverables-list-peer-deny.us2.test.ts`
- [ ] T047 Run `npm run test` and `npm run lint` from repo root; fix failures in deliverables-list-filters suites
- [ ] T048 Record verification steps and outcomes in `specs/012-deliverables-list-filters/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** → **Phase 2** (blocking) → **Phases 3–6** (US1 → US2 → US3 → US4 recommended sequential) → **Phase 7**

### User Story Dependencies

| Story | Depends on | Notes |
|-------|------------|-------|
| US1 (P1) | Phase 2 | MVP: dates + 30-day default |
| US2 (P1) | US1 + Phase 2 | Adds impact query + UI |
| US3 (P1) | US1 + Phase 2 | Adds tag query + UI |
| US4 (P2) | US1–US3 | Clear all + empty states |

### Parallel Opportunities

- T002 and T003 (setup)
- T008, T009, T010 (foundational web utils + API types)
- All test tasks marked `[P]` within a story phase
- T045 and T046 (polish) in parallel

### Parallel Example: User Story 1 tests

```bash
# Run together after Phase 2:
T012  # backend default 30d
T013  # backend boundaries
T014  # backend 400 invalid range
T015  # web default load
T016  # web invalid range UX
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1–2
2. Complete Phase 3 (US1)
3. **STOP and VALIDATE**: last-30-day default load, date change refetch, invalid range handling

### Incremental Delivery

1. US1 → date filter MVP
2. US2 → impact
3. US3 → tags
4. US4 → clear all + empty states
5. Phase 7 → contract + full suite

---

## Notes

- Do **not** implement client-side filtering of a full portfolio download (see spec Clarifications).
- Reuse `teamDeliverablesDate.ts` for server `created_at` bounds (not `updated_at`).
- `DeliverablesPage.tsx` filter UI must use `frontend-design` skill + Material UI.
- Task count: **48** total (**US1**: 10, **US2**: 8, **US3**: 8, **US4**: 8, Setup 3, Foundational 7, Polish 4)
