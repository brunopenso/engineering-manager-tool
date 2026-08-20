---
description: Task list for profile assigned leader
---

# Tasks: Profile Assigned Leader

**Input**: Design documents from `/specs/024-profile-leader/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Mandatory for every user story.

**Organization**: Tasks are grouped by user story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Feature test directories and contract merge target.

- [x] T001 Create feature test folders `packages/backend/tests/024-profile-leader/` and `packages/web/tests/024-profile-leader/`
- [x] T002 [P] Merge `LeaderSummary` and `UserProfile.leader` from `specs/024-profile-leader/contracts/profile-leader-api.yaml` into `specs/004-user-role-profiles/contracts/user-roles-api.yaml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Session identity includes leader before Profile UI.

**⚠️ CRITICAL**: No user story UI until this phase is complete.

- [x] T003 Extend `AuthUserResponse` with `leader: { id: string; fullName: string } | null` and resolve it in `packages/backend/src/services/authUserMapper.ts` (User repository lookup; do not import `userService`)
- [x] T004 [P] Extend `AuthUser` with `leader` in `packages/web/src/services/authApi.ts` and `packages/web/src/auth/AuthProvider.tsx`
- [x] T005 [P] Set `testUser.leader` to `null` in `packages/web/src/test/renderWithProviders.tsx`
- [x] T006 [P] Include `leader: null` in `toAuthUserResponse` in `packages/backend/tests/profile-theme-github/profile-settings.setup.ts` and other explicit `AuthUserResponse` mocks that TypeScript requires

**Checkpoint**: Login / refresh / PATCH `/users/me` identity type includes `leader`.

---

## Phase 3: User Story 1 - See assigned leader on own profile (Priority: P1) 🎯 MVP

**Goal**: Signed-in user with an assigned leader sees that leader’s full name on Profile.

**Independent Test**: Session user with `leader: { id, fullName }` → Profile shows the name in a read-only Leader row.

### Tests for User Story 1 (MANDATORY)

- [x] T007 [P] [US1] Mapper test: `leaderId` set returns `{ id, fullName }` in `packages/backend/tests/024-profile-leader/auth-user-leader.us1.test.ts`
- [x] T008 [P] [US1] Web test: Profile shows leader full name in `packages/web/tests/024-profile-leader/profile-leader.us1.test.tsx`
- [x] T009 [P] [US1] i18n key parity for new profile keys in `packages/web/tests/024-profile-leader/i18n-parity.us1.test.ts`

### Implementation for User Story 1

- [x] T010 [P] [US1] Add `fields.leader` (and empty-state key needed by US2) to `packages/web/src/locales/en-US/profile.json` and `packages/web/src/locales/pt-BR/profile.json`
- [x] T011 [US1] Render read-only Leader row after email on `packages/web/src/pages/ProfilePage.tsx` using `frontend-design` skill (MUI Stack/Typography)

**Checkpoint**: US1 independently testable.

---

## Phase 4: User Story 2 - Empty state when no leader is assigned (Priority: P1)

**Goal**: Users without a leader still see the Leader field with empty-state copy.

**Independent Test**: Session user with `leader: null` → Profile shows “No leader assigned”.

### Tests for User Story 2 (MANDATORY)

- [x] T012 [P] [US2] Mapper test: null `leaderId` or missing leader row returns `leader: null` in `packages/backend/tests/024-profile-leader/auth-user-leader.us1.test.ts`
- [x] T013 [P] [US2] Web test: Profile shows empty-state copy in `packages/web/tests/024-profile-leader/profile-leader-none.us2.test.tsx`

### Implementation for User Story 2

- [x] T014 [US2] Display `t('fields.leaderNone')` when `profileUser.leader` is null in `packages/web/src/pages/ProfilePage.tsx`

**Checkpoint**: US1 and US2 independently functional.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T015 Run backend and web tests for `024-profile-leader` and lint on touched packages
- [x] T016 Confirm Profile save path does not offer leader as an editable field

## Dependencies & Execution Order

- Setup → Foundational → US1 → US2 → Polish
- US1 and US2 share mapper and Profile row; empty state is the null branch of the same field
- T010 can land with US1 so US2 only wires the null display

## Implementation Strategy

MVP is US1 (name when assigned) plus US2 empty state on the same row; ship both together.
