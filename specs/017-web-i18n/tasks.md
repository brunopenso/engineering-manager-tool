# Tasks: Web Internationalization (i18n)

**Input**: Design documents from `/specs/017-web-i18n/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: MANDATORY per spec — each user story includes automated test tasks under `packages/web/tests/web-i18n/` and acceptance docs under `tests/017-web-i18n/`.

**Organization**: Tasks grouped by user story for independent implementation and validation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1–US4)

## Path Conventions

- Web package: `packages/web/src/`, `packages/web/tests/web-i18n/`
- Acceptance docs: `tests/017-web-i18n/`
- Backend reference only: `packages/backend/src/types/profilePreferences.ts` (no new migrations)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and scaffold locale directory structure

- [X] T001 Install i18n dependencies (`i18next`, `react-i18next`, `i18next-browser-languagedetector`) in `packages/web/package.json` via `npm install --workspace @em-tool/web`
- [X] T002 [P] Create locale directory scaffold `packages/web/src/locales/en-US/` and `packages/web/src/locales/pt-BR/` with empty namespace JSON stubs (`common.json`, `shell.json`, `auth.json`, `profile.json`, `deliverables.json`, `leader.json`, `admin.json`)
- [X] T003 [P] Create `packages/web/tests/web-i18n/` test directory and `tests/017-web-i18n/` acceptance doc directory

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core i18n infrastructure and shared types — MUST complete before user story migration work

**⚠️ CRITICAL**: No user story string migration until this phase is complete

- [X] T004 Implement i18next initialization in `packages/web/src/i18n/config.ts` (namespaces, `fallbackLng: 'en-US'`, `supportedLngs`, resource loading from `locales/`)
- [X] T005 Create `packages/web/src/i18n/index.ts` re-exporting configured i18n instance
- [X] T006 Extend `AuthUser` with `languagePreference` and `dateFormatPreference` in `packages/web/src/services/authApi.ts`
- [X] T007 Extend `AuthUser` with matching fields in `packages/web/src/auth/AuthProvider.tsx`
- [X] T008 Extend `ProfileSettingsUpdate` with `languagePreference` and `dateFormatPreference` in `packages/web/src/services/profileApi.ts`
- [X] T009 [P] Update auth/session test fixtures with default `languagePreference: 'en-US'` and `dateFormatPreference: 'MDY'` in `packages/web/src/test/renderWithProviders.tsx` and shared test helpers under `packages/web/tests/`
- [X] T010 Wire i18n into app bootstrap: import config in `packages/web/src/main.tsx` and wrap tree with `I18nextProvider`
- [X] T011 Create `packages/web/src/auth/AuthLocaleSync.tsx` to apply `user.languagePreference` on authenticated session (mirror `AuthThemeSync.tsx`)
- [X] T012 Mount `<AuthLocaleSync />` alongside `<AuthThemeSync />` in `packages/web/src/App.tsx`
- [X] T013 [P] Add MUI locale support (`enUS` / `ptBR` from `@mui/material/locale`) driven by active language in `packages/web/src/theme/AppThemeProvider.tsx`
- [X] T014 [P] Add i18n test harness wrapper in `packages/web/src/test/renderWithProviders.tsx` for Vitest suites
- [X] T015 [P] Add `packages/web/tests/web-i18n/i18n-setup.test.ts` verifying init, fallback, and namespace loading

**Checkpoint**: i18n runs in app and tests; auth types aligned with backend — ready for catalog migration

---

## Phase 3: User Story 1 - English baseline (Priority: P1) 🎯 MVP

**Goal**: All in-scope screens source user-visible copy from `en-US` translation catalogs; no hard-coded UI chrome

**Independent Test**: Render primary routes with default `en-US` locale; assert English labels from catalogs (not inline literals)

### Tests for User Story 1 (MANDATORY)

- [X] T016 [P] [US1] Create acceptance spec `tests/017-web-i18n/english-baseline.us1.test.md` per spec automated test requirement
- [X] T017 [P] [US1] Add `packages/web/tests/web-i18n/shell-locale.us1.test.tsx` covering shell navigation labels in English for collaborator/leader/admin menu sections
- [X] T018 [P] [US1] Add `packages/web/tests/web-i18n/english-routes.us1.test.tsx` smoke-rendering login, welcome, profile, and deliverables routes with English copy

### Implementation for User Story 1

- [X] T019 [P] [US1] Populate `packages/web/src/locales/en-US/common.json` with shared actions, errors, and loading strings
- [X] T020 [P] [US1] Populate `packages/web/src/locales/en-US/shell.json` and migrate `packages/web/src/routes/shellOptions.ts` plus `packages/web/src/components/shell/AppShellLayout.tsx`, `ShellNavigation.tsx`, `HeaderIdentityAction.tsx` to `useTranslation('shell')`
- [X] T021 [P] [US1] Populate `packages/web/src/locales/en-US/auth.json` and migrate `packages/web/src/pages/LoginPage.tsx` to `useTranslation('auth')`
- [X] T022 [P] [US1] Migrate `packages/web/src/pages/WelcomePage.tsx` and `packages/web/src/pages/OptionUnavailablePage.tsx` to i18n keys in `shell.json` / `common.json`
- [X] T023 [P] [US1] Populate `packages/web/src/locales/en-US/profile.json` and migrate `packages/web/src/pages/ProfilePage.tsx` and `packages/web/src/components/profile/RoleBadgeList.tsx` (existing fields only — locale controls added in US2/US4)
- [X] T024 [P] [US1] Populate `packages/web/src/locales/en-US/deliverables.json` and migrate `packages/web/src/pages/DeliverablesPage.tsx`, `DeliverableFormPage.tsx`, `DeliverablesViewPage.tsx`
- [X] T025 [P] [US1] Populate `packages/web/src/locales/en-US/leader.json` and migrate `packages/web/src/pages/LeaderTeamDeliverablesPage.tsx`, `LeaderTeamAnalyticsPage.tsx`, `LeaderHierarchyManagementPage.tsx`
- [X] T026 [P] [US1] Migrate leader components in `packages/web/src/components/leader-hierarchy/`, `packages/web/src/components/leader-analytics/`, `packages/web/src/components/team-deliverables/`, and `packages/web/src/components/hierarchy/` to `useTranslation('leader')`
- [X] T027 [P] [US1] Populate `packages/web/src/locales/en-US/admin.json` and migrate `packages/web/src/pages/AdminUsersPage.tsx`, `AdminTagsPage.tsx`, `AdminGithubIntegrationsPage.tsx`
- [X] T028 [US1] Migrate route guard / empty-state user messages in `packages/web/src/auth/ProtectedRoute.tsx`, `LeaderRoute.tsx`, `AdminRoute.tsx` if they expose user-visible copy

**Checkpoint**: Full English UI from catalogs; US1 tests pass

---

## Phase 4: User Story 2 - Brazilian Portuguese (Priority: P1)

**Goal**: Complete `pt-BR` catalogs with key parity; profile language control switches UI immediately

**Independent Test**: Select pt-BR on profile → shell and pages render Portuguese; no missing keys for primary UI

### Tests for User Story 2 (MANDATORY)

- [X] T029 [P] [US2] Create acceptance spec `tests/017-web-i18n/portuguese-locale.us2.test.md`
- [X] T030 [P] [US2] Add `packages/web/tests/web-i18n/locale-key-parity.test.ts` asserting `en-US` and `pt-BR` namespace keys match for all seven namespaces
- [X] T031 [P] [US2] Add `packages/web/tests/web-i18n/profile-language.us2.test.tsx` for profile language toggle, immediate `i18n.changeLanguage`, and optimistic UI update

### Implementation for User Story 2

- [X] T032 [P] [US2] Populate all `packages/web/src/locales/pt-BR/*.json` files with Portuguese translations matching `en-US` keys
- [X] T033 [US2] Add language preference `ToggleButtonGroup` on `packages/web/src/pages/ProfilePage.tsx` using `frontend-design` skill + MUI (en-US / pt-BR labels, `aria-label`s)
- [X] T034 [US2] Implement `handleLanguageChange` on `packages/web/src/pages/ProfilePage.tsx`: optimistic `i18n.changeLanguage`, `patchMyProfile({ languagePreference })`, revert on `ProfileApiError` (mirror theme handler)
- [X] T035 [US2] Add profile language strings to `packages/web/src/locales/en-US/profile.json` and `packages/web/src/locales/pt-BR/profile.json`
- [X] T036 [US2] Verify leader analytics charts, team deliverables modals, and admin tables display Portuguese labels when `languagePreference` is `pt-BR` (fix any missed hard-coded strings found during US2 validation)

**Checkpoint**: pt-BR fully usable; language switch on profile works without page reload

---

## Phase 5: User Story 3 - Profile persistence (Priority: P2)

**Goal**: Server-side `languagePreference` restored on sign-in, reload, and cross-browser session; pre-auth browser detection on login

**Independent Test**: Save pt-BR on profile → sign out → sign in on fresh session → UI loads pt-BR from server profile

### Tests for User Story 3 (MANDATORY)

- [X] T037 [P] [US3] Create acceptance spec `tests/017-web-i18n/locale-persistence.us3.test.md`
- [X] T038 [P] [US3] Add `packages/web/tests/web-i18n/profile-locale-persistence.us3.test.tsx` for PATCH persistence, reload restore, and error revert on failed save
- [X] T039 [P] [US3] Add `packages/web/tests/web-i18n/login-detector.us3.test.tsx` for pre-auth browser language detection (`pt-BR` / unsupported `fr` → `en-US`) with `lookupLocalStorage: false`

### Implementation for User Story 3

- [X] T040 [US3] Configure `i18next-browser-languagedetector` in `packages/web/src/i18n/config.ts` for unauthenticated login (`supportedLngs`, no localStorage persistence)
- [X] T041 [US3] Ensure `packages/web/src/auth/AuthLocaleSync.tsx` applies server `languagePreference` on sign-in, session refresh, and profile save (overrides detector when authenticated)
- [X] T042 [US3] Update session bootstrap in `packages/web/src/auth/AuthProvider.tsx` so restored sessions initialize i18n from `user.languagePreference` before first authenticated render
- [X] T043 [US3] Add cross-session test coverage simulating fresh browser sign-in with `languagePreference: 'pt-BR'` in `packages/web/tests/web-i18n/profile-locale-persistence.us3.test.tsx`

**Checkpoint**: Language preference survives reload and cross-device sign-in via server profile

---

## Phase 6: User Story 4 - Profile-driven date formatting (Priority: P3)

**Goal**: Dates and numbers formatted by `dateFormatPreference` and `languagePreference`; profile date format control persisted

**Independent Test**: Set `DMY` on profile → deliverables date column shows day-first; pt-BR uses Brazilian number separators

### Tests for User Story 4 (MANDATORY)

- [X] T044 [P] [US4] Create acceptance spec `tests/017-web-i18n/locale-formatting.us4.test.md`
- [X] T045 [P] [US4] Add `packages/web/tests/web-i18n/format-display-date.test.ts` for `MDY` / `DMY` / `YMD` output
- [X] T046 [P] [US4] Add `packages/web/tests/web-i18n/format-display-number.test.ts` for `en-US` vs `pt-BR` separators
- [X] T047 [P] [US4] Add `packages/web/tests/web-i18n/profile-date-format.us4.test.tsx` for profile date format toggle, PATCH persistence, and deliverables list date display update

### Implementation for User Story 4

- [X] T048 [P] [US4] Implement `packages/web/src/utils/formatDisplayDate.ts` accepting `(date, dateFormatPreference, languagePreference?)`
- [X] T049 [P] [US4] Implement `packages/web/src/utils/formatDisplayNumber.ts` using `Intl.NumberFormat` by `languagePreference`
- [X] T050 [US4] Add date format `ToggleButtonGroup` on `packages/web/src/pages/ProfilePage.tsx` (MDY / DMY / YMD) with PATCH save and error revert using `frontend-design` skill
- [X] T051 [US4] Replace `toLocaleDateString` / `toLocaleString` in `packages/web/src/pages/DeliverablesPage.tsx` and `DeliverablesViewPage.tsx` with `formatDisplayDate`
- [X] T052 [US4] Replace date display in `packages/web/src/components/team-deliverables/TeamDeliverableReviewModal.tsx` with `formatDisplayDate`
- [X] T053 [US4] Apply `formatDisplayDate` / `formatDisplayNumber` in leader analytics components under `packages/web/src/components/leader-analytics/` where dates or counts are shown to users
- [X] T054 [US4] Keep `formatDateInput` in `packages/web/src/utils/dateRange.ts` unchanged for API-bound ISO date fields

**Checkpoint**: Date order follows profile; numbers follow UI language

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Contract alignment, documentation, and full regression

- [X] T055 [P] Merge `languagePreference` and `dateFormatPreference` into `specs/014-profile-theme-github/contracts/profile-settings-api.yaml` from `specs/017-web-i18n/contracts/web-i18n-profile-wiring.yaml`
- [X] T056 [P] Add shared web i18n types file `packages/web/src/types/profilePreferences.ts` mirroring backend enums for reuse across profile, auth, and format utils
- [X] T057 Run full validation from `specs/017-web-i18n/quickstart.md`: `npm run lint`, `npm run test --workspace @em-tool/web`, `npm run test --workspace @em-tool/backend`
- [ ] T058 Manual smoke: profile language + date format + theme independently; missing pt-BR key falls back to English; DAC unchanged on leader/admin routes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **blocks all user stories**
- **US1 (Phase 3)**: Depends on Phase 2 — English migration is MVP foundation
- **US2 (Phase 4)**: Depends on US1 (requires `en-US` keys to exist for parity)
- **US3 (Phase 5)**: Depends on Phase 2 + US2 profile language control (T033–T034); `AuthLocaleSync` stub from Phase 2 completed in T040–T042
- **US4 (Phase 6)**: Depends on Phase 2 types; profile page from US1/US2; deliverables pages migrated in US1
- **Polish (Phase 7)**: Depends on US1–US4 completion

### User Story Dependencies

| Story | Depends on | Can parallelize with |
|-------|------------|----------------------|
| US1 | Foundational | — |
| US2 | US1 | — |
| US3 | Foundational, US2 profile language UI | US4 utils (T048–T049) after Foundational |
| US4 | US1 page migrations, Foundational types | US3 persistence wiring after T033 |

### Parallel Opportunities

- **Phase 1**: T002, T003 in parallel after T001
- **Phase 2**: T009, T013, T014, T015 in parallel after T004–T008
- **US1**: T016–T018 (tests) in parallel; T019–T027 (namespace migrations) in parallel per file group
- **US2**: T029–T031 (tests) in parallel; T032 (pt-BR files) parallelizable by namespace file
- **US4**: T048, T049 (utils) in parallel; T045, T046 (unit tests) in parallel

---

## Parallel Example: User Story 1

```bash
# Tests first (parallel):
T016: tests/017-web-i18n/english-baseline.us1.test.md
T017: packages/web/tests/web-i18n/shell-locale.us1.test.tsx
T018: packages/web/tests/web-i18n/english-routes.us1.test.tsx

# English catalog migration (parallel by area):
T020: shell + shellOptions
T021: LoginPage
T024: deliverables pages
T025: leader pages
T027: admin pages
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1: Setup  
2. Complete Phase 2: Foundational  
3. Complete Phase 3: User Story 1 (English baseline)  
4. **STOP and VALIDATE**: `npm run test --workspace @em-tool/web` — US1 tests green  
5. Demo English-only i18n infrastructure

### Incremental Delivery

1. Setup + Foundational → i18n infrastructure ready  
2. US1 → all strings in catalogs (English) → MVP  
3. US2 → Portuguese + language switcher → bilingual release  
4. US3 → server persistence + login detection → cross-device  
5. US4 → date/number formatting → full spec compliance  
6. Polish → contract merge + full CI

### Suggested MVP Scope

**User Story 1 only** (Phases 1–3): English catalogs + `t()` migration across all screens. Delivers i18n architecture without pt-BR or profile locale controls.

---

## Notes

- Use `frontend-design` skill for all Profile page control additions (language, date format)
- Do not translate user-generated content (deliverable titles, tag names, etc.)
- API error `message` strings may remain English in v1
- Backend locale fields already exist — no new migrations required
- Commit after each phase checkpoint
