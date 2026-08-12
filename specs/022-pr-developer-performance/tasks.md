# Tasks: PR Developer Performance

**Input**: Design documents from `/specs/022-pr-developer-performance/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Mandatory. Spec requires automated coverage under `tests/022-pr-developer-performance/` plus package tests in `packages/backend/tests/022-pr-developer-performance/` and `packages/web/tests/022-pr-developer-performance/`.

**Organization**: Tasks grouped by user story. API per `contracts/team-pr-performance-api.yaml`; UI per plan structure; i18n + `frontend-design` required for web screens. No schema migration.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete work)
- **[Story]**: US1–US5 maps to spec user stories
- Include exact file paths in every task

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Feature scaffolds, i18n placeholders, and shared test folders.

- [x] T001 Create feature test doc stubs under `tests/022-pr-developer-performance/` (`screen-access.us1.test.md`, `filters.us2.test.md`, `summaries-comparison.us3.test.md`, `detail-table.us4.test.md`, `chart-prs-by-classification.us5.test.md`) aligned with spec US1–US5
- [x] T002 [P] Create backend test directory scaffold in `packages/backend/tests/022-pr-developer-performance/` (reuse patterns from `packages/backend/tests/leader-analytics/` and `packages/backend/tests/020-user-pr-activity/`)
- [x] T003 [P] Create web test directory scaffold in `packages/web/tests/022-pr-developer-performance/`
- [x] T004 [P] Add `menu.teamPrPerformance` keys to `packages/web/src/locales/en-US/shell.json` and `packages/web/src/locales/pt-BR/shell.json`
- [x] T005 [P] Add placeholder `teamPrPerformance` section keys (title, loading, errors, empty) to `packages/web/src/locales/en-US/leader.json` and `packages/web/src/locales/pt-BR/leader.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Leader-only aggregate API all stories consume. No schema migration.

**⚠️ CRITICAL**: No user story UI that depends on live team PR performance data starts until this phase is complete.

- [x] T006 Add DTO types for Team PR Performance response (`PerformanceTotals`, `DeveloperPrPerformanceRow`, `WeeklyClassificationBucketRow`, `TeamPrPerformanceResponse`) in `packages/backend/src/types/leaderPrPerformance.ts` per `specs/022-pr-developer-performance/contracts/team-pr-performance-api.yaml` and `data-model.md`
- [x] T007 Implement `getLeaderTeamPrPerformance(actorUserId, { startDate, endDate, userId? })` in `packages/backend/src/services/leaderPrPerformanceService.ts`: resolve descendants via `fetchLeaderDescendantRows` / optional `assertUserInLeaderSubtree`; `validateDateRange` on `merged_at`; aggregate authored/comment/review totals and per-developer rows (displayName = fullName || email; zeros for missing githubLogin); exclude actor; join via case-insensitive `github_login`
- [x] T008 Extend `getLeaderTeamPrPerformance` in `packages/backend/src/services/leaderPrPerformanceService.ts` to return `weekStarts[]` and `authoredByWeekAndClassification` (authored only; effective class = `user_reclassification` ?? `classification_type` ?? `unclassified`; zero-fill weeks/series keys)
- [x] T009 Register `GET /users/leader/team-pr-performance` (leader role guard, date query validation, optional `userId`) in `packages/backend/src/routes/users.ts`
- [x] T010 [P] Add backend foundational tests for date validation (400), unauthenticated (401), non-leader (403), out-of-subtree `userId` (403) in `packages/backend/tests/022-pr-developer-performance/team-pr-performance-validation.test.ts`
- [x] T011 [P] Add backend foundational tests for subtree vs filtered aggregates, actor exclusion, peer/superior denial, and empty descendants in `packages/backend/tests/022-pr-developer-performance/team-pr-performance-dac.test.ts`

**Checkpoint**: `GET /users/leader/team-pr-performance` returns leader-scoped aggregates with DAC and date validation covered.

---

## Phase 3: User Story 1 - Open team PR performance screen (Priority: P1) 🎯 MVP

**Goal**: Leaders open **Team PR Performance** from the Leader menu, land on `/app/leader/team-pr-performance` with default last-60-days subtree load; non-leaders are denied.

**Independent Test**: Menu visible for leaders only; route loads with default 60-day range and no member selected; non-leader menu/route denied; empty subtree shows guidance without fabricated metrics.

### Tests for User Story 1 (MANDATORY)

- [x] T012 [P] [US1] Add web tests for leader menu visibility, `LeaderRoute` denial for non-leaders, default 60-day load, and empty-subtree guidance in `packages/web/tests/022-pr-developer-performance/screen-access.us1.test.tsx`
- [x] T013 [P] [US1] Add i18n key-parity / no hard-coded copy smoke for shell menu + page shell strings in `packages/web/tests/022-pr-developer-performance/i18n-parity.us1.test.ts`

### Implementation for User Story 1

- [x] T014 [P] [US1] Add `LEADER_TEAM_PR_PERFORMANCE_ROUTE` and Leader-menu entry in `packages/web/src/routes/shellOptions.ts`
- [x] T015 [P] [US1] Add `fetchTeamPrPerformance` client in `packages/web/src/services/leaderPrPerformanceApi.ts`
- [x] T016 [US1] Create initial `LeaderTeamPrPerformancePage` in `packages/web/src/pages/LeaderTeamPrPerformancePage.tsx` using `frontend-design` skill + Material UI (responsive breakpoints, accessible headings, clear hierarchy): title, default `defaultLast60DayRange()` fetch, loading/error/empty states; all copy via `leader` / `common` i18n
- [x] T017 [US1] Register protected leader route `/app/leader/team-pr-performance` in `packages/web/src/App.tsx`
- [x] T018 [US1] Expand `packages/web/src/locales/{en-US,pt-BR}/leader.json` `teamPrPerformance` keys for US1 strings (title, subtitle, loading, errors, empty team)

**Checkpoint**: MVP — leader can open Team PR Performance and see default-period subtree shell (or empty guidance).

---

## Phase 4: User Story 2 - Filter by period and optional team member (Priority: P1)

**Goal**: Period and optional hierarchical team member filters refresh all widgets consistently; invalid ranges blocked; clearing member restores subtree-wide view.

**Independent Test**: Selecting/clearing a descendant updates fetch `userId`; changing dates refetches; end-before-start shows validation and keeps prior valid results; empty filtered results show empty states without errors.

### Tests for User Story 2 (MANDATORY)

- [ ] T019 [P] [US2] Add backend tests that optional `userId` scopes aggregates and clearing conceptually maps to omitted param in `packages/backend/tests/022-pr-developer-performance/team-pr-performance-filters.us2.test.ts`
- [ ] T020 [P] [US2] Add web UI tests for default 60-day range, member select/clear, invalid date range, and empty filtered results in `packages/web/tests/022-pr-developer-performance/filters.us2.test.tsx`

### Implementation for User Story 2

- [ ] T021 [US2] Create `TeamPrPerformanceFilters` in `packages/web/src/components/leader-pr-performance/TeamPrPerformanceFilters.tsx` using `frontend-design` + MUI: date range + reuse `TeamMemberHierarchyPicker` + `fetchLeaderHierarchyView` (descendants only, exclude self); validation messaging via i18n
- [ ] T022 [US2] Wire filters into `packages/web/src/pages/LeaderTeamPrPerformancePage.tsx` so period/`userId` changes refetch `fetchTeamPrPerformance` without a separate search button; abort in-flight requests on change
- [ ] T023 [US2] Add filter-related keys to `packages/web/src/locales/{en-US,pt-BR}/leader.json` (reuse `leader.picker.*` / `common.validation.endDateBeforeStart` where applicable)

**Checkpoint**: Filters drive a single consistent performance payload for all widgets.

---

## Phase 5: User Story 3 - Summaries and per-developer comparison (Priority: P1)

**Goal**: Show team (or selected-member) totals for authored PRs, comments, and reviews plus a per-developer comparison visualization from the aggregate payload.

**Independent Test**: Totals match sum of developer rows; comparison attributes metrics to correct developers; member filter scopes to one person; zero-activity descendants visible as zeros; email fallback when no display name.

### Tests for User Story 3 (MANDATORY)

- [ ] T024 [P] [US3] Add backend tests for authored/comment/review totals and per-developer attribution (including author+commenter double-count rules) in `packages/backend/tests/022-pr-developer-performance/summaries-comparison.us3.test.ts`
- [ ] T025 [P] [US3] Add web UI tests that cards/comparison refresh with filters and show zeros/empty correctly in `packages/web/tests/022-pr-developer-performance/summaries-comparison.us3.test.tsx`

### Implementation for User Story 3

- [ ] T026 [P] [US3] Create `TeamPrPerformanceSummaryCards` in `packages/web/src/components/leader-pr-performance/TeamPrPerformanceSummaryCards.tsx` using `frontend-design` + MUI Cards (authored / comments / reviews)
- [ ] T027 [P] [US3] Create `DeveloperPrComparisonChart` in `packages/web/src/components/leader-pr-performance/DeveloperPrComparisonChart.tsx` using `frontend-design` + `@mui/x-charts` (accessible legend; email fallback labels)
- [ ] T028 [US3] Wire summary cards + comparison chart into `packages/web/src/pages/LeaderTeamPrPerformancePage.tsx` from aggregate response `totals` / `developers`
- [ ] T029 [US3] Add summary/comparison i18n keys to `packages/web/src/locales/{en-US,pt-BR}/leader.json`

**Checkpoint**: Leaders can compare developer PR volume signals at a glance under current filters.

---

## Phase 6: User Story 5 - Weekly authored PRs by classification chart (Priority: P1)

**Goal**: Stacked weekly chart of authored PRs by effective classification (feature/fix/documentation/maintenance/**unclassified**); team-wide when unfiltered, single member when filtered.

**Independent Test**: Authored-only series; Unclassified included so week segment sum equals authored count; empty weeks zero; filters refresh chart; effective class prefers user reclassification.

### Tests for User Story 5 (MANDATORY)

- [ ] T030 [P] [US5] Add backend tests for weekly classification bucketing, Unclassified, effective classification precedence, and team vs member scope in `packages/backend/tests/022-pr-developer-performance/chart-prs-by-classification.us5.test.ts`
- [ ] T031 [P] [US5] Add web UI tests for stacked weekly chart refresh, Unclassified legend, and filter scoping in `packages/web/tests/022-pr-developer-performance/chart-prs-by-classification.us5.test.tsx`

### Implementation for User Story 5

- [ ] T032 [US5] Create `WeeklyAuthoredByClassificationChart` in `packages/web/src/components/leader-pr-performance/WeeklyAuthoredByClassificationChart.tsx` using `frontend-design` + `@mui/x-charts` stacked bars from `weekStarts` + `authoredByWeekAndClassification` (zero-fill client-side if needed)
- [ ] T033 [US5] Wire weekly classification chart into `packages/web/src/pages/LeaderTeamPrPerformancePage.tsx` so it refreshes with the same filters as cards/comparison
- [ ] T034 [US5] Add classification chart + Unclassified legend keys to `packages/web/src/locales/{en-US,pt-BR}/leader.json`

**Checkpoint**: Leaders see weekly authored mix by classification for team or selected member.

---

## Phase 7: User Story 4 - Per-developer detail table and drill-down (Priority: P2)

**Goal**: Data table of developers with authored/comment/review counts; row opens modal listing contributing PRs for that developer in the current period.

**Independent Test**: Table columns and default sort (authored desc, displayName asc); member filter shows one row; drill-down only for subtree member; DAC deny for peers/superiors on drill-down API.

### Tests for User Story 4 (MANDATORY)

- [ ] T035 [P] [US4] Add backend tests for drill-down involvement (owner/involved), subtree DAC, date bounds, and newest-first order in `packages/backend/tests/022-pr-developer-performance/detail-table.us4.test.ts`
- [ ] T036 [P] [US4] Add web UI tests for table columns/sort, member filter, modal open/close preserving filters in `packages/web/tests/022-pr-developer-performance/detail-table.us4.test.tsx`

### Implementation for User Story 4

- [ ] T037 [P] [US4] Add drill-down DTOs and `getLeaderDeveloperPrDrilldown` in `packages/backend/src/types/leaderPrPerformance.ts` + `packages/backend/src/services/leaderPrPerformanceService.ts` (author OR comment OR review; effectiveClassification; involvementRole)
- [ ] T038 [US4] Register `GET /users/leader/team-pr-performance/developers/:userId/pull-requests` in `packages/backend/src/routes/users.ts`
- [ ] T039 [P] [US4] Add `fetchDeveloperPrDrilldown` in `packages/web/src/services/leaderPrPerformanceApi.ts`
- [ ] T040 [P] [US4] Create `DeveloperPrPerformanceTable` in `packages/web/src/components/leader-pr-performance/DeveloperPrPerformanceTable.tsx` using `frontend-design` + MUI Table (pagination if needed)
- [ ] T041 [US4] Create `DeveloperPrDrilldownModal` in `packages/web/src/components/leader-pr-performance/DeveloperPrDrilldownModal.tsx` using `frontend-design` + MUI Dialog; dismissible without losing filters
- [ ] T042 [US4] Wire table + modal into `packages/web/src/pages/LeaderTeamPrPerformancePage.tsx`
- [ ] T043 [US4] Add table/modal i18n keys to `packages/web/src/locales/{en-US,pt-BR}/leader.json`

**Checkpoint**: Leaders can inspect per-developer metrics and contributing PRs under DAC.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Hardening across stories.

- [ ] T044 [P] Expand feature test docs under `tests/022-pr-developer-performance/` with acceptance mapping to FR-001–FR-018 and DAC evidence notes
- [ ] T045 [P] Verify `en-US`/`pt-BR` key parity for all `teamPrPerformance` / `menu.teamPrPerformance` keys in `packages/web/tests/022-pr-developer-performance/i18n-parity.us1.test.ts` (extend as needed)
- [ ] T046 Run quickstart validation from `specs/022-pr-developer-performance/quickstart.md` (manual leader/non-leader + Unclassified week-sum checks) and fix gaps
- [ ] T047 [P] Confirm no new migrations introduced; lint/test packages for `022-pr-developer-performance` paths pass (`npm run lint`, targeted vitest)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories that need live aggregate data
- **US1 (Phase 3)**: After Foundational — MVP shell
- **US2 (Phase 4)**: After US1 page exists (filters wire into page)
- **US3 (Phase 5)**: After US2 (shared filter context)
- **US5 (Phase 6)**: After US2 (chart uses same filters; backend week series already in Foundational T008)
- **US4 (Phase 7)**: After US2/US3 data on page; drill-down API can start after Foundational
- **Polish (Phase 8)**: After desired stories complete

### User Story Dependencies

- **US1 (P1)**: After Foundational — no dependency on other stories
- **US2 (P1)**: Builds on US1 page shell
- **US3 (P1)**: Builds on US2 filter-driven payload
- **US5 (P1)**: Builds on US2; independent of US3 UI widgets
- **US4 (P2)**: Builds on filter context; drill-down service independent of chart UI

### Within Each User Story

- Tests written to fail before / alongside implementation
- Components before page wiring when marked [P]
- Story complete before moving to next priority when staffing is serial

### Parallel Opportunities

- T002–T005 in Setup
- T010–T011 foundational tests after T009
- T012–T015 in US1
- T019–T020 in US2
- T024–T027 in US3
- T030–T031 in US5
- T035–T036, T037/T039/T040 in US4
- After Foundational: US3 chart cards and US5 weekly chart can proceed in parallel once US2 filters exist
- T044–T045, T047 in Polish

---

## Parallel Example: User Story 3

```bash
# Tests in parallel:
Task: "Backend summaries tests in packages/backend/tests/022-pr-developer-performance/summaries-comparison.us3.test.ts"
Task: "Web summaries UI tests in packages/web/tests/022-pr-developer-performance/summaries-comparison.us3.test.tsx"

# Components in parallel:
Task: "TeamPrPerformanceSummaryCards in packages/web/src/components/leader-pr-performance/TeamPrPerformanceSummaryCards.tsx"
Task: "DeveloperPrComparisonChart in packages/web/src/components/leader-pr-performance/DeveloperPrComparisonChart.tsx"
```

---

## Parallel Example: User Story 5

```bash
# Tests in parallel:
Task: "Backend classification chart tests in packages/backend/tests/022-pr-developer-performance/chart-prs-by-classification.us5.test.ts"
Task: "Web classification chart UI tests in packages/web/tests/022-pr-developer-performance/chart-prs-by-classification.us5.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational API + DAC
3. Complete Phase 3: US1 menu/route/page shell
4. **STOP and VALIDATE**: Leader can open the screen with default 60-day subtree load

### Incremental Delivery

1. Setup + Foundational → API ready
2. US1 → MVP navigation + default load
3. US2 → Filters
4. US3 → Cards + comparison
5. US5 → Weekly classification chart (Unclassified)
6. US4 → Table + drill-down
7. Polish → quickstart + i18n parity

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. After US2:
   - Developer A: US3 summaries/comparison
   - Developer B: US5 weekly classification chart
   - Developer C: US4 table + drill-down API/UI

---

## Notes

- [P] tasks = different files, no incomplete-task dependencies
- No new DB migrations; read-only over imported PR tables
- Reuse `validateDateRange`, `fetchLeaderDescendantRows`, `assertUserInLeaderSubtree`, `TeamMemberHierarchyPicker`, `defaultLast60DayRange`, `@mui/x-charts`
- Effective classification + Unclassified are non-negotiable (clarify session)
- Every web UI task: `frontend-design` skill + Material UI a11y/responsive + dual-locale i18n
- Commit after each task or logical group; stop at checkpoints to validate independently
