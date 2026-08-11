# Tasks: GitHub Pull Request Natural Key

**Input**: Design documents from `/specs/019-github-pr-natural-key/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Mandatory. Spec requires automated coverage under `tests/019-github-pr-natural-key/` (implement as `packages/backend/tests/019-github-pr-natural-key/`). Backend-only — no web UI / i18n / `frontend-design` tasks.

**Organization**: Tasks grouped by user story. Schema per `data-model.md`; import behavior per `contracts/github-pr-natural-key-import.md`; retrieve delta per `contracts/github-pr-natural-key-api.yaml`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete work)
- **[Story]**: US1 / US2 / US3 / US4 maps to spec user stories
- Include exact file paths in every task

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Feature test scaffold and shared fixtures for natural-key work.

- [x] T001 Create test directory and shared helpers/fixtures in `packages/backend/tests/019-github-pr-natural-key/` (reuse patterns from `packages/backend/tests/018-github-pr-import/github-pr-import.setup.ts` where useful)
- [x] T002 [P] Add acceptance scenario stubs under `tests/019-github-pr-natural-key/` aligned with spec US1–US4 (`natural-key.us1.test.md`, `author-identity.us2.test.md`, `collection-control.us3.test.md`, `nested.us4.test.md`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema and entity changes all stories depend on. Tables are empty — migration only, no data reconciliation.

**⚠️ CRITICAL**: No user story implementation starts until this phase is complete.

- [x] T003 Create TypeORM migration `packages/backend/database/migrations/*-GithubPrNaturalKey.ts` that: drops `UQ_github_imported_pull_requests_github_pr_id`; adds unique `(repository_id, github_pull_request_id)`; removes `collaborator_id` FK/column from `github_imported_pull_requests`; rebuilds `github_pr_collection_controls` unique key as `(repository_id, github_pull_request_id)` and removes collaborator/org/date-range identity columns per `specs/019-github-pr-natural-key/data-model.md`
- [x] T004 [P] Update entity `GithubImportedPullRequest` in `packages/backend/src/database/entities/GithubImportedPullRequest.ts` (remove `collaboratorId` / User relation; document natural key fields)
- [x] T005 [P] Update entity `GithubPrCollectionControl` in `packages/backend/src/database/entities/GithubPrCollectionControl.ts` to key by `repositoryId` + `githubPullRequestId` (drop collaborator/org/date identity fields)
- [x] T006 Fix GitHub client search/detail mapping so `repositoryId` and `githubPullRequestId` are distinct and non-blank in `packages/backend/src/services/githubApiClient.ts` (reject incomplete natural keys before persist callers use them)

**Checkpoint**: Migration applies on empty tables; entities compile; client returns correct ids for natural-key upserts.

---

## Phase 3: User Story 1 - Imported PRs identified by repository + pull request id (Priority: P1) 🎯 MVP

**Goal**: Persist/upsert imported PRs by natural key `(repositoryId, githubPullRequestId)` with required fields; re-import updates in place with zero duplicate rows.

**Independent Test**: With mocked GitHub client, importing the same PR twice yields one row keyed by `(repositoryId, githubPullRequestId)`; missing either id refuses persist.

### Tests for User Story 1 (MANDATORY)

- [x] T007 [P] [US1] Add tests: upsert by `(repositoryId, githubPullRequestId)` and no duplicate on re-import in `packages/backend/tests/019-github-pr-natural-key/natural-key-persist.us1.test.ts`
- [x] T008 [P] [US1] Add tests: refuse persist when `repositoryId` or `githubPullRequestId` missing/blank in `packages/backend/tests/019-github-pr-natural-key/natural-key-validation.us1.test.ts`
- [x] T009 [P] [US1] Add tests: field refresh on upsert (title/counts update, same natural key) in `packages/backend/tests/019-github-pr-natural-key/natural-key-upsert-refresh.us1.test.ts`

### Implementation for User Story 1

- [x] T010 [US1] Change PR upsert lookup/save to natural key `(repositoryId, githubPullRequestId)` and stop setting `collaboratorId` in `packages/backend/src/services/githubPrImportService.ts`
- [x] T011 [US1] Add pre-persist validation that rejects incomplete natural keys with a clear failure reason in `packages/backend/src/services/githubPrImportService.ts`

**Checkpoint**: MVP — PR identity is natural-key based; re-import does not duplicate rows.

---

## Phase 4: User Story 2 - Collaborator is association context, not identity (Priority: P1)

**Goal**: Import may still discover via collaborator GitHub logins, but uniqueness and retrieve matching do not use collaborator ownership. Retrieve filters by `authorGithubLogin` + dates under hierarchical DAC.

**Independent Test**: Two discovery paths that hit the same PR still yield one row; query by author login returns it; peer/superior denied; self/subordinate/admin allowed.

### Tests for User Story 2 (MANDATORY)

- [x] T012 [P] [US2] Add tests: uniqueness not scoped by collaborator; author login stored as attribute in `packages/backend/tests/019-github-pr-natural-key/author-not-identity.us2.test.ts`
- [x] T013 [P] [US2] Add retrieve filter tests by author login + date (no `collaborator_id` dependency) in `packages/backend/tests/019-github-pr-natural-key/query-author-filter.us2.test.ts`
- [x] T014 [P] [US2] Add DAC allow/deny tests (self, descendant, peer, superior, admin, unauthenticated) in `packages/backend/tests/019-github-pr-natural-key/query-dac.us2.test.ts`

### Implementation for User Story 2

- [x] T015 [US2] Update `queryImportedPullRequests` to filter by `author_github_login` (normalized) instead of `collaborator_id` in `packages/backend/src/services/githubPrQueryService.ts` while keeping DAC checks on mapped users
- [x] T016 [US2] Adjust any remaining import/query call sites that assume `collaboratorId` on imported PRs (including `packages/backend/tests/018-github-pr-import/` fixtures that break under the new entity) so 019 + existing suites stay coherent

**Checkpoint**: Retrieve works without PR ownership FK; DAC matrix still enforced.

---

## Phase 5: User Story 3 - Collection control audits by PR natural key (Priority: P1)

**Goal**: Collection-control unique on `(repositoryId, githubPullRequestId)`; audit/history only; every import hit refreshes PR data and updates control (no skip on prior success).

**Independent Test**: Prior successful control does not skip refresh; control row updates `executedAt`/status; failed control still allows later refresh attempt; no collaborator+org+date uniqueness.

### Tests for User Story 3 (MANDATORY)

- [x] T017 [P] [US3] Add tests: control unique on PR natural key; prior success does not skip refresh in `packages/backend/tests/019-github-pr-natural-key/collection-control-audit.us3.test.ts`
- [x] T018 [P] [US3] Add tests: failed control stores `errorDetails` and later hit still attempts refresh in `packages/backend/tests/019-github-pr-natural-key/collection-control-retry.us3.test.ts`
- [x] T019 [P] [US3] Add tests: search-level failure without PR key does not invent collaborator-period control rows in `packages/backend/tests/019-github-pr-natural-key/collection-control-search-failure.us3.test.ts`

### Implementation for User Story 3

- [x] T020 [US3] Rewrite collection-control find/upsert APIs to key by `(repositoryId, githubPullRequestId)` and remove `shouldSkipSuccessfulCollection` skip path in `packages/backend/src/services/githubPrCollectionControlService.ts`
- [x] T021 [US3] Integrate per-PR always-refresh control updates into the import loop in `packages/backend/src/services/githubPrImportService.ts` (upsert control after each PR hit; search failures → run summary only)
- [x] T022 [US3] Update CLI summary in `packages/backend/scripts/github-import-prs.ts` so it no longer treats “already successfully collected period” as skipped; report refresh/import outcomes per `contracts/github-pr-natural-key-import.md`

**Checkpoint**: Control is PR-keyed audit; import always refreshes on hit.

---

## Phase 6: User Story 4 - Nested comments/reviews stay on natural-keyed parent (Priority: P2)

**Goal**: Comments and reviews attach to the single natural-keyed parent; re-import does not create a second parent or orphan nested rows.

**Independent Test**: Re-import upserts nested items against the same parent UUID for `(repositoryId, githubPullRequestId)`; retrieve returns nested payloads once.

### Tests for User Story 4 (MANDATORY)

- [x] T023 [P] [US4] Add tests: comments/reviews link to single parent; re-import does not duplicate parent in `packages/backend/tests/019-github-pr-natural-key/nested-attach.us4.test.ts`
- [x] T024 [P] [US4] Add retrieve nested payload tests for natural-keyed parent in `packages/backend/tests/019-github-pr-natural-key/query-nested.us4.test.ts`

### Implementation for User Story 4

- [x] T025 [US4] Verify/adjust comment and review upsert attachment in `packages/backend/src/services/githubPrImportService.ts` so nested rows always use the natural-key-resolved parent `id`
- [x] T026 [US4] Confirm DTO mapping still returns nested `comments`/`reviews` for the single parent in `packages/backend/src/services/githubPrQueryService.ts`

**Checkpoint**: Nested activity stable under natural-key parent identity.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Regression hygiene and quickstart validation.

- [x] T027 [P] Update any broken references in `packages/backend/tests/018-github-pr-import/` that still assume collaborator-owned PRs or period skip control so the full backend suite stays green
- [x] T028 [P] Align operator notes in `specs/019-github-pr-natural-key/quickstart.md` with final CLI summary wording if implementation differs
- [x] T029 Run `npm run test --workspace @em-tool/backend -- tests/019-github-pr-natural-key` and confirm FR coverage from `specs/019-github-pr-natural-key/spec.md`
- [x] T030 Run format/lint for touched backend packages (`npm run format` / `npm run lint` as applicable) before merge

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **US1 (Phase 3)**: Depends on Foundational — MVP
- **US2 (Phase 4)**: Depends on Foundational; benefits from US1 upsert existing but can be developed after T010–T011
- **US3 (Phase 5)**: Depends on Foundational + US1 natural-key upsert (control attaches to PR hits)
- **US4 (Phase 6)**: Depends on US1 parent upsert path
- **Polish (Phase 7)**: Depends on desired stories complete

### User Story Dependencies

- **US1 (P1)**: After Foundational — no story dependencies — **MVP**
- **US2 (P1)**: After Foundational; query changes independent of control rewrite
- **US3 (P1)**: After US1 persist path exists (per-PR hit upsert)
- **US4 (P2)**: After US1 parent identity stable

### Within Each User Story

- Tests written to fail first where practical, then implementation
- Entity/migration (Phase 2) before service changes
- Story complete before relying on it in later stories

### Parallel Opportunities

- T001–T002 in Setup
- T004–T005 after T003 started (entities can be drafted in parallel with migration)
- US1 test files T007–T009 in parallel
- US2 test files T012–T014 in parallel
- US3 test files T017–T019 in parallel
- US4 test files T023–T024 in parallel
- Polish T027–T028 in parallel

---

## Parallel Example: User Story 1

```bash
# Tests in parallel:
Task: "natural-key-persist.us1.test.ts"
Task: "natural-key-validation.us1.test.ts"
Task: "natural-key-upsert-refresh.us1.test.ts"

# Then implementation sequentially:
Task: "Upsert by natural key in githubPrImportService.ts"
Task: "Pre-persist natural-key validation in githubPrImportService.ts"
```

---

## Parallel Example: User Story 3

```bash
# Tests in parallel:
Task: "collection-control-audit.us3.test.ts"
Task: "collection-control-retry.us3.test.ts"
Task: "collection-control-search-failure.us3.test.ts"

# Then implementation:
Task: "Rewrite githubPrCollectionControlService.ts"
Task: "Integrate always-refresh control in githubPrImportService.ts"
Task: "Update CLI summary in github-import-prs.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (migration + entities + client ids)
3. Complete Phase 3: US1 natural-key persist
4. **STOP and VALIDATE** with `tests/019-github-pr-natural-key` US1 files

### Incremental Delivery

1. Setup + Foundational → schema ready
2. US1 → natural-key upsert MVP
3. US2 → author-login retrieve + DAC
4. US3 → PR-keyed audit control, always refresh
5. US4 → nested attachment stability
6. Polish → 018 regression + full suite

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Then:
   - Dev A: US1 (+ US4 nested)
   - Dev B: US2 query/DAC
   - Dev C: US3 collection-control

---

## Notes

- Backend-only; no `packages/web` tasks
- Empty tables: no reconciliation/cutover tasks
- Do not reintroduce period-based skip via collection-control
- Keep retrieve HTTP contract (`POST /github-pull-requests/query`) request shape unchanged
- Commit after each task or logical group
- Suggested MVP: Phases 1–3 (US1)
