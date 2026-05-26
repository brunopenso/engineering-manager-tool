# Tasks: Administrator Tag Management

**Input**: Design documents from `/specs/005-admin-tags/`  
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/tags-api.yaml`, `quickstart.md`

**Tests**: Tests are mandatory. Every user story and functional requirement includes automated backend and/or web test tasks.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (`[US1]`, `[US2]`, `[US3]`, `[US4]`) for story-phase tasks only
- Every task includes an explicit file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare baseline contracts and route wiring skeleton for implementation.

- [ ] T001 Validate Tags API contract consistency in `specs/005-admin-tags/contracts/tags-api.yaml` against `specs/005-admin-tags/spec.md`
- [ ] T002 [P] Create backend test scaffold for tags feature in `packages/backend/src/__tests__/tags.setup.test.ts`
- [ ] T003 [P] Create web test scaffold for admin tags route in `packages/web/src/__tests__/admin-tags.setup.test.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data model and shared backend/web infrastructure required by all user stories.

**⚠️ CRITICAL**: No story work begins until this phase is complete.

- [ ] T004 Add `Tag` entity in `packages/backend/src/database/entities/Tag.ts`
- [ ] T005 Register `Tag` entity in ORM configuration in `packages/backend/src/database/ormconfig.ts`
- [ ] T006 Create migration for tags table and unique lower(name) index in `packages/backend/database/migrations/*-AddTags.ts`
- [ ] T007 [P] Add tag validation helpers (name/color/range) in `packages/backend/src/services/tagValidation.ts`
- [ ] T008 [P] Add tag error codes (`DUPLICATE_TAG_NAME`) in `packages/backend/src/auth/types.ts`
- [ ] T009 Create shared tags service CRUD primitives in `packages/backend/src/services/tagService.ts`
- [ ] T010 Create tags API client contract types in `packages/web/src/services/tagsApi.ts`
- [ ] T011 Add admin tags route constants and menu option shell metadata in `packages/web/src/routes/shellOptions.ts`

**Checkpoint**: Foundation complete; user story phases can proceed.

---

## Phase 3: User Story 1 - Administrator creates a tag (Priority: P1) 🎯 MVP

**Goal**: Allow administrators to create tags with valid name/color and persist stable IDs.

**Independent Test**: As administrator, create tag from `/app/admin/tags`; verify persisted row has UUID ID and appears after reload; as non-admin, creation is denied.

### Tests for User Story 1 (MANDATORY)

- [ ] T012 [P] [US1] Add backend integration test for `POST /tags` success in `packages/backend/src/__tests__/tags-create.us1.test.ts`
- [ ] T013 [P] [US1] Add backend integration tests for invalid create payloads (empty name, invalid color) in `packages/backend/src/__tests__/tags-validation.us1.test.ts`
- [ ] T014 [P] [US1] Add backend integration test for duplicate-name create rejection in `packages/backend/src/__tests__/tags-duplicates.us1.test.ts`
- [ ] T015 [P] [US1] Add web test for admin create form submit and success rendering in `packages/web/src/__tests__/admin-tags-create.us1.test.tsx`
- [ ] T016 [P] [US1] Add web test for create form validation and inline errors in `packages/web/src/__tests__/admin-tags-validation.us1.test.tsx`

### Implementation for User Story 1

- [ ] T017 [US1] Implement `createTag` service behavior and duplicate handling in `packages/backend/src/services/tagService.ts`
- [ ] T018 [US1] Implement `POST /tags` route with administrator guard in `packages/backend/src/routes/tags.ts`
- [ ] T019 [US1] Register tags routes in backend bootstrap in `packages/backend/src/index.ts`
- [ ] T020 [US1] Implement admin tags page create form UI using `frontend-design` skill with Material UI in `packages/web/src/pages/AdminTagsPage.tsx`
- [ ] T021 [US1] Wire create API call and optimistic refresh in `packages/web/src/services/tagsApi.ts`
- [ ] T022 [US1] Add `/app/admin/tags` protected route using `AdminRoute` in `packages/web/src/App.tsx`

**Checkpoint**: User Story 1 works independently (admin create + persistence + non-admin denied).

---

## Phase 4: User Story 2 - Administrator views tag catalog (Priority: P1)

**Goal**: Allow administrators to open dedicated screen and view full tag list with name/color and empty state.

**Independent Test**: As administrator, load `/app/admin/tags` and see all tags with color swatches; with no data, empty state appears; non-admin access denied.

### Tests for User Story 2 (MANDATORY)

- [ ] T023 [P] [US2] Add backend integration test for `GET /tags` response shape and authorization in `packages/backend/src/__tests__/tags-list.us2.test.ts`
- [ ] T024 [P] [US2] Add backend integration test for non-admin forbidden list access in `packages/backend/src/__tests__/tags-forbidden.us2.test.ts`
- [ ] T025 [P] [US2] Add web test for admin catalog rendering (name + color swatch) in `packages/web/src/__tests__/admin-tags-list.us2.test.tsx`
- [ ] T026 [P] [US2] Add web test for empty-state rendering in `packages/web/src/__tests__/admin-tags-empty-state.us2.test.tsx`
- [ ] T027 [P] [US2] Add web route-guard test for non-admin redirect from `/app/admin/tags` in `packages/web/src/__tests__/admin-tags-forbidden.us2.test.tsx`

### Implementation for User Story 2

- [ ] T028 [US2] Implement `listTags` service with stable ordering in `packages/backend/src/services/tagService.ts`
- [ ] T029 [US2] Implement `GET /tags` route in `packages/backend/src/routes/tags.ts`
- [ ] T030 [US2] Add admin-only shell navigation option for tags management in `packages/web/src/routes/shellOptions.ts`
- [ ] T031 [US2] Implement tags list table and empty state using `frontend-design` skill with Material UI in `packages/web/src/pages/AdminTagsPage.tsx`
- [ ] T032 [US2] Implement `listTags` API client and data-loading hook in `packages/web/src/services/tagsApi.ts`

**Checkpoint**: User Stories 1 and 2 each run independently (create and view).

---

## Phase 5: User Story 3 - Administrator updates a tag (Priority: P2)

**Goal**: Allow administrators to edit tag name/color while preserving tag ID and enforcing validation/uniqueness.

**Independent Test**: As administrator, update color and name; verify ID unchanged and duplicate/invalid updates rejected; non-admin update denied.

### Tests for User Story 3 (MANDATORY)

- [ ] T033 [P] [US3] Add backend integration test for `PATCH /tags/:tagId` success with ID stability in `packages/backend/src/__tests__/tags-update.us3.test.ts`
- [ ] T034 [P] [US3] Add backend integration test for duplicate/invalid update rejection in `packages/backend/src/__tests__/tags-update-validation.us3.test.ts`
- [ ] T035 [P] [US3] Add backend integration test for non-admin forbidden update in `packages/backend/src/__tests__/tags-update-forbidden.us3.test.ts`
- [ ] T036 [P] [US3] Add web test for inline edit/save update flow in `packages/web/src/__tests__/admin-tags-update.us3.test.tsx`
- [ ] T037 [P] [US3] Add web test for update validation and duplicate error messaging in `packages/web/src/__tests__/admin-tags-update-errors.us3.test.tsx`

### Implementation for User Story 3

- [ ] T038 [US3] Implement `updateTag` service behavior (partial update, duplicate checks, stable ID) in `packages/backend/src/services/tagService.ts`
- [ ] T039 [US3] Implement `PATCH /tags/:tagId` route in `packages/backend/src/routes/tags.ts`
- [ ] T040 [US3] Implement update API client method in `packages/web/src/services/tagsApi.ts`
- [ ] T041 [US3] Implement edit form interactions using `frontend-design` skill with Material UI in `packages/web/src/pages/AdminTagsPage.tsx`

**Checkpoint**: User Story 3 independently complete and testable.

---

## Phase 6: User Story 4 - Administrator deletes a tag (Priority: P3)

**Goal**: Allow administrators to delete tags with explicit confirmation and predictable not-found behavior.

**Independent Test**: As administrator, delete a tag after confirmation and verify it disappears after reload; deleting missing tag returns clear error; non-admin delete denied.

### Tests for User Story 4 (MANDATORY)

- [ ] T042 [P] [US4] Add backend integration test for `DELETE /tags/:tagId` success (`204`) in `packages/backend/src/__tests__/tags-delete.us4.test.ts`
- [ ] T043 [P] [US4] Add backend integration test for delete not-found behavior in `packages/backend/src/__tests__/tags-delete-not-found.us4.test.ts`
- [ ] T044 [P] [US4] Add backend integration test for non-admin forbidden delete in `packages/backend/src/__tests__/tags-delete-forbidden.us4.test.ts`
- [ ] T045 [P] [US4] Add web test for delete confirmation workflow in `packages/web/src/__tests__/admin-tags-delete.us4.test.tsx`
- [ ] T046 [P] [US4] Add web test for delete failure messaging (already deleted/not found) in `packages/web/src/__tests__/admin-tags-delete-errors.us4.test.tsx`

### Implementation for User Story 4

- [ ] T047 [US4] Implement `deleteTag` service behavior in `packages/backend/src/services/tagService.ts`
- [ ] T048 [US4] Implement `DELETE /tags/:tagId` route in `packages/backend/src/routes/tags.ts`
- [ ] T049 [US4] Implement delete API client method in `packages/web/src/services/tagsApi.ts`
- [ ] T050 [US4] Implement delete confirmation dialog using `frontend-design` skill with Material UI in `packages/web/src/pages/AdminTagsPage.tsx`

**Checkpoint**: All user stories complete and independently testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, documentation sync, and regression verification.

- [ ] T051 [P] Update feature quickstart with final implemented commands and screenshots references in `specs/005-admin-tags/quickstart.md`
- [ ] T052 [P] Add end-to-end regression scenario notes for tags in `specs/005-admin-tags/plan.md`
- [ ] T053 Run backend lint/tests for tags scope in `packages/backend/package.json` scripts invocation
- [ ] T054 Run web lint/tests for tags scope in `packages/web/package.json` scripts invocation
- [ ] T055 Run full workspace verification (`build`, `lint`, `test`) from `package.json` workspace root scripts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Starts immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2; MVP slice.
- **Phase 4 (US2)**: Depends on Phase 2; can run parallel with US1 after core route/entity work exists.
- **Phase 5 (US3)**: Depends on Phase 2 and benefits from US1/US2 artifacts (`tags.ts`, `AdminTagsPage.tsx`).
- **Phase 6 (US4)**: Depends on Phase 2 and shared CRUD scaffolding from earlier stories.
- **Phase 7 (Polish)**: Depends on all selected story phases complete.

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories once foundation is complete.
- **US2 (P1)**: Independent from US1 from a business perspective; shares route/page files technically.
- **US3 (P2)**: Depends on base create/list plumbing but remains independently testable.
- **US4 (P3)**: Depends on base create/list plumbing but remains independently testable.

### Within Each User Story

- Write tests first and confirm they fail.
- Implement service logic before route handlers.
- Implement backend API before web API client integration.
- Implement UI interactions after API client methods exist.
- Validate story independently before moving on.

---

## Parallel Opportunities

- Foundational parallel tasks: `T007`, `T008`, `T010`, `T011`.
- US1 parallel test tasks: `T012`–`T016`.
- US2 parallel test tasks: `T023`–`T027`.
- US3 parallel test tasks: `T033`–`T037`.
- US4 parallel test tasks: `T042`–`T046`.
- Polish parallel tasks: `T051`, `T052`.

---

## Parallel Example: User Story 1

```bash
# Run US1 tests in parallel:
Task: "T012 [US1] Backend POST /tags success test in packages/backend/src/__tests__/tags-create.us1.test.ts"
Task: "T013 [US1] Backend create validation tests in packages/backend/src/__tests__/tags-validation.us1.test.ts"
Task: "T015 [US1] Web create flow test in packages/web/src/__tests__/admin-tags-create.us1.test.tsx"

# Build US1 implementation in parallel where safe:
Task: "T018 [US1] Implement POST /tags route in packages/backend/src/routes/tags.ts"
Task: "T020 [US1] Implement create form UI in packages/web/src/pages/AdminTagsPage.tsx"
```

## Parallel Example: User Story 2

```bash
Task: "T023 [US2] Backend list route test in packages/backend/src/__tests__/tags-list.us2.test.ts"
Task: "T025 [US2] Web catalog rendering test in packages/web/src/__tests__/admin-tags-list.us2.test.tsx"
Task: "T027 [US2] Web non-admin redirect test in packages/web/src/__tests__/admin-tags-forbidden.us2.test.tsx"
```

## Parallel Example: User Story 3

```bash
Task: "T033 [US3] Backend update success test in packages/backend/src/__tests__/tags-update.us3.test.ts"
Task: "T036 [US3] Web inline edit test in packages/web/src/__tests__/admin-tags-update.us3.test.tsx"
```

## Parallel Example: User Story 4

```bash
Task: "T042 [US4] Backend delete success test in packages/backend/src/__tests__/tags-delete.us4.test.ts"
Task: "T045 [US4] Web delete confirmation test in packages/web/src/__tests__/admin-tags-delete.us4.test.tsx"
```

---

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 and Phase 2.
2. Deliver Phase 3 (US1 create flow end-to-end).
3. Validate SC-001 and authorization denial for non-admin create.
4. Demo MVP.

### Incremental Delivery

1. Add US2 (catalog view + empty state).
2. Add US3 (update behavior + validation).
3. Add US4 (delete with confirmation).
4. Run Phase 7 full regression and release readiness checks.

### Parallel Team Strategy

1. Team aligns on Phase 2 contracts and foundational model.
2. After Phase 2:
   - Dev A: Backend CRUD endpoints (`routes/tags.ts`, `services/tagService.ts`)
   - Dev B: Web admin tags page and route/menu integration
   - Dev C: Backend + web automated test suites
3. Merge per-story checkpoints to keep each increment independently verifiable.

---

## Notes

- `[P]` tasks indicate different files and low merge-conflict risk.
- All story tasks include explicit file paths for direct execution.
- Frontend tasks for the admin tags screen explicitly require the `frontend-design` skill.
- This feature excludes tag assignment to other entities in v1 by design.
