# Tasks: Google-only Authentication

**Input**: Design documents from /specs/001-google-authentication/
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/auth-api.yaml

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare workspace dependencies and auth configuration scaffolding

- [x] T001 Add backend auth dependencies for Google token verification and app token signing in packages/backend/package.json
- [x] T002 Add web dependencies for routing and Google login integration in packages/web/package.json
- [x] T003 [P] Add backend auth environment variable template values in packages/backend/.env.example
- [x] T004 [P] Add web auth environment variable template values in packages/web/.env.example

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish auth architecture and shared route protection primitives required by all stories

**CRITICAL**: No user story implementation starts before this phase is complete

- [x] T005 Update backend ORM entity/migration wiring for new auth entities in packages/backend/src/database/ormconfig.ts
- [x] T006 Create shared backend auth session types in packages/backend/src/auth/types.ts
- [x] T007 [P] Create backend authentication middleware skeleton in packages/backend/src/middleware/auth.ts
- [x] T008 [P] Create backend token utility/plugin for sign and verify operations in packages/backend/src/plugins/auth.ts
- [x] T009 Add backend public-route allowlist for /healthcheck and /healthcheck/complete in packages/backend/src/middleware/auth.ts
- [x] T010 Add web route shell for login-public and protected-route layout in packages/web/src/App.tsx
- [x] T011 Create frontend auth state provider and bootstrap context in packages/web/src/auth/AuthProvider.tsx

**Checkpoint**: Foundation complete; user stories can proceed

---

## Phase 3: User Story 1 - Sign in with Google (Priority: P1) 🎯 MVP

**Goal**: Allow users to sign in via Google only, then redirect to a welcome page while keeping all non-login pages protected

**Independent Test**: Complete Google login from the login page, verify redirect to welcome page, and verify unauthenticated access to non-login routes redirects to login

### Implementation for User Story 1

- [x] T012 [P] [US1] Implement Google ID token validation service in packages/backend/src/services/googleTokenValidator.ts
- [x] T013 [US1] Implement POST /auth/google/login endpoint contract in packages/backend/src/routes/auth.ts
- [x] T014 [US1] Register auth route module and middleware usage in packages/backend/src/index.ts
- [x] T015 [P] [US1] Implement login page with Google-only sign-in action in packages/web/src/pages/LoginPage.tsx
- [x] T016 [P] [US1] Implement welcome page with required message in packages/web/src/pages/WelcomePage.tsx
- [x] T017 [US1] Implement protected route component that redirects unauthenticated users in packages/web/src/auth/ProtectedRoute.tsx
- [x] T018 [US1] Wire app routes to enforce login-only public access in packages/web/src/App.tsx
- [x] T019 [US1] Implement frontend auth API client for login and session retrieval in packages/web/src/services/authApi.ts
- [x] T020 [US1] Implement cause-specific auth error code mapping in backend login response in packages/backend/src/routes/auth.ts
- [x] T021 [US1] Implement detailed per-cause user-facing auth error rendering in packages/web/src/pages/LoginPage.tsx

**Checkpoint**: User Story 1 should be independently functional and demonstrable

---

## Phase 4: User Story 2 - Create and maintain user profile on sign-in (Priority: P2)

**Goal**: Persist first-time users and update returning user last-login timestamps without changing first-login timestamp

**Independent Test**: Login with a new Google account then login again with the same account, and verify user record creation/update behavior

### Implementation for User Story 2

- [x] T022 [P] [US2] Create User entity mapping with required fields in packages/backend/src/database/entities/User.ts
- [x] T023 [US2] Create users table migration with unique email and login timestamps in packages/backend/database/migrations/202605130001-create-users-table.ts
- [x] T024 [US2] Implement user create-or-update service preserving firstLoginAt in packages/backend/src/services/userService.ts
- [x] T025 [US2] Integrate user upsert into Google login route flow in packages/backend/src/routes/auth.ts
- [x] T026 [US2] Implement GET /auth/me endpoint returning user profile payload in packages/backend/src/routes/auth.ts

**Checkpoint**: User Story 2 should be independently functional with persisted user lifecycle data

---

## Phase 5: User Story 3 - Record login audit trail (Priority: P3)

**Goal**: Record one successful login audit event for every successful authentication

**Independent Test**: Perform successful and failed login attempts and verify successful logins create exactly one audit row while failed logins create none

### Implementation for User Story 3

- [x] T027 [P] [US3] Create LoginAuditEvent entity mapping in packages/backend/src/database/entities/LoginAuditEvent.ts
- [x] T028 [US3] Create login audit table migration with user foreign key in packages/backend/database/migrations/202605130002-create-login-audit-events-table.ts
- [x] T029 [US3] Implement audit event creation service for successful logins in packages/backend/src/services/loginAuditService.ts
- [x] T030 [US3] Integrate audit event write into successful authentication flow in packages/backend/src/routes/auth.ts
- [x] T031 [US3] Enforce no successful-login audit writes on failed authentication paths in packages/backend/src/routes/auth.ts

**Checkpoint**: User Story 3 should be independently functional with complete successful-login audit trail

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, documentation, and validation across stories

- [x] T032 [P] Document authentication setup, env vars, and run commands in README.md
- [x] T033 Harden auth error responses and backend logging consistency in packages/backend/src/routes/auth.ts
- [x] T034 [P] Validate and refine end-to-end feature runbook in specs/001-google-authentication/quickstart.md
- [x] T035 Refactor duplicated auth mapping logic into a shared mapper utility in packages/backend/src/services/authUserMapper.ts
- [x] T036 Validate unauthenticated access for /healthcheck and /healthcheck/complete and record evidence in specs/001-google-authentication/quickstart.md
- [x] T037 Run monorepo build verification (npm run build) and resolve failures across impacted packages
- [x] T038 Run monorepo lint verification (npm run lint) and resolve findings across impacted packages
- [ ] T039 Run feature verification checklist for US1-US3 outcomes and capture results in specs/001-google-authentication/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): No dependencies
- Foundational (Phase 2): Depends on Setup; blocks all user stories
- User Story phases (Phase 3-5): Depend on Foundational completion
- Polish (Phase 6): Depends on completion of target user stories

### User Story Dependencies

- US1 (P1): Starts immediately after Foundational; no dependency on US2 or US3
- US2 (P2): Starts after Foundational; depends on US1 auth route groundwork for smooth integration
- US3 (P3): Starts after Foundational; depends on user identity availability from US2 for user-linked audit rows

### Suggested Delivery Order

- MVP: Phase 1 -> Phase 2 -> Phase 3 (US1)
- Increment 2: Phase 4 (US2)
- Increment 3: Phase 5 (US3)
- Finalize: Phase 6 (Polish)

---

## Parallel Opportunities

- Phase 1: T003 and T004 can run in parallel after T001 and T002
- Phase 2: T007 and T008 can run in parallel; T009 and T010 can run in parallel
- US1: T012, T015, and T016 can run in parallel once Phase 2 completes
- US2: T022 can run in parallel with T023 preparation work
- US3: T027 can run in parallel with T028 preparation work
- Polish: T032 and T034 can run in parallel
- Validation: T037 and T038 can run independently once implementation is complete

---

## Parallel Example: User Story 1

- T012 in packages/backend/src/services/googleTokenValidator.ts
- T015 in packages/web/src/pages/LoginPage.tsx
- T016 in packages/web/src/pages/WelcomePage.tsx

---

## Parallel Example: User Story 2

- T022 in packages/backend/src/database/entities/User.ts
- T023 in packages/backend/database/migrations/202605130001-create-users-table.ts

---

## Parallel Example: User Story 3

- T027 in packages/backend/src/database/entities/LoginAuditEvent.ts
- T028 in packages/backend/database/migrations/202605130002-create-login-audit-events-table.ts

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1 and Phase 2
2. Complete all US1 tasks in Phase 3
3. Validate independent US1 acceptance criteria
4. Demo or deploy MVP

### Incremental Delivery

1. Deliver MVP (US1)
2. Add user persistence lifecycle behavior (US2)
3. Add audit trail behavior (US3)
4. Apply polish and operational hardening
5. Execute T036-T039 as mandatory release-quality gates

### Team Parallelization Strategy

1. One developer focuses backend auth plumbing (T005-T014)
2. One developer focuses web auth UX and routing (T010-T021)
3. One developer adds persistence and audit vertical slices after foundation (T022-T031)
