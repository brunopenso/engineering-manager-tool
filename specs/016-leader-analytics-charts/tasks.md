# Tasks: Leader Analytics Charts

**Input**: Design documents from `/specs/016-leader-analytics-charts/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are MANDATORY for this feature. Every user story and requirement must include automated test coverage before merge.

**Organization**: Tasks are grouped by user story to allow independent implementation and validation.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependencies, test directories, and acceptance test plan files.

- [x] T001 Create feature acceptance test plan files in `tests/016-leader-analytics-charts/` (`analytics-access.us1.test.md`, `analytics-filters.us2.test.md`, `chart-deliverables-by-impact.us3.test.md`, `chart-engagement-by-user.us4.test.md`, `chart-pending-review.us5.test.md`, `widget-layout.us6.test.md`)
- [x] T002 Create backend test bootstrap in `packages/backend/tests/leader-analytics/leader-analytics.setup.ts`
- [x] T003 [P] Create web test bootstrap in `packages/web/tests/leader-analytics/leader-analytics.setup.test.tsx`
- [x] T004 Add `@mui/x-charts`, `react-grid-layout`, and `@types/react-grid-layout` (dev) to `packages/web/package.json` using latest stable versions compatible with `@mui/material` ^6.4; run `npm install` from repository root

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Analytics DTOs, aggregation service, API route, web client, date helper, and route constant required by all user stories.

**⚠️ CRITICAL**: No user story work starts until this phase is complete.

- [x] T005 [P] Define leader analytics DTO types in `packages/backend/src/types/leaderAnalytics.ts` matching `specs/016-leader-analytics-charts/contracts/team-analytics-api.yaml`
- [x] T006 Implement `getLeaderTeamAnalytics(actorUserId, { startDate, endDate, userId? })` with `created_at` UTC bounds, `date_trunc('week', ...)` aggregations, `weekStarts[]`, impact buckets, engagement buckets, and `pendingReviewCount` in `packages/backend/src/services/leaderAnalyticsService.ts`
- [x] T007 Register `GET /users/leader/team-analytics` with leader guard, `validateDateRange`, and optional `assertUserInLeaderSubtree` in `packages/backend/src/routes/users.ts`
- [x] T008 [P] Implement `fetchTeamAnalytics` and error typing in `packages/web/src/services/leaderAnalyticsApi.ts`
- [x] T009 [P] Add `defaultLast60DayRange()` and re-export date helpers from `packages/web/src/utils/dateRange.ts` via `packages/web/src/services/leaderAnalyticsApi.ts`
- [x] T010 [P] Add `LEADER_TEAM_ANALYTICS_ROUTE` constant in `packages/web/src/routes/shellOptions.ts`
- [x] T011 [P] Add backend foundation tests (401 unauthenticated, 403 non-leader, 400 invalid range, 403 out-of-subtree `userId`) in `packages/backend/tests/leader-analytics/leader-analytics-foundation.test.ts`

**Checkpoint**: Foundation complete — user stories can proceed.

---

## Phase 3: User Story 1 - Leader opens analytics dashboard (Priority: P1) 🎯 MVP

**Goal**: Leader sees **Team Analytics** in the Leader menu, opens the page with default last-60-day range, and loads aggregated analytics for the full subtree (all three metrics from one API call).

**Independent Test**: Log in as leader → Leader → Team Analytics; page loads with default dates; API returns data; non-leader denied route and API.

### Tests for User Story 1 (MANDATORY)

- [x] T012 [P] [US1] Align acceptance scenarios with contract in `tests/016-leader-analytics-charts/analytics-access.us1.test.md` and `specs/016-leader-analytics-charts/contracts/team-analytics-api.yaml`
- [x] T013 [P] [US1] Add backend allow/deny tests for `GET /users/leader/team-analytics` in `packages/backend/tests/leader-analytics/analytics-access.us1.test.ts`
- [x] T014 [P] [US1] Add web tests for leader menu visibility, route guard, and initial fetch with 60-day default in `packages/web/tests/leader-analytics/analytics-access.us1.test.tsx`

### Implementation for User Story 1

- [x] T015 [US1] Create `LeaderTeamAnalyticsPage.tsx` using `frontend-design` skill (page title, filter bar placeholder, loading/error/empty states, mount fetch with `defaultLast60DayRange`) in `packages/web/src/pages/LeaderTeamAnalyticsPage.tsx`
- [x] T016 [US1] Register `/app/leader/team-analytics` behind `LeaderRoute` in `packages/web/src/App.tsx`
- [x] T017 [US1] Add leader-only shell menu entry **Team Analytics** pointing to `LEADER_TEAM_ANALYTICS_ROUTE` in `packages/web/src/routes/shellOptions.ts`
- [x] T018 [US1] Render provisional summary placeholders for impact, engagement, and pending review counts from API payload in `packages/web/src/pages/LeaderTeamAnalyticsPage.tsx`

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Optional filters refine all charts (Priority: P1)

**Goal**: Leader optionally selects a team member (hierarchy picker) and changes dates; all widgets refresh together; invalid ranges blocked.

**Independent Test**: Change member and dates → single refetch updates all widgets; clear member restores subtree scope; end before start shows validation without fetch.

### Tests for User Story 2 (MANDATORY)

- [x] T019 [P] [US2] Add filter acceptance mapping notes in `tests/016-leader-analytics-charts/analytics-filters.us2.test.md`
- [x] T020 [P] [US2] Add backend tests for optional `userId`, `created_at` inclusion/exclusion, and subtree-only owners in `packages/backend/tests/leader-analytics/analytics-filters.us2.test.ts`
- [x] T021 [P] [US2] Add web tests for picker refresh, date change refresh, and invalid range guard in `packages/web/tests/leader-analytics/analytics-filters.us2.test.tsx`

### Implementation for User Story 2

- [x] T022 [US2] Load hierarchy via `fetchLeaderHierarchyView` and wire `TeamMemberHierarchyPicker` (optional selection) in `packages/web/src/pages/LeaderTeamAnalyticsPage.tsx`
- [x] T023 [US2] Add start/end date inputs defaulting to `defaultLast60DayRange()` in `packages/web/src/pages/LeaderTeamAnalyticsPage.tsx`
- [x] T024 [US2] Implement auto-refresh on valid filter change with in-flight abort (`searchRequestId` pattern) in `packages/web/src/pages/LeaderTeamAnalyticsPage.tsx`
- [x] T025 [US2] Block fetch and show inline warning when `endDate < startDate` in `packages/web/src/pages/LeaderTeamAnalyticsPage.tsx`

**Checkpoint**: User Stories 1 and 2 are independently functional and testable.

---

## Phase 5: User Story 3 - Deliverables added per week by business impact (Priority: P1)

**Goal**: Stacked weekly bar chart shows deliverable adds per calendar week segmented by four business impact levels.

**Independent Test**: Seed deliverables in same/different weeks and impacts; chart shows correct stacked counts and zero weeks in range.

### Tests for User Story 3 (MANDATORY)

- [x] T026 [P] [US3] Add impact chart acceptance mapping in `tests/016-leader-analytics-charts/chart-deliverables-by-impact.us3.test.md`
- [x] T027 [P] [US3] Add backend tests for weekly impact aggregation and member filter scope in `packages/backend/tests/leader-analytics/chart-deliverables-by-impact.us3.test.ts`
- [x] T028 [P] [US3] Add web test for stacked chart series/labels from `weekStarts` in `packages/web/tests/leader-analytics/chart-deliverables-by-impact.us3.test.tsx`

### Implementation for User Story 3

- [x] T029 [US3] Create `DeliverablesByImpactChart.tsx` with MUI X stacked `BarChart` (four impact series, chronological weeks) using `frontend-design` skill in `packages/web/src/components/leader-analytics/DeliverablesByImpactChart.tsx`
- [x] T030 [US3] Replace impact placeholder with `DeliverablesByImpactChart` and zero-fill sparse buckets in `packages/web/src/pages/LeaderTeamAnalyticsPage.tsx`

**Checkpoint**: User Story 3 is independently functional and testable.

---

## Phase 6: User Story 4 - Engagement: new deliverables per week per person (Priority: P2)

**Goal**: Grouped weekly chart compares per-member add counts; single-member filter shows one series.

**Independent Test**: Two reports with adds in same week show separate counts; inactive weeks show zero; filtered view shows one member only.

### Tests for User Story 4 (MANDATORY)

- [x] T031 [P] [US4] Add engagement acceptance mapping in `tests/016-leader-analytics-charts/chart-engagement-by-user.us4.test.md`
- [x] T032 [P] [US4] Add backend tests for per-user weekly engagement aggregation in `packages/backend/tests/leader-analytics/chart-engagement-by-user.us4.test.ts`
- [x] T033 [P] [US4] Add web test for multi-series vs single-member engagement chart in `packages/web/tests/leader-analytics/chart-engagement-by-user.us4.test.tsx`

### Implementation for User Story 4

- [x] T034 [US4] Create `EngagementByUserChart.tsx` with MUI X grouped `BarChart` and displayName/email fallback legend using `frontend-design` skill in `packages/web/src/components/leader-analytics/EngagementByUserChart.tsx`
- [x] T035 [US4] Integrate `EngagementByUserChart` into `packages/web/src/pages/LeaderTeamAnalyticsPage.tsx` (cap or scroll legend when subtree >12 members per research)

**Checkpoint**: User Story 4 is independently functional and testable.

---

## Phase 7: User Story 5 - Pending review count (Priority: P2)

**Goal**: Prominent widget shows count of in-scope deliverables the logged-in leader has not reviewed.

**Independent Test**: Unreviewed deliverables in range increment count; marking reviewed elsewhere decreases count on return; zero when all reviewed.

### Tests for User Story 5 (MANDATORY)

- [x] T036 [P] [US5] Add pending-review acceptance mapping in `tests/016-leader-analytics-charts/chart-pending-review.us5.test.md`
- [x] T037 [P] [US5] Add backend tests for `pendingReviewCount` with `deliverable_reviews` join and per-leader isolation in `packages/backend/tests/leader-analytics/chart-pending-review.us5.test.ts`
- [x] T038 [P] [US5] Add web test for pending review widget display and filter respect in `packages/web/tests/leader-analytics/chart-pending-review.us5.test.tsx`

### Implementation for User Story 5

- [x] T039 [US5] Create `PendingReviewWidget.tsx` with prominent count and explanatory label using `frontend-design` skill in `packages/web/src/components/leader-analytics/PendingReviewWidget.tsx`
- [x] T040 [US5] Integrate `PendingReviewWidget` into `packages/web/src/pages/LeaderTeamAnalyticsPage.tsx`

**Checkpoint**: User Story 5 is independently functional and testable.

---

## Phase 8: User Story 6 - Resizable widget layout (Priority: P2)

**Goal**: Three chart widgets in a resizable grid; layout persists in `sessionStorage` for the browser session.

**Independent Test**: Resize widget → chart redraws; navigate away and back → layout restored; narrow viewport stacks without clipped axes.

### Tests for User Story 6 (MANDATORY)

- [x] T041 [P] [US6] Add widget layout acceptance mapping in `tests/016-leader-analytics-charts/widget-layout.us6.test.md`
- [x] T042 [P] [US6] Add web test for default layout, resize, and sessionStorage restore in `packages/web/tests/leader-analytics/widget-layout.us6.test.tsx`

### Implementation for User Story 6

- [x] T043 [US6] Create `AnalyticsWidgetGrid.tsx` with `react-grid-layout`, default layout for `impact` / `engagement` / `pending-review`, and `sessionStorage` key `em-tool:leader-analytics-layout:v1` in `packages/web/src/components/leader-analytics/AnalyticsWidgetGrid.tsx`
- [x] T044 [US6] Wrap chart widgets in `AnalyticsWidgetGrid` and ensure charts resize via MUI X responsive container in `packages/web/src/pages/LeaderTeamAnalyticsPage.tsx`
- [x] T045 [US6] Import `react-grid-layout` CSS in `packages/web/src/pages/LeaderTeamAnalyticsPage.tsx` or `packages/web/src/main.tsx`

**Checkpoint**: User Story 6 is independently functional and testable.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: DAC evidence, edge cases, contract alignment, and verification.

- [x] T046 [P] Add backend DAC test proving peers and out-of-branch owners are excluded from analytics aggregates in `packages/backend/tests/leader-analytics/leader-analytics-dac.test.ts`
- [x] T047 [P] Add backend test for empty descendant subtree (zero counts, empty engagement) in `packages/backend/tests/leader-analytics/leader-analytics-empty-team.test.ts`
- [x] T048 [P] Add web test for concurrent filter changes showing latest request only in `packages/web/tests/leader-analytics/leader-analytics-stale-request.test.tsx`
- [x] T049 Validate contract/spec/plan alignment in `specs/016-leader-analytics-charts/contracts/team-analytics-api.yaml`
- [x] T050 Run full verification (`npm run test --workspace @em-tool/backend -- --run leader-analytics`, `npm run test --workspace @em-tool/web -- --run leader-analytics`, `npm run lint`) and record outcomes in `specs/016-leader-analytics-charts/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup (T004 npm install) — **blocks all user stories**
- **User Stories (Phase 3–8)**: Depend on Foundational completion
  - US1–US3 (P1) recommended before US4–US6 (P2)
  - US2 depends on US1 page shell (T015–T017 before T022–T025)
  - US3–US5 depend on US1 fetch pipeline; can proceed in parallel after US2
  - US6 depends on US3–US5 chart components existing
- **Polish (Phase 9)**: After desired user stories complete

### User Story Dependencies

| Story | Depends on   | Independent test focus                       |
| ----- | ------------ | -------------------------------------------- |
| US1   | Foundational | Menu, route, leader API access, initial load |
| US2   | US1 page     | Filters refresh all metrics                  |
| US3   | US1–US2      | Impact weekly aggregation chart              |
| US4   | US1–US2      | Engagement per-user chart                    |
| US5   | US1–US2      | Pending review count widget                  |
| US6   | US3–US5      | Resizable grid + session layout              |

### Within Each User Story

- Write tests first (expect fail), then implementation
- Backend aggregation changes belong in Foundational or story-specific backend test files only
- Do not modify Team Deliverables date axis (`updated_at`) in this feature

### Parallel Opportunities

- T002 and T003 (setup bootstraps)
- T005, T008, T009, T010, T011 after T006–T007 sequence started (T008–T010 parallel after T005)
- All `[P]` tests within a story phase can run in parallel
- US3, US4, US5 implementation (T029–T040) can run in parallel across different component files after US2 completes
- T046–T048 polish tests in parallel

---

## Parallel Example: User Story 3

```bash
# Tests in parallel:
# - tests/016-leader-analytics-charts/chart-deliverables-by-impact.us3.test.md
# - packages/backend/tests/leader-analytics/chart-deliverables-by-impact.us3.test.ts
# - packages/web/tests/leader-analytics/chart-deliverables-by-impact.us3.test.tsx

# Then implementation:
# - packages/web/src/components/leader-analytics/DeliverablesByImpactChart.tsx
# - wire in LeaderTeamAnalyticsPage.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 + Foundational)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (analytics API end-to-end)
3. Complete Phase 3: User Story 1 (menu, route, page load)
4. **STOP and VALIDATE**: Leader can open Team Analytics and see data summaries

### Incremental Delivery

1. Setup + Foundational → API ready
2. US1 → Access and load (MVP shell)
3. US2 → Shared filters (P1 complete)
4. US3 → Impact chart
5. US4 → Engagement chart
6. US5 → Pending review widget
7. US6 → Resizable layout
8. Polish → DAC, empty team, full test run

### Suggested MVP Scope

**Foundational + US1 + US2** delivers a leader-only analytics page with working filters and raw metric display. Add **US3** for the primary chart value, then US4–US6 for full spec compliance.

---

## Notes

- Use `frontend-design` skill for all page and chart component tasks
- Reuse `TeamMemberHierarchyPicker` and `fetchLeaderHierarchyView` from Team Deliverables — do not add a new picker API
- Pending review uses `created_at`; document any manual comparison delta vs Team Deliverables (`updated_at`) in tests
- `[P]` = parallel-safe (different files, no incomplete upstream dependency)
- Total tasks: **50** (Setup 4, Foundational 7, US1 7, US2 7, US3 5, US4 5, US5 5, US6 5, Polish 5)
