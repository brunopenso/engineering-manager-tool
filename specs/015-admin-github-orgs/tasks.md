# Tasks: Administrator GitHub Organization Configuration

**Input**: Design documents from `/specs/015-admin-github-orgs/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/github-integrations-api.yaml`, `quickstart.md`

**Tests**: Tests are mandatory. Every user story and functional requirement includes automated backend and/or web test tasks.

**Organization**: Tasks grouped by user story. Persistence table **`github_integrations`**; API **`/github-integrations`**; JSON keys **`integrations`** / **`integration`**.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Acceptance plans and test scaffolds.

- [ ] T001 Create acceptance test plans in `tests/015-admin-github-orgs/` (`github-integrations-menu.us1.test.md`, `github-integrations-enable.us2.test.md`, `github-integrations-disable.us3.test.md`)
- [ ] T002 [P] Create backend test scaffold `packages/backend/tests/admin-github-orgs/github-integrations.setup.ts`
- [ ] T003 [P] Create web test directory `packages/web/tests/admin-github-orgs/` aligned with `packages/web/src/test/renderWithProviders.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: `github_integrations` migration, entity, validation, service, routes, and web API client — required before user story UI work.

**⚠️ CRITICAL**: No user story work starts until this phase is complete.

- [ ] T004 Add migration `packages/backend/database/migrations/*-AddGithubIntegrations.ts` creating table `github_integrations` (`id`, unique `login`, timestamps)
- [ ] T005 Add `GithubIntegration` entity mapped to `github_integrations` in `packages/backend/src/database/entities/GithubIntegration.ts`
- [ ] T006 Register `GithubIntegration` in ORM config in `packages/backend/src/database/connection.ts` (or equivalent entity registry)
- [ ] T007 [P] Add `DUPLICATE_GITHUB_INTEGRATION_LOGIN` to `packages/backend/src/auth/types.ts`
- [ ] T008 [P] Implement `githubIntegrationValidation.ts` (trim, slug rules, lowercase) in `packages/backend/src/services/githubIntegrationValidation.ts`
- [ ] T009 Implement `listGithubIntegrations`, `enableGithubIntegration`, `disableGithubIntegration` in `packages/backend/src/services/githubIntegrationService.ts`
- [ ] T010 Implement `GET` / `POST` / `DELETE /github-integrations/:integrationId` with `assertAdministrator` in `packages/backend/src/routes/githubIntegrations.ts`
- [ ] T011 Register `githubIntegrations` routes in `packages/backend/src/index.ts`
- [ ] T012 [P] Add `githubIntegrationsApi.ts` (`listGithubIntegrations`, `enableGithubIntegration`, `disableGithubIntegration`) in `packages/web/src/services/githubIntegrationsApi.ts`
- [ ] T013 Add backend smoke test: empty `GET /github-integrations` returns `{ integrations: [] }` in `packages/backend/tests/admin-github-orgs/github-integrations.setup.test.ts`

**Checkpoint**: Migration runnable; `/github-integrations` endpoints respond for administrators.

---

## Phase 3: User Story 1 - Administrator opens GitHub integration configuration (Priority: P1) 🎯 MVP

**Goal**: Administration menu entry, protected route, configuration screen with list fetch and empty state.

**Independent Test**: Administrator sees **GitHub integration** in menu, opens `/app/admin/github`, sees empty state or list; non-admin denied.

### Tests for User Story 1 (MANDATORY)

- [ ] T014 [P] [US1] Align acceptance scenarios in `tests/015-admin-github-orgs/github-integrations-menu.us1.test.md` with `specs/015-admin-github-orgs/contracts/github-integrations-api.yaml`
- [ ] T015 [P] [US1] Add backend test: non-admin `GET /github-integrations` returns 403 in `packages/backend/tests/admin-github-orgs/github-integrations-auth.us1.test.ts`
- [ ] T016 [P] [US1] Add web test: admin menu shows GitHub integration option in `packages/web/tests/admin-github-orgs/admin-github-menu.us1.test.tsx`
- [ ] T017 [P] [US1] Add web test: `AdminRoute` blocks non-admin on `/app/admin/github` in `packages/web/tests/admin-github-orgs/admin-github-route-guard.us1.test.tsx`
- [ ] T018 [P] [US1] Add web test: empty state when `integrations` is empty in `packages/web/tests/admin-github-orgs/admin-github-page-empty.us1.test.tsx`

### Implementation for User Story 1

- [ ] T019 [US1] Add `ADMIN_GITHUB_ROUTE = '/app/admin/github'` and menu option **GitHub integration** in `packages/web/src/routes/shellOptions.ts`
- [ ] T020 [US1] Create `AdminGithubIntegrationsPage.tsx` shell (heading, list area, empty state) using `frontend-design` skill in `packages/web/src/pages/AdminGithubIntegrationsPage.tsx`
- [ ] T021 [US1] Wire `listGithubIntegrations` on mount in `packages/web/src/pages/AdminGithubIntegrationsPage.tsx`
- [ ] T022 [US1] Register `/app/admin/github` with `AdminRoute` in `packages/web/src/App.tsx`

**Checkpoint**: User Story 1 — discoverability and read-only screen for administrators.

---

## Phase 4: User Story 2 - Administrator enables a GitHub organization (Priority: P1)

**Goal**: Add organization login via form; persist row in `github_integrations`; handle validation and duplicates.

**Independent Test**: Add `acme-corp` → appears in table; duplicate/invalid rejected; non-admin POST denied.

### Tests for User Story 2 (MANDATORY)

- [ ] T023 [P] [US2] Align acceptance scenarios in `tests/015-admin-github-orgs/github-integrations-enable.us2.test.md`
- [ ] T024 [P] [US2] Add backend tests: POST valid, trim, duplicate 409, invalid 400 in `packages/backend/tests/admin-github-orgs/github-integrations-enable.us2.test.ts`
- [ ] T025 [P] [US2] Add backend test: non-admin POST returns 403 in `packages/backend/tests/admin-github-orgs/github-integrations-auth.us2.test.ts`
- [ ] T026 [P] [US2] Add web test: add form calls enable API and shows new row in `packages/web/tests/admin-github-orgs/admin-github-page-enable.us2.test.tsx`

### Implementation for User Story 2

- [ ] T027 [US2] Add labeled login `TextField`, helper text, and Enable button using `frontend-design` skill in `packages/web/src/pages/AdminGithubIntegrationsPage.tsx`
- [ ] T028 [US2] Wire enable to `enableGithubIntegration` and refresh list; surface 409/400 errors in `packages/web/src/pages/AdminGithubIntegrationsPage.tsx`
- [ ] T029 [US2] Map API errors in `packages/web/src/services/githubIntegrationsApi.ts` (including `DUPLICATE_GITHUB_INTEGRATION_LOGIN`)

**Checkpoint**: User Stories 1 and 2 — full enable flow on `github_integrations`.

---

## Phase 5: User Story 3 - Administrator maintains the enabled list (Priority: P2)

**Goal**: Table of integrations with disable (hard delete) and confirmation dialog.

**Independent Test**: Disable removes row; reload shows updated list; non-admin DELETE denied.

### Tests for User Story 3 (MANDATORY)

- [ ] T030 [P] [US3] Align acceptance scenarios in `tests/015-admin-github-orgs/github-integrations-disable.us3.test.md`
- [ ] T031 [P] [US3] Add backend tests: DELETE success, 404 unknown id in `packages/backend/tests/admin-github-orgs/github-integrations-disable.us3.test.ts`
- [ ] T032 [P] [US3] Add backend test: populated `GET /github-integrations` returns stable ids in `packages/backend/tests/admin-github-orgs/github-integrations-list.us3.test.ts`
- [ ] T033 [P] [US3] Add web test: disable confirmation removes row in `packages/web/tests/admin-github-orgs/admin-github-page-disable.us3.test.tsx`

### Implementation for User Story 3

- [ ] T034 [US3] Add integrations `Table` with login column and Disable action using `frontend-design` skill in `packages/web/src/pages/AdminGithubIntegrationsPage.tsx`
- [ ] T035 [US3] Add disable confirmation `Dialog` and wire `disableGithubIntegration(integrationId)` in `packages/web/src/pages/AdminGithubIntegrationsPage.tsx`
- [ ] T036 [US3] Show empty state after last integration disabled in `packages/web/src/pages/AdminGithubIntegrationsPage.tsx`

**Checkpoint**: All user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Contract fidelity, auth regression, verification evidence.

- [ ] T037 [P] Add backend regression: unauthenticated `GET/POST/DELETE` on `/github-integrations` return 401 in `packages/backend/tests/admin-github-orgs/github-integrations-auth.test.ts`
- [ ] T038 Run `npm run db:migration:run --workspace @em-tool/backend` and record in `specs/015-admin-github-orgs/quickstart.md`
- [ ] T039 Run verification commands from `specs/015-admin-github-orgs/quickstart.md` and record outcomes in `specs/015-admin-github-orgs/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Start immediately
- **Foundational (Phase 2)**: Depends on Setup — **blocks all user stories**
- **US1 (Phase 3)**: Depends on Foundational (needs `GET /github-integrations` + web client)
- **US2 (Phase 4)**: Depends on Foundational; extends `AdminGithubIntegrationsPage.tsx`
- **US3 (Phase 5)**: Depends on US2 page existing (same file); can follow US1+US2
- **Polish (Phase 6)**: After US1–US3

### User Story Dependencies

- **US1**: After Phase 2 — independent read path
- **US2**: After Phase 2 — adds write to same page as US1
- **US3**: After US1 list UI — adds delete to same page

### Parallel Opportunities

- T002 + T003 (Setup)
- T007 + T008 + T012 (Foundational, different files)
- All `[P]` tests within a story phase
- T037 can run parallel to late US3 tests (different file from page tests)

---

## Parallel Example: User Story 2

```bash
# Backend enable tests:
packages/backend/tests/admin-github-orgs/github-integrations-enable.us2.test.ts

# Web enable test (after T012 client exists):
packages/web/tests/admin-github-orgs/admin-github-page-enable.us2.test.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 + Foundational)

1. Phase 1 + Phase 2
2. Phase 3 (US1) — menu, route, empty/list screen
3. **Validate** before enable/disable UX

### Incremental Delivery

1. Foundation → US1 (discover + list) → US2 (enable) → US3 (disable) → Polish

### Suggested MVP scope

**Phases 1–3** deliver administrator-visible GitHub integration screen with list/empty state; **Phases 4–5** complete the allowlist lifecycle.

---

## Notes

- Table name: **`github_integrations`** (not `github_enabled_organizations`).
- API path: **`/github-integrations`**; path param **`integrationId`**.
- Reuse slug validation patterns from `packages/backend/src/services/userProfileValidation.ts` where practical.
- `frontend-design` skill required for `AdminGithubIntegrationsPage.tsx`.
