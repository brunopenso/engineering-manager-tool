# Tasks: Create Deliverable from Pull Requests

**Input**: Design documents from `/specs/021-pr-deliverable-create/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Mandatory. Spec requires automated coverage under `tests/021-pr-deliverable-create/` plus package tests in `packages/backend/tests/021-pr-deliverable-create/` and `packages/web/tests/021-pr-deliverable-create/`.

**Organization**: Tasks grouped by user story. Analyze API per `contracts/pr-deliverable-create-api.yaml`; confirm reuses existing `POST /deliverables`; UI extends My Pull Requests with `frontend-design` + i18n.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete work)
- **[Story]**: US1 / US2 / US3 / US4 maps to spec user stories
- Include exact file paths in every task

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Feature test scaffolds and i18n key placeholders for the create-deliverable flow.

- [ ] T001 Create feature test doc stubs under `tests/021-pr-deliverable-create/` (`select-and-open.us1.test.md`, `review-proposal.us2.test.md`, `confirm-and-open.us3.test.md`, `selection-edge.us4.test.md`) aligned with spec US1–US4
- [ ] T002 [P] Create backend test directory scaffold in `packages/backend/tests/021-pr-deliverable-create/`
- [ ] T003 [P] Create web test directory scaffold in `packages/web/tests/021-pr-deliverable-create/`
- [ ] T004 [P] Add placeholder `createDeliverable.*` keys to `packages/web/src/locales/en-US/prActivity.json` and `packages/web/src/locales/pt-BR/prActivity.json` (button, modal title, loading, errors, cancel/confirm, success CTA) with matching key parity

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Mocked analyze API all modal stories consume. No schema migration. No live LLM.

**⚠️ CRITICAL**: No user story UI that depends on analyze responses starts until this phase is complete.

- [ ] T005 Add analyze request/response types and validation (1–50 UUIDs) for `AnalyzeFromPullRequestsRequest` / `DeliverableProposal` in `packages/backend/src/services/deliverableFromPrsService.ts` per `specs/021-pr-deliverable-create/contracts/pr-deliverable-create-api.yaml` and `data-model.md`
- [ ] T006 Implement PR authorization + deterministic mock proposal builder in `packages/backend/src/services/deliverableFromPrsService.ts` (actor GitHub login must be author or involved via comment/review; mock fields per `research.md` Decision 3; never call an LLM)
- [ ] T007 Register `POST /deliverables/from-pull-requests/analyze` (auth required) in `packages/backend/src/routes/deliverables.ts` returning `{ proposal, sourcePullRequestIds }`
- [ ] T008 [P] Add backend tests for validation (empty/too many IDs → 400), unauthenticated → 401 in `packages/backend/tests/021-pr-deliverable-create/analyze-validation.test.ts`
- [ ] T009 [P] Add backend tests for happy-path mock proposal shape, authorized authored/involved PRs, unauthorized foreign PR → 403, and no DB write from analyze in `packages/backend/tests/021-pr-deliverable-create/analyze-mock.test.ts`

**Checkpoint**: Analyze endpoint returns mocked proposals for self-authorized PRs only; contract behaviors covered by backend tests.

---

## Phase 3: User Story 1 - Select PRs and open create-deliverable flow (Priority: P1) 🎯 MVP

**Goal**: On My Pull Requests, Create deliverable is disabled with empty selection, enabled with ≥1 selected (reuse existing checkboxes), and opens a modal in loading state that requests analyze.

**Independent Test**: With rows selected, button enables; click opens modal showing loading and fires analyze with selected UUIDs; with none selected, button stays disabled; unauthenticated users cannot reach the protected page/flow.

### Tests for User Story 1 (MANDATORY)

- [ ] T010 [P] [US1] Add web tests for Create deliverable enablement and opening modal in loading state in `packages/web/tests/021-pr-deliverable-create/select-and-open.us1.test.tsx`
- [ ] T011 [P] [US1] Add i18n key-parity smoke for `createDeliverable` button/loading keys in `packages/web/tests/021-pr-deliverable-create/i18n-parity.us1.test.ts`

### Implementation for User Story 1

- [ ] T012 [P] [US1] Add `analyzeDeliverableFromPullRequests` client in `packages/web/src/services/myPullRequestsApi.ts` (or adjacent `deliverableFromPrsApi.ts`) calling `POST /deliverables/from-pull-requests/analyze`
- [ ] T013 [US1] Create initial `CreateDeliverableFromPrsModal` in `packages/web/src/components/my-pull-requests/CreateDeliverableFromPrsModal.tsx` using `frontend-design` skill + Material UI Dialog (accessible loading/busy state, focus management, responsive layout) with `loading` phase that invokes analyze for `pullRequestIds`
- [ ] T014 [US1] Wire **Create deliverable** button on `packages/web/src/pages/MyPullRequestsPage.tsx` enabled when `selectedIds.size > 0` (alongside existing Change Classification), opening the modal with `[...selectedIds]`
- [ ] T015 [US1] Expand `packages/web/src/locales/{en-US,pt-BR}/prActivity.json` with US1 strings (`createDeliverable.button`, modal title, loading copy); no hard-coded user-visible strings

**Checkpoint**: MVP entry — user can select PRs and open the analyze loading modal.

---

## Phase 4: User Story 2 - Review mocked proposal and cancel (Priority: P1)

**Goal**: Modal transitions from loading to a read-only proposal review with Confirm/Cancel; Cancel closes without creating; analyze errors show recoverable messaging without persistence.

**Independent Test**: Successful analyze shows proposal fields; Confirm is available only after review; Cancel creates zero deliverables; 403/500 from analyze shows error and allows dismiss.

### Tests for User Story 2 (MANDATORY)

- [ ] T016 [P] [US2] Add web tests for loading→review transition, proposal field display, Cancel without create, and analyze error handling in `packages/web/tests/021-pr-deliverable-create/review-proposal.us2.test.tsx`
- [ ] T017 [P] [US2] Add backend/web DAC-oriented coverage that foreign PR IDs cannot produce a reviewable proposal (web mocks 403 / backend already covers) in `packages/web/tests/021-pr-deliverable-create/analyze-forbidden.us2.test.tsx`

### Implementation for User Story 2

- [ ] T018 [US2] Extend `CreateDeliverableFromPrsModal` in `packages/web/src/components/my-pull-requests/CreateDeliverableFromPrsModal.tsx` with `review` and `error` phases: display proposal title/description/role/businessImpact/improvementPoints (+ optional fields), Confirm/Cancel actions, accessible error alerts; ignore late analyze responses after dismiss
- [ ] T019 [US2] Ensure Cancel/dismiss on `packages/web/src/pages/MyPullRequestsPage.tsx` closes the modal without calling `createDeliverable` and without clearing selection (cancel preserves selection per usability; success clearing is US3/US4)
- [ ] T020 [US2] Add review/error i18n keys to `packages/web/src/locales/{en-US,pt-BR}/prActivity.json` (`createDeliverable.review.*`, `createDeliverable.cancel`, `createDeliverable.confirm`, `createDeliverable.errors.*`)

**Checkpoint**: User can review mocked proposal and safely cancel.

---

## Phase 5: User Story 3 - Confirm creation and open deliverable (Priority: P1)

**Goal**: Confirm calls existing `POST /deliverables` with the proposal, shows success with complement link, navigates to `/app/deliverables/:id/edit`, and guards double-submit.

**Independent Test**: Confirm creates one owner deliverable with proposed values; success CTA navigates to edit; create failure shows error without success link; rapid double-click does not issue duplicate creates under UI guard.

### Tests for User Story 3 (MANDATORY)

- [ ] T021 [P] [US3] Add web tests for Confirm → create → success link → navigate to edit, create failure, and double-submit guard in `packages/web/tests/021-pr-deliverable-create/confirm-and-open.us3.test.tsx`
- [ ] T022 [P] [US3] Add integration-style assertion that create payload matches proposal and uses `createDeliverable` from `packages/web/src/services/deliverablesApi.ts` in `packages/web/tests/021-pr-deliverable-create/confirm-payload.us3.test.tsx`

### Implementation for User Story 3

- [ ] T023 [US3] Extend `CreateDeliverableFromPrsModal` in `packages/web/src/components/my-pull-requests/CreateDeliverableFromPrsModal.tsx` with `creating` and `success` phases: call `createDeliverable(accessToken, proposal)`, disable actions while creating, show complement CTA linking to `/app/deliverables/${id}/edit`
- [ ] T024 [US3] On successful create in `packages/web/src/pages/MyPullRequestsPage.tsx`, clear `selectedIds` and support CTA navigation (modal `Link`/`navigate` to edit route)
- [ ] T025 [US3] Add success/create-error i18n keys to `packages/web/src/locales/{en-US,pt-BR}/prActivity.json` (`createDeliverable.success.*`, `createDeliverable.errors.createFailed`)

**Checkpoint**: End-to-end create from selected PRs lands user on deliverable edit.

---

## Phase 6: User Story 4 - Selection edge behaviors (Priority: P2)

**Goal**: Create deliverable stays disabled for empty table / empty selection; changing selection before open changes analyze IDs; post-success selection remains cleared.

**Independent Test**: Empty filtered table → disabled; select then deselect all → disabled; analyze request IDs match latest selection; after success, prior IDs are not still selected.

### Tests for User Story 4 (MANDATORY)

- [ ] T026 [P] [US4] Add web tests for empty-table disablement, toggle enablement, selection→analyze ID mapping, and post-success cleared selection in `packages/web/tests/021-pr-deliverable-create/selection-edge.us4.test.tsx`

### Implementation for User Story 4

- [ ] T027 [US4] Harden selection/enablement edge cases on `packages/web/src/pages/MyPullRequestsPage.tsx` (empty filtered rows, deselect-all, pass current `selectedIds` snapshot into modal open; keep selection cleared after US3 success)
- [ ] T028 [P] [US4] Add any empty-selection helper copy keys to `packages/web/src/locales/{en-US,pt-BR}/prActivity.json` if UI exposes helper text

**Checkpoint**: Selection semantics match FR-002 and US4 acceptance scenarios.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Cross-story quality gates from quickstart and constitution.

- [ ] T029 [P] Expand feature test markdown under `tests/021-pr-deliverable-create/` with concrete acceptance checklists mirroring implemented behavior
- [ ] T030 [P] Add cross-locale parity test covering all `createDeliverable.*` keys for `en-US`/`pt-BR` in `packages/web/tests/021-pr-deliverable-create/i18n-parity-full.test.ts`
- [ ] T031 Run quickstart verification: `npm run test --workspace @em-tool/backend -- --run 021-pr-deliverable-create`, `npm run test --workspace @em-tool/web -- --run 021-pr-deliverable-create`, and `npm run lint`
- [ ] T032 Manual smoke per `specs/021-pr-deliverable-create/quickstart.md` (select → analyze → cancel; select → confirm → edit; unauthorized ID denied)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories that call analyze
- **US1 (Phase 3)**: Depends on Foundational (analyze client + loading modal)
- **US2 (Phase 4)**: Depends on US1 modal shell (extends same component)
- **US3 (Phase 5)**: Depends on US2 review phase (Confirm acts on proposal)
- **US4 (Phase 6)**: Depends on US1 button wiring; post-success clear depends on US3
- **Polish (Phase 7)**: Depends on desired stories complete

### User Story Dependencies

- **US1 (P1)**: After Foundational — MVP entry (button + loading modal)
- **US2 (P1)**: After US1 — review/cancel (extends modal)
- **US3 (P1)**: After US2 — confirm + navigate (extends modal)
- **US4 (P2)**: After US1 (enablement); fully validated after US3 success clear

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Client/helpers before page wiring where marked
- Story complete before moving to next priority when sharing the same modal file

### Parallel Opportunities

- T002, T003, T004 in Setup
- T008, T009 in Foundational (after T005–T007)
- US1 tests T010/T011 in parallel; T012 parallel with early modal work
- US2 tests T016/T017 in parallel
- US3 tests T021/T022 in parallel
- Polish T029/T030 in parallel

---

## Parallel Example: User Story 1

```bash
# Tests in parallel:
Task: "Add web tests for Create deliverable enablement... packages/web/tests/021-pr-deliverable-create/select-and-open.us1.test.tsx"
Task: "Add i18n key-parity smoke... packages/web/tests/021-pr-deliverable-create/i18n-parity.us1.test.ts"

# Then implementation:
Task: "Add analyzeDeliverableFromPullRequests client in packages/web/src/services/myPullRequestsApi.ts"
Task: "Create CreateDeliverableFromPrsModal... packages/web/src/components/my-pull-requests/CreateDeliverableFromPrsModal.tsx"
```

---

## Parallel Example: Foundational backend

```bash
# After service + route land, run tests in parallel:
Task: "analyze-validation.test.ts in packages/backend/tests/021-pr-deliverable-create/"
Task: "analyze-mock.test.ts in packages/backend/tests/021-pr-deliverable-create/"
```

---

## Implementation Strategy

### MVP First (User Story 1 + Foundational)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational analyze API (CRITICAL)
3. Complete Phase 3: US1 button + loading modal
4. **STOP and VALIDATE**: Selection enables action; modal opens and calls analyze

### Incremental Delivery

1. Setup + Foundational → analyze ready
2. US1 → select and open (MVP demo)
3. US2 → review/cancel
4. US3 → confirm and open edit (full value path)
5. US4 → selection edge polish
6. Phase 7 → quickstart + lint/tests green

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Then: Developer A finishes US1→US2 modal phases; Developer B can expand backend mock edge cases / docs in parallel; US3/US4 follow on the shared modal/page files sequentially to avoid conflicts

---

## Notes

- [P] tasks = different files, no incomplete dependencies
- Reuse existing table checkboxes/`selectedIds` — do not rebuild selection (FR-001 already largely satisfied by 020 reclassify work; US1 verifies + wires Create deliverable)
- Confirm MUST use existing `packages/web/src/services/deliverablesApi.ts` `createDeliverable` / `POST /deliverables`
- No real LLM calls; mock only in `deliverableFromPrsService.ts`
- No migrations / no PR↔deliverable join table in v1
- Commit after each task or logical group
- Stop at checkpoints to validate independently
