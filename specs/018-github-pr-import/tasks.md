# Tasks: GitHub Pull Request Import

**Input**: Design documents from `/specs/018-github-pr-import/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/github-pr-import-api.yaml`, `contracts/github-pr-import-cli.md`, `quickstart.md`

**Tests**: Mandatory. Spec requires automated coverage under `tests/018-github-pr-import/` (implemented as `packages/backend/tests/018-github-pr-import/`). Backend-only feature — no web UI / i18n / `frontend-design` tasks.

**Organization**: Tasks grouped by user story. Persistence tables per `data-model.md`; CLI per `contracts/github-pr-import-cli.md`; retrieve API `POST /github-pull-requests/query` per OpenAPI contract.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete work)
- **[Story]**: US1 / US2 / US3 maps to spec user stories
- Include exact file paths in every task

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependencies, env documentation, and test scaffolds.

- [X] T001 Add `@octokit/rest` (latest stable compatible with Node 26) to `packages/backend/package.json` dependencies and install
- [X] T002 [P] Document `GITHUB_TOKEN` requirement for import in `packages/backend/.env` comments or `doc/getting-started.md` / `specs/018-github-pr-import/quickstart.md` (no secrets committed)
- [X] T003 [P] Create backend test scaffold directory and shared helpers in `packages/backend/tests/018-github-pr-import/` (e.g. `github-pr-import.setup.ts` for DB + mock GitHub client fixtures)
- [X] T004 [P] Create acceptance test plan stubs under `tests/018-github-pr-import/` (`import.us1.test.md`, `collection-control.us2.test.md`, `query-dac.us3.test.md`) aligned with spec acceptance scenarios

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, entities, injectable GitHub client, and npm script wiring that all stories share.

**⚠️ CRITICAL**: No user story implementation starts until this phase is complete.

- [X] T005 Create TypeORM migration `packages/backend/database/migrations/*-AddGithubPullRequestImport.ts` for tables `github_imported_pull_requests`, `github_pull_request_comments`, `github_pull_request_reviews`, `github_pr_collection_controls` with uniqueness and FKs per `specs/018-github-pr-import/data-model.md`
- [X] T006 [P] Add entity `GithubImportedPullRequest` in `packages/backend/src/database/entities/GithubImportedPullRequest.ts`
- [X] T007 [P] Add entity `GithubPullRequestComment` in `packages/backend/src/database/entities/GithubPullRequestComment.ts`
- [X] T008 [P] Add entity `GithubPullRequestReview` in `packages/backend/src/database/entities/GithubPullRequestReview.ts`
- [X] T009 [P] Add entity `GithubPrCollectionControl` in `packages/backend/src/database/entities/GithubPrCollectionControl.ts`
- [X] T010 Implement injectable `githubApiClient` interface + Octokit-backed factory (search merged PRs, hydrate PR, list issue comments, list reviews) in `packages/backend/src/services/githubApiClient.ts`
- [X] T011 Add `github:import-prs` script to `packages/backend/package.json` invoking `tsx scripts/github-import-prs.ts`
- [X] T012 Add root `github:import-prs` script in `package.json` that delegates to `@em-tool/backend`
- [X] T013 Create CLI stub entry that loads dotenv / TypeORM and parses `--start` / `--end` (default previous UTC day) in `packages/backend/scripts/github-import-prs.ts` per `specs/018-github-pr-import/contracts/github-pr-import-cli.md`

**Checkpoint**: Migration runnable; entities discoverable via ORM glob; CLI parses dates and exits cleanly before import logic; GitHub client mockable in tests.

---

## Phase 3: User Story 1 - Operator imports merged pull requests (Priority: P1) 🎯 MVP

**Goal**: For each collaborator with `githubLogin` and each enabled org, query merged PRs for the date range and persist PRs, conversation comments, and reviews.

**Independent Test**: With mocked GitHub client, running import for an explicit date range persists matching PRs (required fields) and nested comments/reviews; skips users without login; ignores non-matching PRs; default range is previous UTC day.

### Tests for User Story 1 (MANDATORY)

- [X] T014 [P] [US1] Align acceptance scenarios in `tests/018-github-pr-import/import.us1.test.md` with CLI contract and FR-001–FR-009
- [X] T015 [P] [US1] Add import tests: default previous-day UTC range and explicit `--start`/`--end` in `packages/backend/tests/018-github-pr-import/import-date-range.us1.test.ts`
- [X] T016 [P] [US1] Add import tests: only users with `githubLogin` processed; users without login skipped in `packages/backend/tests/018-github-pr-import/import-user-filter.us1.test.ts`
- [X] T017 [P] [US1] Add import tests: only enabled orgs queried; author + org + merged-date selection rules in `packages/backend/tests/018-github-pr-import/import-selection.us1.test.ts`
- [X] T018 [P] [US1] Add import tests: persisted PR fields + comments + reviews match required schema in `packages/backend/tests/018-github-pr-import/import-persist.us1.test.ts`

### Implementation for User Story 1

- [X] T019 [US1] Implement date-range helpers (previous UTC day, inclusive start/end validation) in `packages/backend/src/services/githubPrImportDateRange.ts`
- [X] T020 [US1] Implement import orchestration: load users with `githubLogin`, load enabled `github_integrations`, call `githubApiClient`, upsert PRs/comments/reviews in `packages/backend/src/services/githubPrImportService.ts`
- [X] T021 [US1] Wire CLI to call import service and print processed summary in `packages/backend/scripts/github-import-prs.ts`
- [X] T022 [US1] Ensure case-insensitive author/`githubLogin` matching during import in `packages/backend/src/services/githubPrImportService.ts`

**Checkpoint**: MVP — operator can run `npm run github:import-prs` (with mocked or live GitHub) and persist imported PR data for the selected range.

---

## Phase 4: User Story 2 - Collection control prevents duplicate collection (Priority: P1)

**Goal**: Record collection attempts per collaborator + organization + date range; skip successful periods; retry after failure without duplicate GitHub PR IDs.

**Independent Test**: Successful control row blocks re-import duplicates; failed row stores `errorDetails` and allows retry that ends in a single coherent PR set.

### Tests for User Story 2 (MANDATORY)

- [X] T023 [P] [US2] Align acceptance scenarios in `tests/018-github-pr-import/collection-control.us2.test.md` with FR-010–FR-012
- [X] T024 [P] [US2] Add tests: successful control record fields and skip on re-run (no duplicate PRs) in `packages/backend/tests/018-github-pr-import/collection-control-success.us2.test.ts`
- [X] T025 [P] [US2] Add tests: failed control stores `errorDetails` and retry succeeds / upserts once in `packages/backend/tests/018-github-pr-import/collection-control-retry.us2.test.ts`
- [X] T026 [P] [US2] Add tests: empty successful collection (no matching PRs) still records `success` in `packages/backend/tests/018-github-pr-import/collection-control-empty.us2.test.ts`

### Implementation for User Story 2

- [X] T027 [US2] Implement collection-control read/write/skip/retry helpers in `packages/backend/src/services/githubPrCollectionControlService.ts`
- [X] T028 [US2] Integrate control checks and status updates into import loop in `packages/backend/src/services/githubPrImportService.ts` (status `success` | `failed` | `skipped`)
- [X] T029 [US2] On failed GitHub/API errors, persist `errorDetails` without leaking `GITHUB_TOKEN` in `packages/backend/src/services/githubPrImportService.ts`
- [X] T030 [US2] Update CLI summary to report success / skipped / failed counts and non-zero exit on failures in `packages/backend/scripts/github-import-prs.ts`

**Checkpoint**: Re-import of a successful period is a no-op for PR rows; failed periods are retryable.

---

## Phase 5: User Story 3 - Retrieve collected pull request data (Priority: P1)

**Goal**: Authenticated `POST /github-pull-requests/query` returns imported PRs (with comments/reviews) filtered by GitHub logins + merged-date range under hierarchical DAC; administrators may query any mapped collaborator.

**Independent Test**: Query returns matching nested data for self/subordinate/admin; denies peer/superior; validates empty login list and bad dates; unauthenticated → 401.

### Tests for User Story 3 (MANDATORY)

- [X] T031 [P] [US3] Align acceptance scenarios in `tests/018-github-pr-import/query-dac.us3.test.md` with `specs/018-github-pr-import/contracts/github-pr-import-api.yaml` and FR-013–FR-015
- [X] T032 [P] [US3] Add contract/integration tests for query filters (logins + date range, empty result, validation errors) in `packages/backend/tests/018-github-pr-import/query-filters.us3.test.ts`
- [X] T033 [P] [US3] Add DAC allow/deny tests (self, descendant, peer, superior, admin, unauthenticated) in `packages/backend/tests/018-github-pr-import/query-dac.us3.test.ts`
- [X] T034 [P] [US3] Add tests that response includes nested comments and reviews with required fields in `packages/backend/tests/018-github-pr-import/query-nested.us3.test.ts`

### Implementation for User Story 3

- [X] T035 [US3] Add/extend authorization helper for GitHub-login visibility (self + recursive subordinates; admin allow-all) in `packages/backend/src/services/authorizationService.ts` (reuse hierarchy helpers as in research)
- [X] T036 [US3] Implement request validation and query mapping in `packages/backend/src/services/githubPrQueryService.ts`
- [X] T037 [US3] Implement `POST /github-pull-requests/query` in `packages/backend/src/routes/githubPullRequests.ts` per OpenAPI contract
- [X] T038 [US3] Register routes in `packages/backend/src/index.ts`
- [X] T039 [US3] Map entities to response DTOs (`pullRequests` with nested `comments` / `reviews`) in `packages/backend/src/services/githubPrQueryService.ts`

**Checkpoint**: Retrieve API usable by authorized callers; DAC matrix covered by automated tests.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cross-story verification and documentation fidelity.

- [X] T040 [P] Add regression tests for CLI argument validation (one-sided dates, end before start) in `packages/backend/tests/018-github-pr-import/cli-args.test.ts`
- [X] T041 [P] Add regression: retrieve API never mutates collection-control rows in `packages/backend/tests/018-github-pr-import/query-readonly.test.ts`
- [X] T042 Run `npm run db:migration:run --workspace @em-tool/backend` and confirm schema against `specs/018-github-pr-import/data-model.md`
- [X] T043 Run verification steps from `specs/018-github-pr-import/quickstart.md` and record outcomes in that file
- [X] T044 [P] Ensure `npm run lint` and `npm run test --workspace @em-tool/backend -- tests/018-github-pr-import` pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational — MVP import path
- **User Story 2 (Phase 4)**: Depends on Foundational; integrates with US1 import service (control wraps the import loop)
- **User Story 3 (Phase 5)**: Depends on Foundational and ideally sample imported data from US1 patterns (can seed fixtures independently)
- **Polish (Phase 6)**: Depends on completed stories in scope

### User Story Dependencies

- **US1 (P1)**: After Foundational — no dependency on US2/US3
- **US2 (P1)**: After Foundational; extends US1 import service with control semantics (independently testable via control-focused tests)
- **US3 (P1)**: After Foundational; reads persisted tables (fixtures OK without live import)

### Within Each User Story

- Tests written first and failing before implementation
- Services before CLI/route wiring
- Story complete before treating checkpoint as done

### Parallel Opportunities

- Phase 1: T002, T003, T004 in parallel after T001
- Phase 2: T006–T009 entities in parallel after T005 starts/lands; T011–T012 scripts in parallel once CLI stub planned
- US1 tests T014–T018 in parallel; then implementation T019→T022 sequential where shared files conflict
- US2 tests T023–T026 in parallel; T027 then T028–T030
- US3 tests T031–T034 in parallel; T035→T039 mostly sequential on shared route/service files
- US2 and US3 can proceed in parallel after US1 MVP if staffing allows (watch `githubPrImportService.ts` conflicts for US2)

---

## Parallel Example: User Story 1

```bash
# Tests in parallel:
Task: "import-date-range.us1.test.ts"
Task: "import-user-filter.us1.test.ts"
Task: "import-selection.us1.test.ts"
Task: "import-persist.us1.test.ts"

# Then implement:
Task: "githubPrImportDateRange.ts"
Task: "githubPrImportService.ts"
Task: "wire scripts/github-import-prs.ts"
```

---

## Parallel Example: User Story 3

```bash
# Tests in parallel:
Task: "query-filters.us3.test.ts"
Task: "query-dac.us3.test.ts"
Task: "query-nested.us3.test.ts"

# Then implement:
Task: "authorizationService.ts DAC helper"
Task: "githubPrQueryService.ts"
Task: "routes/githubPullRequests.ts + index.ts register"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 + Phase 2
2. Complete Phase 3 (US1 import + persist)
3. **STOP and VALIDATE** with US1 tests and `npm run github:import-prs -- --start … --end …`
4. Demo operator import before control/query polish

### Incremental Delivery

1. Setup + Foundational → schema and CLI stub ready
2. US1 → import works (MVP)
3. US2 → duplicate prevention and retry
4. US3 → retrieve API + DAC
5. Polish → quickstart evidence and lint/test green

### Parallel Team Strategy

1. Team finishes Setup + Foundational together
2. Dev A: US1 → then US2 (shared import service)
3. Dev B: US3 (query/DAC) using seeded imported PR fixtures

---

## Notes

- Backend-only: no `packages/web` tasks; Principle VIII/IX N/A
- Mock `githubApiClient` in all CI tests — no live GitHub in Vitest
- DAC evidence required for US3 (Principle VII)
- Commit after each task or logical group
- Avoid committing secrets; `GITHUB_TOKEN` stays in env only
