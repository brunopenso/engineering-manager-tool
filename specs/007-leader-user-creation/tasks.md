# Tasks: Leader User Creation

**Input**: Design documents from `/specs/007-leader-user-creation/`  
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/leader-user-creation-api.yaml`, `quickstart.md`

**Tests**: Tests are mandatory. Every user story and functional requirement includes automated backend and/or web test tasks.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (`[US1]`–`[US3]`) for story-phase tasks only
- Every task includes an explicit file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Validate contracts and prepare test scaffolds.

- [x] T001 Validate Leader User Creation API contract consistency in `specs/007-leader-user-creation/contracts/leader-user-creation-api.yaml` against `specs/007-leader-user-creation/spec.md`
- [x] T002 [P] Create backend test scaffold for leader user creation in `packages/backend/src/__tests__/leader-user-creation.setup.test.ts`
- [x] T003 [P] Create web test scaffold for leader create-user route in `packages/web/src/__tests__/leader-user-creation.setup.test.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Persistence for leader linkage and creation audit, shared authorization/validation, and web route primitives required by all user stories.

**⚠️ CRITICAL**: No user story work begins until this phase is complete.

- [x] T004 Add nullable `leader_id` FK column on `users` in migration `packages/backend/database/migrations/*-AddUserLeaderRelationship.ts`
- [x] T005 [P] Add `UserCreationAudit` entity in `packages/backend/src/database/entities/UserCreationAudit.ts`
- [x] T006 Map `leaderId` on `User` entity in `packages/backend/src/database/entities/User.ts`
- [x] T007 Register `UserCreationAudit` and updated `User` in `packages/backend/src/database/connection.ts`
- [x] T008 [P] Add leader-create error codes (e.g. `LEADER_REQUIRED`, `USER_CREATE_FORBIDDEN`) in `packages/backend/src/auth/types.ts`
- [x] T009 Add `assertLeaderRole` throw helper in `packages/backend/src/services/authorizationService.ts`
- [x] T010 [P] Add leader create request validation (name, email, duplicate email) in `packages/backend/src/services/userCreateValidation.ts`
- [x] T011 Add `createUserByLeader` service (set `leaderId` to actor, persist audit row, ensure `COLLABORATOR` role) in `packages/backend/src/services/userService.ts`
- [x] T012 [P] Add leader create-user API types and `createUser` client stub in `packages/web/src/services/usersApi.ts`
- [x] T013 [P] Add `LEADER_CREATE_USER_ROUTE` constant in `packages/web/src/routes/shellOptions.ts`
- [x] T014 [P] Create `LeaderRoute` guard component in `packages/web/src/auth/LeaderRoute.tsx`
- [x] T015 [P] Add leader/ non-leader test fixtures in `packages/backend/src/test/fixtures/leaderUserCreation.ts`

**Checkpoint**: Foundation complete; user story phases can proceed.

---

## Phase 3: User Story 1 - Leader creates a new user from UI (Priority: P1) 🎯 MVP

**Goal**: A leader can open the dedicated create screen, submit valid data, and the system persists a new user with the creator as leader.

**Independent Test**: As leader, `POST /users` with valid payload returns 201 and `leaderId` equals creator; leader can complete create flow on `/app/leader/users/new` with success feedback.

### Tests for User Story 1 (MANDATORY)

- [x] T016 [P] [US1] Add backend integration test for leader `POST /users` success and `leaderId` assignment in `packages/backend/src/__tests__/users-create-leader.us1.test.ts`
- [x] T017 [P] [US1] Add backend integration tests for create validation failures (missing fields, duplicate email) in `packages/backend/src/__tests__/users-create-validation.us1.test.ts`
- [x] T018 [P] [US1] Add web test for leader create form submit and success state in `packages/web/src/__tests__/leader-create-user.us1.test.tsx`
- [x] T019 [P] [US1] Add web test for leader route/menu visibility for leader role in `packages/web/src/__tests__/leader-create-user-route.us1.test.tsx`

### Implementation for User Story 1

- [x] T020 [US1] Implement leader-only `POST /users` route in `packages/backend/src/routes/users.ts`
- [x] T021 [US1] Map create response DTO (`leaderId`, `createdByUserId`) in `packages/backend/src/services/authUserMapper.ts` or dedicated mapper in `packages/backend/src/services/userService.ts`
- [x] T022 [US1] Implement `createUser` API client method in `packages/web/src/services/usersApi.ts`
- [x] T023 [US1] Implement `LeaderCreateUserPage` create form with success/error feedback using `frontend-design` skill with Material UI in `packages/web/src/pages/LeaderCreateUserPage.tsx`
- [x] T024 [US1] Register `/app/leader/users/new` route with `LeaderRoute` in `packages/web/src/App.tsx`
- [x] T025 [US1] Expose leader-only shell menu entry via `getVisibleShellMenuOptions` in `packages/web/src/routes/shellOptions.ts`

**Checkpoint**: User Story 1 works independently (leader create + persistence + UI success path).

---

## Phase 4: User Story 2 - Non-leader access is blocked (Priority: P2)

**Goal**: Non-leaders cannot access the create screen or invoke user creation; no user is persisted on deny.

**Independent Test**: Collaborator-only session receives 403 on `POST /users` and cannot access `/app/leader/users/new` (redirect or permission message).

### Tests for User Story 2 (MANDATORY)

- [x] T026 [P] [US2] Add backend integration test for non-leader `POST /users` forbidden in `packages/backend/src/__tests__/users-create-deny.us2.test.ts`
- [x] T027 [P] [US2] Add web test for non-leader blocked route access in `packages/web/src/__tests__/leader-create-user-deny.us2.test.tsx`
- [x] T028 [P] [US2] Add web test confirming create menu entry hidden for non-leaders in `packages/web/src/__tests__/leader-create-user-menu-deny.us2.test.tsx`

### Implementation for User Story 2

- [x] T029 [US2] Enforce `assertLeaderRole` at start of `POST /users` handler in `packages/backend/src/routes/users.ts`
- [x] T030 [US2] Return stable 403 payload for non-leader create attempts in `packages/backend/src/routes/users.ts`
- [x] T031 [US2] Hide leader create menu entry for non-leaders in `packages/web/src/routes/shellOptions.ts`
- [x] T032 [US2] Add permission-denied UX for direct route access in `packages/web/src/auth/LeaderRoute.tsx`

**Checkpoint**: User Stories 1 and 2 each run independently (allow + deny paths).

---

## Phase 5: User Story 3 - Leader assignment is immutable at create time (Priority: P3)

**Goal**: Leader assignment is never client-selectable; server always stores creator as leader even when payload includes a conflicting `leaderId`.

**Independent Test**: Leader `POST /users` with tampered `leaderId` still persists creator as leader; UI shows automatic assignment context without editable leader selector.

### Tests for User Story 3 (MANDATORY)

- [x] T033 [P] [US3] Add backend integration test ignoring/rejecting tampered `leaderId` on create in `packages/backend/src/__tests__/users-create-leader-override.us3.test.ts`
- [x] T034 [P] [US3] Add web test asserting no leader selector and visible auto-assignment copy in `packages/web/src/__tests__/leader-create-user-assignment.us3.test.tsx`

### Implementation for User Story 3

- [x] T035 [US3] Strip or reject client `leaderId` and force actor assignment in `packages/backend/src/services/userService.ts`
- [x] T036 [US3] Display non-editable "Leader assigned automatically to you" context on create form using `frontend-design` skill in `packages/web/src/pages/LeaderCreateUserPage.tsx`
- [x] T037 [US3] Omit `leaderId` from web create request payload in `packages/web/src/services/usersApi.ts`

**Checkpoint**: All user stories independently functional with assignment integrity enforced.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, audit verification, and regression validation across stories.

- [x] T038 [P] Add backend test for revoked-leader deny on create in `packages/backend/src/__tests__/users-create-revoked-leader.test.ts`
- [x] T039 [P] Add backend test preventing duplicate unintended user on repeated identical email in `packages/backend/src/__tests__/users-create-duplicate-email.test.ts`
- [x] T040 Verify `user_creation_audits` row written per successful create in `packages/backend/src/__tests__/users-create-audit.test.ts`
- [ ] T041 Run quickstart manual and automated validation checklist in `specs/007-leader-user-creation/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **blocks all user stories**
- **User Stories (Phase 3–5)**: Depend on Foundational completion
- **Polish (Phase 6)**: Depends on desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational — no dependency on US2/US3
- **User Story 2 (P2)**: Starts after Foundational — independently testable; reuses US1 route but adds deny coverage
- **User Story 3 (P3)**: Starts after Foundational — strengthens US1 create path; independently testable via tampered-payload tests

### Within Each User Story

- Write tests first and confirm they fail before implementation
- Models/migration before services
- Services before routes
- Backend before or in parallel with web (web depends on API contract from Foundational/US1)

### Parallel Opportunities

- T002 and T003 (setup scaffolds)
- T005, T008, T010, T012–T015 (foundational, different files)
- All `[P]` tests within a user story phase
- US2 and US3 can proceed in parallel after Foundational if US1 backend route exists

---

## Parallel Example: User Story 1

```bash
# Tests in parallel:
packages/backend/src/__tests__/users-create-leader.us1.test.ts
packages/backend/src/__tests__/users-create-validation.us1.test.ts
packages/web/src/__tests__/leader-create-user.us1.test.tsx
packages/web/src/__tests__/leader-create-user-route.us1.test.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Leader can create user with correct leader assignment
5. Demo/deploy if ready

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. User Story 1 → leader create MVP
3. User Story 2 → non-leader deny hardening
4. User Story 3 → assignment integrity hardening
5. Polish → edge cases and quickstart validation

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Then split:
   - Developer A: US1 (API + page)
   - Developer B: US2 (deny paths)
   - Developer C: US3 (tamper + UI assignment copy)

---

## Notes

- `POST /users` is leader-only for this feature; existing administrator list/role routes remain unchanged
- New users created by leaders still receive default `COLLABORATOR` role via `roleService` (elevated roles remain administrator-managed)
- Organizational hierarchy resolver is not required for this feature; `leader_id` on `users` establishes the reporting link for future DAC work
- Every screen task must use the `frontend-design` skill with Material UI best practices
