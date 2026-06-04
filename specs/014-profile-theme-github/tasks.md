# Tasks: Profile Theme and GitHub Login

**Input**: Design documents from `/specs/014-profile-theme-github/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are MANDATORY for this feature. Every user story and requirement must include automated test coverage before merge.

**Organization**: Tasks are grouped by user story. **Self-service** `PATCH /users/me` and extended session `UserProfile` payloads apply throughout.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Feature test scaffolding and acceptance test plans.

- [X] T001 Create acceptance test plan files in `tests/014-profile-theme-github/` (`profile-theme.us1.test.md`, `profile-github.us2.test.md`, `profile-session.us3.test.md`)
- [X] T002 [P] Create backend test scaffold `packages/backend/tests/profile-theme-github/profile-settings.setup.ts` (reuse auth fixtures from `packages/backend/src/test/`)
- [X] T003 [P] Create web test directory `packages/web/tests/profile-theme-github/` with helpers aligned to `packages/web/src/test/renderWithProviders.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Migration, persistence, validation, self-service API, session payload extension, and web API client — required before any user story UI work.

**⚠️ CRITICAL**: No user story work starts until this phase is complete.

- [X] T004 Add migration `packages/backend/database/migrations/*-AddUserProfilePreferences.ts` with `theme_preference` (NOT NULL, default `light`) and `github_login` (nullable varchar 39)
- [X] T005 Add `themePreference` and `githubLogin` columns to `packages/backend/src/database/entities/User.ts`
- [X] T006 Implement `parseThemePreference` and `parseGithubLogin` with trim/empty-to-null and validation errors in `packages/backend/src/services/userProfileValidation.ts`
- [X] T007 Implement `updateUserProfileSettings(userId, partial)` in `packages/backend/src/services/userService.ts`
- [X] T008 Extend `AuthUserResponse` and `mapUserToAuthResponse` with `themePreference` and `githubLogin` in `packages/backend/src/services/authUserMapper.ts`
- [X] T009 Register `PATCH /users/me` (auth required, partial body, 400 on invalid input) in `packages/backend/src/routes/users.ts`
- [X] T010 [P] Merge `themePreference`, `githubLogin` on `UserProfile` and `PATCH /users/me` from `specs/014-profile-theme-github/contracts/profile-settings-api.yaml` into `specs/004-user-role-profiles/contracts/user-roles-api.yaml`
- [X] T011 [P] Add `patchMyProfile(accessToken, body)` in `packages/web/src/services/profileApi.ts`
- [X] T012 [P] Extend `AuthUser` type with `themePreference` and `githubLogin` in `packages/web/src/services/authApi.ts` and `packages/web/src/auth/AuthProvider.tsx`
- [X] T013 Add backend smoke test: default `themePreference` is `light` and `githubLogin` is null on `GET /auth/me` in `packages/backend/tests/profile-theme-github/profile-settings.setup.test.ts`
- [X] T014 Add backend integration test: unauthenticated `PATCH /users/me` returns 401 in `packages/backend/tests/profile-theme-github/profile-settings-auth.test.ts`

**Checkpoint**: Migration runnable; `PATCH /users/me` works; login/`/auth/me`/refresh return extended `UserProfile`.

---

## Phase 3: User Story 1 - Persist appearance preference across sessions (Priority: P1) 🎯 MVP

**Goal**: Signed-in user toggles light/dark on Profile; preference persists on account and returns on reload/session.

**Independent Test**: Toggle dark on `/app/profile` → `PATCH` succeeds → reload profile shows dark; `GET /auth/me` returns `themePreference: dark`; invalid theme rejected with 400.

### Tests for User Story 1 (MANDATORY)

- [X] T015 [P] [US1] Align acceptance scenarios in `tests/014-profile-theme-github/profile-theme.us1.test.md` with `specs/014-profile-theme-github/contracts/profile-settings-api.yaml`
- [X] T016 [P] [US1] Add backend tests for PATCH theme dark/light, default light, and invalid theme 400 in `packages/backend/tests/profile-theme-github/profile-settings-theme.us1.test.ts`
- [X] T017 [P] [US1] Add backend test that `GET /auth/me` returns saved `themePreference` after PATCH in `packages/backend/tests/profile-theme-github/profile-settings-theme.us1.test.ts`
- [X] T018 [P] [US1] Add web test: profile toggle calls `patchMyProfile` and persists dark selection in `packages/web/tests/profile-theme-github/profile-page-theme.us1.test.tsx`

### Implementation for User Story 1

- [X] T019 [US1] Update `packages/web/src/pages/ProfilePage.tsx` to call `patchMyProfile` on appearance toggle with optimistic `setMode` (use `frontend-design` skill)
- [X] T020 [US1] Revert theme and show error alert on failed PATCH in `packages/web/src/pages/ProfilePage.tsx`
- [X] T021 [US1] Initialize appearance toggle from `user.themePreference` on load in `packages/web/src/pages/ProfilePage.tsx`
- [X] T022 [US1] Migrate or replace cookie-only assertion in `packages/web/tests/profile/profile-theme.test.tsx` — prefer `packages/web/tests/profile-theme-github/profile-page-theme.us1.test.tsx` as source of truth

**Checkpoint**: User Story 1 independently functional — server-backed theme on profile and session read.

---

## Phase 4: User Story 2 - View and maintain GitHub login on profile (Priority: P1)

**Goal**: Signed-in user views, saves, clears, and validates GitHub username handle on Profile.

**Independent Test**: Save valid handle → reload shows value; clear → empty; invalid characters → error and no persist; trim applied on save.

### Tests for User Story 2 (MANDATORY)

- [X] T023 [P] [US2] Align acceptance scenarios in `tests/014-profile-theme-github/profile-github.us2.test.md`
- [X] T024 [P] [US2] Add backend tests for valid save, clear to null, trim, invalid chars, and overlong handle 400 in `packages/backend/tests/profile-theme-github/profile-settings-github.us2.test.ts`
- [X] T025 [P] [US2] Add backend test that `GET /auth/me` returns `githubLogin` after PATCH in `packages/backend/tests/profile-theme-github/profile-settings-github.us2.test.ts`
- [X] T026 [P] [US2] Add web test for GitHub field save, clear, and validation error display in `packages/web/tests/profile-theme-github/profile-page-github.us2.test.tsx`

### Implementation for User Story 2

- [X] T027 [US2] Add labeled GitHub login `TextField`, helper text, Save button, and loading/error state using `frontend-design` skill in `packages/web/src/pages/ProfilePage.tsx`
- [X] T028 [US2] Wire Save to `patchMyProfile({ githubLogin })` and `setSession` with updated user on success in `packages/web/src/pages/ProfilePage.tsx`
- [X] T029 [US2] Display `user.githubLogin` as initial field value on Profile load in `packages/web/src/pages/ProfilePage.tsx`

**Checkpoint**: User Stories 1 and 2 work together on Profile (theme + GitHub).

---

## Phase 5: User Story 3 - Session identity includes profile preferences (Priority: P2)

**Goal**: Login, refresh, and session bootstrap expose and apply `themePreference` and `githubLogin` without extra profile fetch.

**Independent Test**: User with dark theme and GitHub set → login response includes both; after GitHub save, refresh/`/auth/me` returns updated `githubLogin`; shell applies dark on bootstrap without profile visit.

### Tests for User Story 3 (MANDATORY)

- [X] T030 [P] [US3] Align acceptance scenarios in `tests/014-profile-theme-github/profile-session.us3.test.md`
- [X] T031 [P] [US3] Add backend tests: `POST /auth/google/login` and `POST /auth/refresh` include `themePreference` and `githubLogin` in `packages/backend/tests/profile-theme-github/profile-settings-session.us3.test.ts`
- [X] T032 [P] [US3] Add web test: session bootstrap applies `user.themePreference` to theme (mock `/auth/me`) in `packages/web/tests/profile-theme-github/profile-session-theme.us3.test.tsx`

### Implementation for User Story 3

- [X] T033 [US3] Apply server `themePreference` on login and stored-session bootstrap via `setMode` + `setThemeCookie` in `packages/web/src/auth/AuthProvider.tsx` (or dedicated `packages/web/src/auth/useAuthThemeSync.ts`)
- [X] T034 [US3] Ensure `setSession` after login/refresh keeps `themePreference` and `githubLogin` in `packages/web/src/auth/AuthProvider.tsx`
- [X] T035 [US3] Verify `packages/web/src/main.tsx` / app root still wraps `AuthProvider` outside `AppThemeProvider` so theme sync runs after auth load

**Checkpoint**: All user stories independently functional — cross-device theme on sign-in; session payloads complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Contract fidelity, regression safety, and verification evidence.

- [X] T036 [P] Add backend regression: `PATCH /users/me` cannot target another user (no alternate user id path) in `packages/backend/tests/profile-theme-github/profile-settings-auth.test.ts`
- [X] T037 [P] Confirm admin `GET /users` response shape unchanged (no required new admin columns) in `packages/backend/tests/profile-theme-github/profile-settings-admin-unchanged.test.ts`
- [X] T038 Run `npm run db:migration:run --workspace @em-tool/backend` and document in `specs/014-profile-theme-github/quickstart.md`
- [X] T039 Run full verification from `specs/014-profile-theme-github/quickstart.md` (`npm run test`, `npm run lint`) and record outcomes in `specs/014-profile-theme-github/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **blocks all user stories**
- **US1 (Phase 3)**: Depends on Foundational
- **US2 (Phase 4)**: Depends on Foundational; integrates with US1 on `ProfilePage.tsx` (sequential or shared file coordination)
- **US3 (Phase 5)**: Depends on Foundational; best after US1 (theme fields populated) but session payload tests can start after T008
- **Polish (Phase 6)**: Depends on US1–US3

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no dependency on US2/US3
- **US2 (P1)**: After Phase 2 — shares `ProfilePage.tsx` with US1; complete US1 first or coordinate file edits
- **US3 (P2)**: After Phase 2 — theme bootstrap logically follows US1; GitHub in session tests follow US2

### Within Each User Story

- Tests written first (fail before implementation)
- Backend before web when both apply
- Story checkpoint before next priority

### Parallel Opportunities

- T002 and T003 (Setup)
- T010, T011, T012 (Foundational, different files)
- All `[P]` tests within a story phase
- T036 and T037 (Polish)

---

## Parallel Example: User Story 1

```bash
# Backend tests in parallel:
packages/backend/tests/profile-theme-github/profile-settings-theme.us1.test.ts

# Web test in parallel after API client exists:
packages/web/tests/profile-theme-github/profile-page-theme.us1.test.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 + Phase 2
2. Complete Phase 3 (US1)
3. **STOP and VALIDATE**: Theme PATCH + `/auth/me` + profile toggle
4. Demo cross-session theme if migration + seed user available

### Incremental Delivery

1. Foundation → US1 (theme) → US2 (GitHub) → US3 (session bootstrap) → Polish
2. Each story adds test evidence without breaking prior stories

### Parallel Team Strategy

- Developer A: Phase 2 backend (T004–T009, T013–T014)
- Developer B: Phase 2 web types/client (T011–T012) + contract merge (T010)
- After checkpoint: A → US1 backend tests; B → US1 web; then US2/US3

---

## Notes

- Use `frontend-design` skill for all `ProfilePage.tsx` UI tasks (Principle VIII).
- DAC is N/A; include self-only auth denial tests (T014, T036), not hierarchy matrices.
- `[P]` = different files, no ordering conflict
- Profile theme cookie remains a cache; server preference wins when authenticated (FR-014)
