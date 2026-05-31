# Tasks: Deliverable Review Notes

**Input**: Design documents from `/specs/011-deliverable-review-notes/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are MANDATORY for this feature. Every user story and requirement must include automated test coverage before merge.

**Organization**: Tasks are grouped by user story to allow independent implementation and validation.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare feature scaffolding, acceptance mapping docs, and test directories.

- [ ] T001 Create acceptance test plan files in `tests/011-deliverable-review-notes/` (`deliverable-review-notes-save.us1.test.md`, `deliverable-review-notes-load.us2.test.md`, `deliverable-review-notes-isolation.us3.test.md`, `deliverable-review-notes-dac.us4.test.md`)
- [ ] T002 Create backend test directory and shared bootstrap in `packages/backend/tests/deliverable-review-notes/deliverable-review-notes.setup.ts`
- [ ] T003 [P] Create web test directory and shared bootstrap in `packages/web/tests/deliverable-review-notes/deliverable-review-notes.setup.test.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Migration, entity extension, DTOs, review service methods, and API client skeleton required by all stories.

**⚠️ CRITICAL**: No user story work starts until this phase is complete.

- [ ] T004 Add TypeORM migration adding nullable `notes` column to `deliverable_reviews` in `packages/backend/database/migrations/*-AddDeliverableReviewNotes.ts`
- [ ] T005 [P] Extend `DeliverableReview` entity with optional `notes` text column in `packages/backend/src/database/entities/DeliverableReview.ts`
- [ ] T006 [P] Define review notes DTO types in `packages/backend/src/types/deliverableReviewNotes.ts`
- [ ] T007 Implement `getReviewNotes(deliverableId, reviewerUserId)` in `packages/backend/src/services/deliverableReviewService.ts`
- [ ] T008 Implement `saveReviewNotes(deliverableId, reviewerUserId, notes)` with trim, 8000-char validation, upsert, and auto-reviewed on non-empty save in `packages/backend/src/services/deliverableReviewService.ts`
- [ ] T009 Refactor `setDeliverableReviewed(false)` to preserve `notes` (set `reviewed = false` when notes present; delete row only when notes empty) in `packages/backend/src/services/deliverableReviewService.ts`
- [ ] T010 [P] Add `deliverableReviewNotesApi.ts` client module skeleton with typed request/response shapes in `packages/web/src/services/deliverableReviewNotesApi.ts`

**Checkpoint**: Foundation complete — user stories can proceed.

---

## Phase 3: User Story 1 - Leader writes and saves review notes (Priority: P1) 🎯 MVP

**Goal**: Leader opens Review modal Notes tab, writes coaching notes, saves with confirmation, and sees the deliverable auto-marked reviewed for that leader on the Team Deliverables table.

**Independent Test**: Open Review → Notes, enter text, Save → success feedback; table shows reviewed; reopen modal → notes unchanged.

### Tests for User Story 1 (MANDATORY)

- [ ] T011 [P] [US1] Align acceptance test plan with contract in `tests/011-deliverable-review-notes/deliverable-review-notes-save.us1.test.md` and `specs/011-deliverable-review-notes/contracts/deliverable-review-notes-api.yaml`
- [ ] T012 [P] [US1] Add backend integration test for `PUT /deliverables/:id/review-notes` (persist notes, auto-reviewed on non-empty save, validation over 8000 chars) in `packages/backend/tests/deliverable-review-notes/deliverable-review-notes-save.us1.test.ts`
- [ ] T013 [P] [US1] Add backend test that empty save clears notes without changing reviewed in `packages/backend/tests/deliverable-review-notes/deliverable-review-notes-save.us1.test.ts`
- [ ] T014 [P] [US1] Add web test for Notes tab save flow with success feedback and reviewed table sync in `packages/web/tests/deliverable-review-notes/deliverable-review-notes-save.us1.test.tsx`

### Implementation for User Story 1

- [ ] T015 [US1] Register `PUT /deliverables/:deliverableId/review-notes` with bearer auth, leader guard, and `assertCanReadDeliverables` in `packages/backend/src/routes/deliverables.ts`
- [ ] T016 [US1] Implement `saveReviewNotes` client method in `packages/web/src/services/deliverableReviewNotesApi.ts`
- [ ] T017 [US1] Create `DeliverableReviewNotesPanel.tsx` using `frontend-design` skill (multiline TextField max 8000, Save button, saving/disabled states, success/error Alert) in `packages/web/src/components/team-deliverables/DeliverableReviewNotesPanel.tsx`
- [ ] T018 [US1] Wire Save action to call `saveReviewNotes` and surface confirmation in `packages/web/src/components/team-deliverables/DeliverableReviewNotesPanel.tsx`
- [ ] T019 [US1] Replace Notes tab placeholder with `DeliverableReviewNotesPanel` in `packages/web/src/components/team-deliverables/TeamDeliverableReviewModal.tsx`
- [ ] T020 [US1] Add optional `onReviewedChange(deliverableId, reviewed)` prop to `TeamDeliverableReviewModal.tsx` and invoke after successful save when `reviewed === true`
- [ ] T021 [US1] Pass `onReviewedChange` from `LeaderTeamDeliverablesPage.tsx` to update local `deliverables` reviewed state without full re-search in `packages/web/src/pages/LeaderTeamDeliverablesPage.tsx`

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Leader views existing notes when returning (Priority: P1)

**Goal**: Leader reopens Notes tab and sees previously saved notes with loading, empty-state guidance, and recoverable error on load failure.

**Independent Test**: Save notes, close modal, reopen Notes tab → prior text shown; first visit shows empty guidance; simulated load error shows retry without losing draft.

### Tests for User Story 2 (MANDATORY)

- [ ] T022 [P] [US2] Add load acceptance mapping in `tests/011-deliverable-review-notes/deliverable-review-notes-load.us2.test.md`
- [ ] T023 [P] [US2] Add backend integration test for `GET /deliverables/:id/review-notes` (returns own notes, defaults when no row) in `packages/backend/tests/deliverable-review-notes/deliverable-review-notes-load.us2.test.ts`
- [ ] T024 [P] [US2] Add web test for lazy load on tab switch, empty state, and load error with retry in `packages/web/tests/deliverable-review-notes/deliverable-review-notes-load.us2.test.tsx`

### Implementation for User Story 2

- [ ] T025 [US2] Register `GET /deliverables/:deliverableId/review-notes` with bearer auth, leader guard, and `assertCanReadDeliverables` in `packages/backend/src/routes/deliverables.ts`
- [ ] T026 [US2] Implement `getReviewNotes` client method in `packages/web/src/services/deliverableReviewNotesApi.ts`
- [ ] T027 [US2] Lazy-load notes when Notes tab becomes active (`activeTab === 1`) with loading spinner in `packages/web/src/components/team-deliverables/DeliverableReviewNotesPanel.tsx`
- [ ] T028 [US2] Add empty-state guidance when no notes exist in `packages/web/src/components/team-deliverables/DeliverableReviewNotesPanel.tsx`
- [ ] T029 [US2] Add load error Alert with retry that preserves unsaved draft text in `packages/web/src/components/team-deliverables/DeliverableReviewNotesPanel.tsx`

**Checkpoint**: User Stories 1 and 2 are independently functional and testable.

---

## Phase 5: User Story 3 - Independent notes per leader (Priority: P2)

**Goal**: Multiple leaders on the same deliverable each see and save only their own notes; one leader's save does not change another's reviewed indicator.

**Independent Test**: Leader A saves notes; Leader B sees empty notes on same deliverable; Leader B saves separately; each leader reads back only their own content.

### Tests for User Story 3 (MANDATORY)

- [ ] T030 [P] [US3] Add isolation acceptance mapping in `tests/011-deliverable-review-notes/deliverable-review-notes-isolation.us3.test.md`
- [ ] T031 [P] [US3] Add backend tests for two leaders with distinct notes and independent reviewed state in `packages/backend/tests/deliverable-review-notes/deliverable-review-notes-isolation.us3.test.ts`
- [ ] T032 [P] [US3] Add web test confirming notes panel loads only the logged-in leader's content in `packages/web/tests/deliverable-review-notes/deliverable-review-notes-isolation.us3.test.tsx`

### Implementation for User Story 3

- [ ] T033 [US3] Verify service queries always scope `reviewer_user_id = actor` (document in code comment if already enforced) in `packages/backend/src/services/deliverableReviewService.ts`
- [ ] T034 [US3] Add backend test asserting Leader A save does not mutate Leader B review row in `packages/backend/tests/deliverable-review-notes/deliverable-review-notes-isolation.us3.test.ts`

**Checkpoint**: User Story 3 is independently functional and testable.

---

## Phase 6: User Story 4 - DAC enforcement for review notes (Priority: P2)

**Goal**: Notes endpoints deny peers, subordinates, non-leaders, and unauthenticated access; authorized superiors in chain may read/write own notes only.

**Independent Test**: Peer GET/PUT → 403; non-leader → 403; unauthenticated → 401; authorized leader → 200.

### Tests for User Story 4 (MANDATORY)

- [ ] T035 [P] [US4] Add DAC acceptance mapping in `tests/011-deliverable-review-notes/deliverable-review-notes-dac.us4.test.md`
- [ ] T036 [P] [US4] Add backend DAC deny tests (peer, subordinate-upward, non-leader, unauthenticated) for GET and PUT in `packages/backend/tests/deliverable-review-notes/deliverable-review-notes-dac.us4.test.ts`
- [ ] T037 [P] [US4] Add backend DAC allow test for authorized superior in chain in `packages/backend/tests/deliverable-review-notes/deliverable-review-notes-dac.us4.test.ts`

### Implementation for User Story 4

- [ ] T038 [US4] Ensure consistent 403/401 error payloads without note content leakage on deny paths in `packages/backend/src/routes/deliverables.ts`
- [ ] T039 [US4] Add web test for error state when notes API returns 403 in `packages/web/tests/deliverable-review-notes/deliverable-review-notes-dac.us4.test.tsx`

**Checkpoint**: User Story 4 is independently functional and testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Reviewed-toggle compatibility, regression coverage, and full verification.

- [ ] T040 [P] Add backend test that `PUT /deliverables/:id/reviewed` with `reviewed: false` preserves existing notes in `packages/backend/tests/deliverable-review-notes/deliverable-review-notes-reviewed-toggle.test.ts`
- [ ] T041 [P] Update existing team-deliverables reviewed tests if `setDeliverableReviewed` behavior changed in `packages/backend/tests/team-deliverables/team-deliverables-reviewed.us3.test.ts`
- [ ] T042 [P] Update web test that asserted Notes placeholder text in `packages/web/tests/team-deliverables/team-deliverables-reviewed.us3.test.tsx`
- [ ] T043 Run full test suite from repository root per `specs/011-deliverable-review-notes/quickstart.md` and fix regressions
- [ ] T044 [P] Verify OpenAPI contract matches implemented routes in `specs/011-deliverable-review-notes/contracts/deliverable-review-notes-api.yaml`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **blocks all user stories**
- **User Stories (Phases 3–6)**: Depend on Foundational completion
  - US1 (save) can start first as MVP; US2 (load) should follow or overlap once GET route is ready
  - US3 and US4 primarily add test evidence; can run in parallel after US1/US2 core routes exist
- **Polish (Phase 7)**: Depends on all user story phases

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational — no dependency on other stories; MVP
- **User Story 2 (P1)**: After Foundational — integrates with US1 panel but independently testable via GET-only scenarios
- **User Story 3 (P2)**: After US1/US2 service and routes exist
- **User Story 4 (P2)**: After US1/US2 routes exist

### Within Each User Story

- Tests written first and must fail before implementation
- Backend service before routes; routes before web client; client before UI wiring
- Story checkpoint before next priority

### Parallel Opportunities

- T002 and T003 (setup bootstraps)
- T005, T006, T010 (entity, types, client skeleton) after T004 migration started
- All test tasks marked [P] within a story phase
- US3 and US4 test tasks can run in parallel once core endpoints land
- T040, T041, T042, T044 in Polish phase

---

## Parallel Example: User Story 1

```bash
# Tests first (parallel):
T011 — acceptance mapping vs contract
T012 — backend PUT save + auto-reviewed
T013 — backend empty save behavior
T014 — web save + table sync

# Then implementation sequence:
T015 → T016 → T017 → T018 → T019 → T020 → T021
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (save + auto-reviewed + table sync)
4. **STOP and VALIDATE**: Leader can save notes and see reviewed update
5. Add Phase 4 (load) before considering feature complete for daily use

### Incremental Delivery

1. Setup + Foundational → schema and service ready
2. US1 Save → test independently → demo MVP
3. US2 Load → test independently → demo full Notes tab
4. US3 Isolation + US4 DAC → test independently → demo security
5. Polish → reviewed-toggle compatibility and regression

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Developer A: US1 implementation; Developer B: US1/US2 tests
3. After routes land: Developer C: US3/US4 DAC tests in parallel
4. Polish phase: regression and contract alignment

---

## Notes

- Reuse `assertCanReadDeliverables` for review-notes routes (not `assertUserInLeaderSubtree` alone) per `specs/011-deliverable-review-notes/research.md` Decision 3
- Auto-reviewed applies on **non-empty** trimmed save only; empty save clears notes without clearing reviewed
- `frontend-design` skill required for `DeliverableReviewNotesPanel.tsx`
- Feature builds on feature 010 Team Deliverables modal and `deliverable_reviews` table — no new tables
- Total tasks: **44** (Setup 3, Foundational 7, US1 11, US2 8, US3 5, US4 5, Polish 5)
