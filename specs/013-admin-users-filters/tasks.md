# Tasks: Admin Users List Filters

**Input**: Design documents from `/specs/013-admin-users-filters/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are MANDATORY for this feature. Every user story and requirement must include automated test coverage before merge.

**Organization**: Tasks are grouped by user story. **Backend filtering** on `GET /users` with AND across name/email/roles and OR within roles applies throughout.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Feature test scaffolding and directories.

- [x] T001 Create acceptance test plan files in `tests/013-admin-users-filters/` (`admin-users-filters-name.us1.test.md`, `admin-users-filters-email.us2.test.md`, `admin-users-filters-role.us3.test.md`, `admin-users-filters-combined.us4.test.md`)
- [x] T002 [P] Create backend test scaffold `packages/backend/tests/admin-users-filters/admin-users-filters.setup.ts` (reuse patterns from `packages/backend/tests/` auth and user fixtures)
- [x] T003 [P] Create web test directory `packages/web/tests/admin-users-filters/` with render/auth helpers aligned to `packages/web/src/test/renderWithProviders.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Server-side list filtering types, query parser, service query, route wiring, and API client — required before any user story UI work.

**⚠️ CRITICAL**: No user story work starts until this phase is complete.

- [x] T004 Add `AdminUserListFilters` type (`name?`, `email?`, `roles?`) in `packages/backend/src/types/adminUserListFilters.ts`
- [x] T005 Implement `parseAdminUserListFilters(query)` with trim, role enum validation, and validation error type in `packages/backend/src/services/adminUserListQuery.ts`
- [x] T006 Implement `findUsersForAdmin(filters)` with `LOWER(fullName) LIKE`, `LOWER(email) LIKE`, and `EXISTS` on `user_roles` for role OR filter in `packages/backend/src/services/userService.ts`
- [x] T007 Update `GET /users` in `packages/backend/src/routes/users.ts` to parse query params, return `400` on invalid roles, call `findUsersForAdmin`, and map with `mapUserToAuthResponse`
- [x] T008 [P] Add `AdminUserListFilters` type and extend `listUsers(accessToken, filters?)` to build `URLSearchParams` (`name`, `email`, repeated `roles`) in `packages/web/src/services/usersApi.ts`
- [x] T009 [P] Add `useDebouncedValue<T>(value, delayMs)` hook in `packages/web/src/hooks/useDebouncedValue.ts` for 300ms name/email debounce
- [x] T010 Add backend smoke test that unfiltered `GET /users` still returns all users for administrator in `packages/backend/tests/admin-users-filters/admin-users-list-filters.setup.test.ts`

**Checkpoint**: `GET /users` accepts optional filter query params; administrator receives filtered or full list from server only.

---

## Phase 3: User Story 1 - Administrator filters users by name (Priority: P1) 🎯 MVP

**Goal**: Administrator types full or partial name; backend returns case-insensitive substring matches; empty name omits name dimension.

**Independent Test**: Enter full name → one row; partial name → multiple rows; clear name → name no longer excludes users.

### Tests for User Story 1 (MANDATORY)

- [x] T011 [P] [US1] Align acceptance scenarios in `tests/013-admin-users-filters/admin-users-filters-name.us1.test.md` with `specs/013-admin-users-filters/contracts/admin-users-filters-api.yaml`
- [x] T012 [P] [US1] Add backend test for full and partial name match (case-insensitive) in `packages/backend/tests/admin-users-filters/admin-users-list-filters-name.us1.test.ts`
- [x] T013 [P] [US1] Add backend test that whitespace-only `name` is ignored in `packages/backend/tests/admin-users-filters/admin-users-list-filters-name.us1.test.ts`
- [x] T014 [P] [US1] Add web test for name field debounced fetch with `name` query param in `packages/web/tests/admin-users-filters/admin-users-page-filters-name.us1.test.tsx`

### Implementation for User Story 1

- [x] T015 [US1] Add filter `Stack`/`Paper` above table using `frontend-design` skill in `packages/web/src/pages/AdminUsersPage.tsx`
- [x] T016 [US1] Add labeled name `TextField` with partial-search placeholder in `packages/web/src/pages/AdminUsersPage.tsx`
- [x] T017 [US1] Wire `useDebouncedValue` for name and `useEffect` to call `listUsers(accessToken, { name })` in `packages/web/src/pages/AdminUsersPage.tsx`

**Checkpoint**: User Story 1 independently functional — name-filtered admin user list.

---

## Phase 4: User Story 2 - Administrator filters users by email (Priority: P1)

**Goal**: Administrator types full or partial email; backend returns case-insensitive substring matches; empty email omits email dimension; combines with name via AND.

**Independent Test**: Partial email → matching rows; name + email together → intersection only.

### Tests for User Story 2 (MANDATORY)

- [x] T018 [P] [US2] Update acceptance scenarios in `tests/013-admin-users-filters/admin-users-filters-email.us2.test.md`
- [x] T019 [P] [US2] Add backend tests for full/partial email and name+email AND in `packages/backend/tests/admin-users-filters/admin-users-list-filters-email.us2.test.ts`
- [x] T020 [P] [US2] Add web test for email field debounced fetch with `email` query param in `packages/web/tests/admin-users-filters/admin-users-page-filters-email.us2.test.tsx`

### Implementation for User Story 2

- [x] T021 [US2] Add labeled email `TextField` to filter bar in `packages/web/src/pages/AdminUsersPage.tsx` using `frontend-design` skill
- [x] T022 [US2] Debounce email and include `email` in `listUsers` filter params alongside debounced name in `packages/web/src/pages/AdminUsersPage.tsx`

**Checkpoint**: User Stories 1 and 2 work together (name AND email on server).

---

## Phase 5: User Story 3 - Administrator filters users by role (Priority: P1)

**Goal**: Administrator multi-selects Collaborator, Leader, and/or Administrator; backend returns users with at least one selected role (OR); empty selection omits role filter.

**Independent Test**: Select Leader only → leaders; select Leader+Administrator → union; no roles → all users (within other active filters).

### Tests for User Story 3 (MANDATORY)

- [x] T023 [P] [US3] Update acceptance scenarios in `tests/013-admin-users-filters/admin-users-filters-role.us3.test.md`
- [x] T024 [P] [US3] Add backend tests for single role, multi-role OR, and omitted roles in `packages/backend/tests/admin-users-filters/admin-users-list-filters-role.us3.test.ts`
- [x] T025 [P] [US3] Add backend test returning `400` for invalid `roles` value in `packages/backend/tests/admin-users-filters/admin-users-list-filters-role.us3.test.ts`
- [x] T026 [P] [US3] Add web test for role multi-select immediate refetch with `roles` query params in `packages/web/tests/admin-users-filters/admin-users-page-filters-role.us3.test.tsx`

### Implementation for User Story 3

- [x] T027 [US3] Add role multi-select `FormControl`/`Select` multiple with Collaborator, Leader, Administrator labels in `packages/web/src/pages/AdminUsersPage.tsx` using `frontend-design` skill
- [x] T028 [US3] Include repeatable `roles` in `listUsers` calls on role change (no debounce) in `packages/web/src/pages/AdminUsersPage.tsx`

**Checkpoint**: User Stories 1–3 independently testable with full server-side AND across dimensions.

---

## Phase 6: User Story 4 - Administrator combines filters and resets (Priority: P2)

**Goal**: All filters work together; distinct empty states; **Clear all filters** restores full list; grant/revoke refreshes with current filters.

**Independent Test**: name+email+roles → AND on server; zero results → filtered empty message; Clear all → no query params; grant role → refetch with same params.

### Tests for User Story 4 (MANDATORY)

- [x] T029 [P] [US4] Update acceptance scenarios in `tests/013-admin-users-filters/admin-users-filters-combined.us4.test.md`
- [x] T030 [P] [US4] Add backend integration test for name+email+roles AND combination in `packages/backend/tests/admin-users-filters/admin-users-list-filters-combined.us4.test.ts`
- [x] T031 [P] [US4] Add backend regression test: non-administrator `GET /users` with filters returns `403` in `packages/backend/tests/admin-users-filters/admin-users-list-filters-auth.us4.test.ts`
- [x] T032 [P] [US4] Add web test for filtered empty vs unfiltered empty messaging in `packages/web/tests/admin-users-filters/admin-users-page-filters-combined.us4.test.tsx`
- [x] T033 [P] [US4] Add web test that **Clear all filters** removes query params and restores full list in `packages/web/tests/admin-users-filters/admin-users-page-filters-combined.us4.test.tsx`
- [x] T034 [P] [US4] Add web test that grant/revoke role refetches with active filter params in `packages/web/tests/admin-users-filters/admin-users-page-filters-combined.us4.test.tsx`

### Implementation for User Story 4

- [x] T035 [US4] Implement **Clear all filters** button (visible when any filter active) resetting name, email, and roles in `packages/web/src/pages/AdminUsersPage.tsx`
- [x] T036 [US4] Distinguish **no users match your filters** vs **no users in the organization** empty states in `packages/web/src/pages/AdminUsersPage.tsx`
- [x] T037 [US4] Ensure `refreshUsers()` after `updateUserRole` passes current filter state to `listUsers` in `packages/web/src/pages/AdminUsersPage.tsx`
- [x] T038 [US4] Show loading state during fetch without flashing stale unfiltered results as final state in `packages/web/src/pages/AdminUsersPage.tsx`

**Checkpoint**: Full filter bar complete per spec FR-001–FR-013.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Contract alignment, auth regression, validation.

- [x] T039 [P] Merge `GET /users` query parameters into `specs/004-user-role-profiles/contracts/user-roles-api.yaml` per `specs/013-admin-users-filters/contracts/admin-users-filters-api.yaml`
- [x] T040 [P] Update `packages/web/tests/admin-users.us3.test.tsx` to assert initial unfiltered `GET /users` call (no filter params)
- [x] T041 Run `npm run test --workspace @em-tool/backend -- --run admin-users-filters` and `npm run test --workspace @em-tool/web -- --run admin-users-filters` from repo root; fix failures
- [x] T042 Run `npm run lint` from repo root; fix failures in touched packages
- [x] T043 Record verification steps and outcomes in `specs/013-admin-users-filters/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** → **Phase 2** (blocking) → **Phases 3–6** (US1 → US2 → US3 → US4 recommended sequential) → **Phase 7**

### User Story Dependencies

| Story    | Depends on    | Notes                                        |
| -------- | ------------- | -------------------------------------------- |
| US1 (P1) | Phase 2       | MVP: name filter only                        |
| US2 (P1) | US1 + Phase 2 | Adds email field + AND with name             |
| US3 (P1) | US1 + Phase 2 | Adds role multi-select                       |
| US4 (P2) | US1–US3       | Clear all, empty states, role-change refresh |

### Parallel Opportunities

- T002 and T003 (setup)
- T008 and T009 (foundational web)
- All test tasks marked `[P]` within a story phase
- T039 and T040 (polish) in parallel

### Parallel Example: User Story 1 tests

```bash
# Run together after Phase 2:
T012  # backend full/partial name
T013  # backend empty name
T014  # web debounced name query
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1–2
2. Complete Phase 3 (US1)
3. **STOP and VALIDATE**: partial name search, case-insensitive match, empty name omits filter

### Incremental Delivery

1. US1 → name filter MVP
2. US2 → email
3. US3 → role multi-select
4. US4 → clear all + empty states + role-change refresh
5. Phase 7 → contract merge + full suite

---

## Notes

- Do **not** implement client-side-only filtering of the full user directory (spec FR-012).
- Reuse `searchOrphanUsers` `LOWER + LIKE` pattern but keep **separate** `name` and `email` query params.
- `AdminUsersPage.tsx` filter UI must use `frontend-design` skill + Material UI.
- Task count: **43** total (**US1**: 7, **US2**: 5, **US3**: 6, **US4**: 10, Setup 3, Foundational 7, Polish 5)
