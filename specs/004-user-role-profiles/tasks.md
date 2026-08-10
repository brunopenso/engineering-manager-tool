# Tasks: User Role Profiles

**Input**: Design documents from `/specs/004-user-role-profiles/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/user-roles-api.yaml, quickstart.md

**Tests**: Mandatory — spec requires automated tests for every user story and requirement.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Backend test tooling, shared role types, and environment scaffolding

- [ ] T001 Add `test` script and Vitest devDependencies in `packages/backend/package.json`
- [ ] T002 Create Vitest configuration for Node integration tests in `packages/backend/vitest.config.ts`
- [ ] T003 [P] Create backend test database/setup helpers in `packages/backend/src/test/setup.ts`
- [ ] T004 [P] Add `BOOTSTRAP_ADMIN_EMAILS` template in `packages/backend/.env.example`
- [ ] T005 [P] Add `UserRoleType` enum and extend auth error codes in `packages/backend/src/auth/types.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Persistence, services, and request-context role loading required by all stories

**CRITICAL**: No user story work starts until this phase is complete

- [ ] T006 [P] Create `UserRole` entity in `packages/backend/src/database/entities/UserRole.ts`
- [ ] T007 [P] Create `RoleAssignmentEvent` entity in `packages/backend/src/database/entities/RoleAssignmentEvent.ts`
- [ ] T008 Update `User` entity with role relationships in `packages/backend/src/database/entities/User.ts`
- [ ] T009 Create migration for `user_roles`, `role_assignment_events`, collaborator backfill, and optional admin bootstrap in `packages/backend/database/migrations/202605250001-add-user-roles-and-role-assignment-events.ts`
- [ ] T010 Register new entities in `packages/backend/src/database/connection.ts`
- [ ] T011 Implement `roleService` (loadRoles, grant, revoke, idempotent rules) in `packages/backend/src/services/roleService.ts`
- [ ] T012 [P] Implement `authorizationService` (`hasRole`, `requireAdministrator`) in `packages/backend/src/services/authorizationService.ts`
- [ ] T013 Extend `mapUserToAuthResponse` to include `roles` in `packages/backend/src/services/authUserMapper.ts`
- [ ] T014 Load active roles into request context after token verification in `packages/backend/src/middleware/auth.ts`
- [ ] T015 Create `users` route module skeleton in `packages/backend/src/routes/users.ts`
- [ ] T016 Register `users` routes in `packages/backend/src/index.ts`
- [ ] T017 [P] Create backend role test fixtures in `packages/backend/src/test/fixtures/roles.ts`
- [ ] T018 [P] Create web contract fixture for role payloads in `packages/web/src/test/fixtures/userRolesContract.ts`

**Checkpoint**: Foundation complete — user stories can proceed

---

## Phase 3: User Story 1 - Default collaborator profile on sign-in (Priority: P1) 🎯 MVP

**Goal**: Every user always has `COLLABORATOR` at account creation, backfill, and in auth responses

**Independent Test**: Sign in (new and returning user) and verify `/auth/google/login` and `/auth/me` return `roles` containing `COLLABORATOR` only when no elevated roles exist

### Tests for User Story 1 (MANDATORY)

- [ ] T019 [P] [US1] Integration test: first login returns `COLLABORATOR` in `packages/backend/src/__tests__/roles-collaborator-default.us1.test.ts`
- [ ] T020 [P] [US1] Unit test: revoke/grant APIs reject `COLLABORATOR` changes in `packages/backend/src/__tests__/roles-collaborator-immutable.us1.test.ts`

### Implementation for User Story 1

- [ ] T021 [US1] Ensure `COLLABORATOR` insert on user create/update in `packages/backend/src/services/userService.ts`
- [ ] T022 [US1] Return `roles` in `POST /auth/google/login` in `packages/backend/src/routes/auth.ts`
- [ ] T023 [US1] Return `roles` in `GET /auth/me` in `packages/backend/src/routes/auth.ts`
- [ ] T024 [P] [US1] Extend `AuthUser` with `roles` in `packages/web/src/auth/AuthProvider.tsx`
- [ ] T025 [US1] Parse `roles` from login/me responses in `packages/web/src/services/authApi.ts`

**Checkpoint**: User Story 1 independently functional — all users have collaborator in API/session

---

## Phase 4: User Story 2 - View own role profile (Priority: P1)

**Goal**: Signed-in users see their active roles on a profile screen; others cannot view arbitrary user role data

**Independent Test**: Open `/app/profile` as collaborator-only and as collaborator+leader; verify displayed roles match `/auth/me`; verify non-admin `GET /users/:id` returns 403

### Tests for User Story 2 (MANDATORY)

- [ ] T026 [P] [US2] UI test: profile renders active role badges in `packages/web/src/__tests__/profile-roles.us2.test.tsx`
- [ ] T027 [US2] Integration test: non-admin denied `GET /users/:userId` in `packages/backend/src/__tests__/profile-access-deny.us2.test.ts`

### Implementation for User Story 2

- [ ] T028 [P] [US2] Create `RoleBadgeList` component in `packages/web/src/components/profile/RoleBadgeList.tsx`
- [ ] T029 [US2] Create `ProfilePage` using `frontend-design` skill in `packages/web/src/pages/ProfilePage.tsx`
- [ ] T030 [US2] Register `/app/profile` protected route in `packages/web/src/App.tsx`
- [ ] T031 [US2] Add Profile shell menu option in `packages/web/src/routes/shellOptions.ts`
- [ ] T032 [US2] Implement `GET /users/:userId` with administrator guard in `packages/backend/src/routes/users.ts`

**Checkpoint**: User Story 2 independently functional — self profile visibility without lateral admin reads

---

## Phase 5: User Story 3 - Administrator assigns and revokes elevated roles (Priority: P2)

**Goal**: Administrators grant/revoke `LEADER` and `ADMINISTRATOR`; audit events recorded; collaborator never removed

**Independent Test**: As bootstrap admin, grant then revoke `LEADER` on another user via API and admin UI; confirm target `/auth/me` role set updates; confirm non-admin `PATCH` returns 403

### Tests for User Story 3 (MANDATORY)

- [ ] T033 [P] [US3] Integration test: admin grant/revoke leader and administrator in `packages/backend/src/__tests__/admin-role-grant-revoke.us3.test.ts`
- [ ] T034 [P] [US3] Integration test: non-admin and invalid role change denied in `packages/backend/src/__tests__/admin-role-forbidden.us3.test.ts`
- [ ] T035 [P] [US3] UI test: admin users page grant/revoke flow in `packages/web/src/__tests__/admin-users.us3.test.tsx`

### Implementation for User Story 3

- [ ] T036 [US3] Implement `GET /users` directory endpoint in `packages/backend/src/routes/users.ts`
- [ ] T037 [US3] Implement `PATCH /users/:userId/roles` with audit writes in `packages/backend/src/routes/users.ts`
- [ ] T038 [US3] Apply `requireAdministrator` on all user-admin routes in `packages/backend/src/routes/users.ts`
- [ ] T039 [P] [US3] Create `usersApi` client in `packages/web/src/services/usersApi.ts`
- [ ] T040 [US3] Create `AdminRoute` guard in `packages/web/src/auth/AdminRoute.tsx`
- [ ] T041 [US3] Create `AdminUsersPage` using `frontend-design` skill in `packages/web/src/pages/AdminUsersPage.tsx`
- [ ] T042 [US3] Register `/app/admin/users` route with `AdminRoute` in `packages/web/src/App.tsx`
- [ ] T043 [US3] Add admin-only shell menu entry in `packages/web/src/routes/shellOptions.ts`

**Checkpoint**: User Story 3 independently functional — centralized role management with audit trail

---

## Phase 6: User Story 4 - Coexisting roles drive authorization behavior (Priority: P2)

**Goal**: Authorization honors full role sets; admin and leader capabilities available together; collaborator-only denied elevated actions

**Independent Test**: Automated matrix validates allow/deny for collaborator-only, collaborator+leader, collaborator+administrator, and all-three combinations on representative protected endpoints

### Tests for User Story 4 (MANDATORY)

- [ ] T044 [P] [US4] Authorization matrix allow/deny tests in `packages/backend/src/__tests__/authorization-matrix.us4.test.ts`
- [ ] T045 [P] [US4] DAC collaborator self-only deny fixture tests in `packages/backend/src/__tests__/dac-collaborator.us4.test.ts`
- [ ] T046 [P] [US4] DAC leader role-gate fixture tests (hierarchy deferred) in `packages/backend/src/__tests__/dac-leader-gate.us4.test.ts`

### Implementation for User Story 4

- [ ] T047 [US4] Add representative leader-only and admin-only route guards in `packages/backend/src/routes/users.ts`
- [ ] T048 [US4] Document extension points for recursive descendant checks in `packages/backend/src/services/authorizationService.ts`
- [ ] T049 [US4] Add web `roleGuards` helpers for admin/leader UI gates in `packages/web/src/auth/roleGuards.ts`
- [ ] T050 [US4] Hide admin menu/navigation when session lacks `ADMINISTRATOR` in `packages/web/src/routes/shellOptions.ts`

**Checkpoint**: User Story 4 independently functional — concurrent roles drive consistent authorization

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation, documentation, and monorepo quality gates

- [ ] T051 [P] Update feature verification checklist in `specs/004-user-role-profiles/quickstart.md`
- [ ] T052 [P] Align `contracts/user-roles-api.yaml` with implemented response codes in `packages/backend/src/routes/users.ts`
- [ ] T053 Run `npm run build` from repository root and resolve failures
- [ ] T054 Run `npm run lint` from repository root and resolve findings
- [ ] T055 Run `npm test` from repository root and resolve failures
- [ ] T056 Capture US1–US4 verification evidence in `specs/004-user-role-profiles/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **blocks all user stories**
- **User Stories (Phases 3–6)**: Depend on Foundational completion
- **Polish (Phase 7)**: Depends on target user stories being complete

### User Story Dependencies

| Story | Priority | Depends on                 | Can start after                   |
| ----- | -------- | -------------------------- | --------------------------------- |
| US1   | P1       | Foundational               | Phase 2 checkpoint                |
| US2   | P1       | US1 (roles in session/API) | US1 checkpoint (T025 recommended) |
| US3   | P2       | US1 + Foundational         | Phase 2; full admin UI after T032 |
| US4   | P2       | US3 (admin routes exist)   | US3 checkpoint for matrix tests   |

US1 is the MVP slice. US2 can proceed once auth payloads include `roles`. US3 and US4 can overlap after foundational work, but US4 authorization matrix tests need admin endpoints from US3.

### Within Each User Story

1. Tests written first — must **fail** before implementation
2. Backend services/entities before routes
3. Backend contracts before web consumers
4. Story checkpoint before next priority

### Parallel Opportunities

- **Phase 1**: T003, T004, T005 in parallel
- **Phase 2**: T006+T007 entities in parallel; T012+T017+T018 in parallel after T011
- **US1 tests**: T019, T020 in parallel
- **US2**: T026, T028 in parallel; T028+T029 in parallel after US1
- **US3 tests**: T033, T034, T035 in parallel
- **US4 tests**: T044, T045, T046 in parallel
- **Cross-story**: After Phase 2, backend US1 (T021–T023) and web US1 (T024–T025) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Tests first (parallel):
# T019 packages/backend/src/__tests__/roles-collaborator-default.us1.test.ts
# T020 packages/backend/src/__tests__/roles-collaborator-immutable.us1.test.ts

# Implementation split (parallel after tests exist):
# T021–T023 backend auth routes + userService
# T024–T025 web AuthUser + authApi
```

---

## Parallel Example: User Story 3

```bash
# Tests first (parallel):
# T033 admin-role-grant-revoke.us3.test.ts
# T034 admin-role-forbidden.us3.test.ts
# T035 admin-users.us3.test.tsx

# Implementation split (parallel):
# T036–T038 backend users routes
# T039–T043 web admin UI + guards
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **Stop and validate**: login/me return `COLLABORATOR`; tests pass
5. Demo/deploy baseline role model

### Incremental Delivery

1. Setup + Foundational → role infrastructure ready
2. US1 → collaborator default everywhere (MVP)
3. US2 → profile visibility for signed-in users
4. US3 → administrator role management
5. US4 → authorization matrix + DAC fixtures
6. Polish → build/lint/test + quickstart evidence

### Parallel Team Strategy

1. Team completes Phases 1–2 together
2. After checkpoint:
   - **Dev A**: US1 backend (T019–T023)
   - **Dev B**: US1 web (T024–T025)
3. US2 profile UI after US1 web merge
4. US3 backend + US3 frontend in parallel
5. US4 authorization tests once US3 routes exist

---

## Notes

- Every new screen (`ProfilePage`, `AdminUsersPage`) MUST use the `frontend-design` skill per constitution VIII
- Collaborator is never revocable — reject at service and API layers
- Leader hierarchical data is deferred; US4 DAC tests use fixtures until org hierarchy ships
- Task IDs are sequential T001–T056; `[P]` = safe parallelization across different files
