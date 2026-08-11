# Tasks: User Pull Request Activity

**Input**: Design documents from `/specs/020-user-pr-activity/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Mandatory. Spec requires automated coverage under `tests/020-user-pr-activity/` plus package tests in `packages/backend/tests/020-user-pr-activity/` and `packages/web/tests/020-user-pr-activity/`.

**Organization**: Tasks grouped by user story. API per `contracts/user-pr-activity-api.yaml`; UI per plan structure; i18n + `frontend-design` required for web screens.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete work)
- **[Story]**: US1 / US2 / US3 / US4 maps to spec user stories
- Include exact file paths in every task

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Feature scaffolds, i18n namespace registration, and shared test folders.

- [ ] T001 Create feature test doc stubs under `tests/020-user-pr-activity/` (`screen-access.us1.test.md`, `filters.us2.test.md`, `summaries.us3.test.md`, `table-detail.us4.test.md`) aligned with spec US1–US4
- [ ] T002 [P] Create backend test directory scaffold in `packages/backend/tests/020-user-pr-activity/` (reuse fixtures/patterns from `packages/backend/tests/018-github-pr-import/` where useful)
- [ ] T003 [P] Create web test directory scaffold in `packages/web/tests/020-user-pr-activity/`
- [ ] T004 [P] Add `prActivity` locale catalogs `packages/web/src/locales/en-US/prActivity.json` and `packages/web/src/locales/pt-BR/prActivity.json` (placeholder keys for page title, empty states, errors) and register namespace in `packages/web/src/i18n/config.ts`
- [ ] T005 [P] Add `menu.myPullRequests` keys to `packages/web/src/locales/en-US/shell.json` and `packages/web/src/locales/pt-BR/shell.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Self-only my-activity API all stories consume. No schema migration.

**⚠️ CRITICAL**: No user story UI work that depends on live activity data starts until this phase is complete.

- [ ] T006 Add request validation + DTO types for my-activity (`startDate`/`endDate`, `involvementRole`) in `packages/backend/src/services/githubPrQueryService.ts` (or adjacent types module) per `specs/020-user-pr-activity/contracts/user-pr-activity-api.yaml` and `data-model.md`
- [ ] T007 Implement `queryMyPullRequestActivity(actorUserId, { startDate, endDate })` in `packages/backend/src/services/githubPrQueryService.ts`: resolve actor `githubLogin`; empty login → `[]`; select PRs in `mergedAt` range where actor matches author OR comment author OR review reviewer; map with `mapImportedPullRequest` + `involvementRole`
- [ ] T008 Register `POST /github-pull-requests/my-activity` (auth required; no client-supplied login) in `packages/backend/src/routes/githubPullRequests.ts`
- [ ] T009 [P] Add backend foundational tests for date validation (400), unauthenticated (401), empty GitHub login → empty list in `packages/backend/tests/020-user-pr-activity/my-activity-validation.test.ts`
- [ ] T010 [P] Add backend foundational tests for authored + involved-via-comment + involved-via-review inclusion and self-only exclusion of others’ authored-only PRs in `packages/backend/tests/020-user-pr-activity/my-activity-query.test.ts`

**Checkpoint**: `POST /github-pull-requests/my-activity` returns self activity with roles; contract behaviors covered by backend tests.

---

## Phase 3: User Story 1 - Open My Pull Requests screen (Priority: P1) 🎯 MVP

**Goal**: Authenticated users can open **My Pull Requests** from the shell menu, land on `/app/my-pull-requests` with default last-60-days load (or clear no-GitHub guidance), and unauthenticated access is denied.

**Independent Test**: Menu shows for signed-in users; route loads with default 60-day period when `githubLogin` present; no-login users see guidance empty state; unauthenticated visitors cannot access the route.

### Tests for User Story 1 (MANDATORY)

- [ ] T011 [P] [US1] Add web tests for menu visibility, route access, default 60-day range, and no-GitHub empty state in `packages/web/tests/020-user-pr-activity/screen-access.us1.test.tsx`
- [ ] T012 [P] [US1] Add i18n key-parity / no hard-coded copy smoke for shell menu + page shell strings in `packages/web/tests/020-user-pr-activity/i18n-parity.us1.test.ts`

### Implementation for User Story 1

- [ ] T013 [P] [US1] Add `MY_PULL_REQUESTS_ROUTE` and base-menu entry in `packages/web/src/routes/shellOptions.ts`
- [ ] T014 [P] [US1] Add `fetchMyPullRequestActivity` client in `packages/web/src/services/myPullRequestsApi.ts`
- [ ] T015 [US1] Create initial `MyPullRequestsPage` in `packages/web/src/pages/MyPullRequestsPage.tsx` using `frontend-design` skill + Material UI (responsive breakpoints, accessible headings, clear hierarchy): title/subtitle, default `defaultLast60DayRange()` load via auth token, loading/error/no-GitHub empty states; all copy via `prActivity` / `common` i18n keys
- [ ] T016 [US1] Register protected route `/app/my-pull-requests` in `packages/web/src/App.tsx`
- [ ] T017 [US1] Expand `packages/web/src/locales/{en-US,pt-BR}/prActivity.json` with US1 strings (title, subtitle, loading, errors, no-GitHub guidance)

**Checkpoint**: MVP — user can open My Pull Requests and see default-period activity shell (or guidance empty state).

---

## Phase 4: User Story 2 - Filter by period and repository (Priority: P1)

**Goal**: Period and repository filters refresh the shared activity view consistently; invalid ranges are blocked; empty filters show empty states without errors.

**Independent Test**: Changing dates refetches activity; repository options derive from period results; selecting/clearing repository filters client-side; end-before-start shows validation and keeps prior valid results.

### Tests for User Story 2 (MANDATORY)

- [ ] T018 [P] [US2] Add unit tests for repository option derivation and client-side repository filtering in `packages/web/tests/020-user-pr-activity/activity-filters.us2.test.ts`
- [ ] T019 [P] [US2] Add web UI tests for period change, repository select/clear, invalid range, and empty filtered results in `packages/web/tests/020-user-pr-activity/filters.us2.test.tsx`

### Implementation for User Story 2

- [ ] T020 [P] [US2] Implement filter/aggregation helpers (repo options from period payload, apply repository filter) in `packages/web/src/utils/myPullRequestActivity.ts`
- [ ] T021 [US2] Create `MyPullRequestsFilters` in `packages/web/src/components/my-pull-requests/MyPullRequestsFilters.tsx` using `frontend-design` + MUI (accessible date inputs, repository select, validation messaging via i18n)
- [ ] T022 [US2] Wire filters into `packages/web/src/pages/MyPullRequestsPage.tsx` so period changes refetch my-activity and repository filter applies to the shared in-memory set without a separate search button
- [ ] T023 [US2] Add filter-related keys to `packages/web/src/locales/{en-US,pt-BR}/prActivity.json` (and reuse `common.validation.endDateBeforeStart` where applicable)

**Checkpoint**: Filters drive a single consistent activity set for downstream widgets/table.

---

## Phase 5: User Story 3 - Authored PR chart and comment/review cards (Priority: P1)

**Goal**: Show weekly authored-PR chart plus comment-count and review-count cards derived from the filtered activity set (actor-authored comments/reviews only).

**Independent Test**: Authored-only PRs appear in chart buckets; involved-only PRs do not inflate authored series; cards count only the user’s comments/reviews; repository/period filters update widgets; empty authored with non-zero comments/reviews still shows card values.

### Tests for User Story 3 (MANDATORY)

- [ ] T024 [P] [US3] Add unit tests for weekly authored series and comment/review counts in `packages/web/tests/020-user-pr-activity/summaries.us3.test.ts`
- [ ] T025 [P] [US3] Add web UI tests that chart/cards refresh with filters and respect owner vs involvement rules in `packages/web/tests/020-user-pr-activity/summaries-ui.us3.test.tsx`

### Implementation for User Story 3

- [ ] T026 [US3] Extend `packages/web/src/utils/myPullRequestActivity.ts` with weekly authored bucketing (reuse week label helpers) and comment/review count aggregators keyed by actor `githubLogin`
- [ ] T027 [P] [US3] Create `AuthoredPrsChart` in `packages/web/src/components/my-pull-requests/AuthoredPrsChart.tsx` using `@mui/x-charts` `BarChart` + `frontend-design` / MUI theming (responsive, accessible title)
- [ ] T028 [P] [US3] Create `ActivitySummaryCards` in `packages/web/src/components/my-pull-requests/ActivitySummaryCards.tsx` for comment and review counts (Material UI Cards, clear visual hierarchy)
- [ ] T029 [US3] Render chart + cards below filters in `packages/web/src/pages/MyPullRequestsPage.tsx` bound to the filtered activity set
- [ ] T030 [US3] Add chart/card i18n keys to `packages/web/src/locales/{en-US,pt-BR}/prActivity.json`

**Checkpoint**: Summaries give at-a-glance authored volume and involvement counts.

---

## Phase 6: User Story 4 - PR table and detail modal (Priority: P1)

**Goal**: Data table lists filtered PRs (repository, PR date/`mergedAt`, owner vs involved); row click opens a dismissible modal with full PR detail including nested comments/reviews; closing preserves filters.

**Independent Test**: Owner and involved rows labeled correctly; modal shows available fields + nested activity; close keeps filters; empty set shows empty table state; default sort newest `mergedAt` first; optional pagination when large.

### Tests for User Story 4 (MANDATORY)

- [ ] T031 [P] [US4] Add unit/UI tests for role labeling, default sort, and empty table in `packages/web/tests/020-user-pr-activity/table.us4.test.tsx`
- [ ] T032 [P] [US4] Add UI tests for row-click modal open/close with detail fields and filter persistence in `packages/web/tests/020-user-pr-activity/table-detail.us4.test.tsx`

### Implementation for User Story 4

- [ ] T033 [P] [US4] Create `MyPullRequestsTable` in `packages/web/src/components/my-pull-requests/MyPullRequestsTable.tsx` using MUI `Table` (+ pagination if needed), accessible row activation, i18n headers/role labels
- [ ] T034 [P] [US4] Create `PullRequestDetailModal` in `packages/web/src/components/my-pull-requests/PullRequestDetailModal.tsx` using MUI `Dialog` (patterned after team deliverable review modal) with full PR fields + comments/reviews sections via i18n
- [ ] T035 [US4] Integrate table + modal into `packages/web/src/pages/MyPullRequestsPage.tsx` below summaries; ensure row click opens modal and dismiss restores filtered table context
- [ ] T036 [US4] Add table/modal i18n keys to `packages/web/src/locales/{en-US,pt-BR}/prActivity.json`

**Checkpoint**: Users can browse involvement and inspect full PR detail without leaving the screen.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end validation, consistency, and docs.

- [ ] T037 [P] Verify en-US/pt-BR key parity for `prActivity` + `shell.menu.myPullRequests` and extend `packages/web/tests/020-user-pr-activity/i18n-parity.us1.test.ts` (or dedicated parity test) if needed
- [ ] T038 [P] Confirm feature markdown acceptance docs under `tests/020-user-pr-activity/` match implemented behaviors
- [ ] T039 Run quickstart verification commands from `specs/020-user-pr-activity/quickstart.md` (`npm run test --workspace @em-tool/backend -- --run 020-user-pr-activity`, web counterpart, `npm run lint`) and fix failures
- [ ] T040 Manual smoke per quickstart § Manual (menu, default range, filters, roles, modal, no-GitHub, self-only)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** story implementation that needs the API
- **US1 (Phase 3)**: Depends on Foundational — MVP screen + route
- **US2 (Phase 4)**: Depends on US1 page shell (filters wire into the page)
- **US3 (Phase 5)**: Depends on US2 filtered activity set (can stub filter helpers earlier if parallelizing carefully)
- **US4 (Phase 6)**: Depends on US2 filtered activity set (table can proceed in parallel with US3 after filters exist)
- **Polish (Phase 7)**: Depends on US1–US4 complete

### User Story Dependencies

- **US1**: After Foundational — no dependency on US2–US4
- **US2**: After US1 page exists
- **US3**: After US2 shared filtered set (or shared util from T020)
- **US4**: After US2 shared filtered set; parallelizable with US3 once T020–T022 done

### Within Each User Story

- Tests first (fail before implementation)
- Utils/API before components
- Components before page wiring
- Locale keys with or immediately before UI that needs them

### Parallel Opportunities

- T002–T005 in Setup
- T009–T010 foundational tests in parallel after T008
- T011–T012 and T013–T014 within US1
- T018–T019 US2 tests; T027–T028 US3 components; T033–T034 US4 components
- After T022: US3 and US4 can proceed in parallel

---

## Parallel Example: User Story 1

```bash
# Tests in parallel:
Task: "screen-access.us1.test.tsx"
Task: "i18n-parity.us1.test.ts"

# Route/API client in parallel:
Task: "shellOptions.ts menu entry"
Task: "myPullRequestsApi.ts client"
```

## Parallel Example: After filters (US3 + US4)

```bash
Task: "AuthoredPrsChart.tsx"
Task: "ActivitySummaryCards.tsx"
Task: "MyPullRequestsTable.tsx"
Task: "PullRequestDetailModal.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 Setup
2. Complete Phase 2 Foundational API
3. Complete Phase 3 US1 (menu + page + default load)
4. **STOP and VALIDATE** independently
5. Demo personal PR activity entry point

### Incremental Delivery

1. Setup + Foundational → API ready
2. US1 → navigable screen (MVP)
3. US2 → trustworthy filters
4. US3 → chart + cards
5. US4 → table + modal
6. Polish → quickstart + i18n parity

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Dev A: US1 → US2
3. Dev B (after T022): US3
4. Dev C (after T022): US4
5. Shared polish

---

## Notes

- Self-only DAC: my-activity must never accept another user’s login; UI always uses session `user.githubLogin`
- Involved PRs only appear if imported via another collaborator’s author-based import (018) — document in empty states if helpful, do not invent rows
- Reuse `defaultLast60DayRange`, `isValidDateRange`, week helpers, `@mui/x-charts`; no new chart dependency; no migration
- Every screen/component task must use `frontend-design` + MUI a11y/responsive practices
- All user-visible strings via i18n (`en-US` + `pt-BR`)
- Commit after each task or logical group; stop at checkpoints to validate
