# Implementation Plan: Profile Theme and GitHub Login

**Branch**: `014-profile-theme-github` | **Date**: 2026-06-04 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/014-profile-theme-github/spec.md`

## Summary

Persist each user's **appearance preference** (`light` | `dark`) and optional **GitHub login** (username handle) on the `users` table via migration. Extend session identity (`POST /auth/google/login`, `GET /auth/me`, `POST /auth/refresh`) to return the new fields. Add **`PATCH /users/me`** for self-service updates (authenticated bearer token only). Update **`/app/profile`** to save theme on toggle and GitHub login via an editable field with validation. On sign-in/session bootstrap, apply server theme to `AppThemeProvider` and sync the local theme cookie; cookie remains a cache, server is source of truth when authenticated.

## Technical Context

**Language/Version**: TypeScript (Node.js >=24 backend, React 19 frontend)  
**Primary Dependencies**: Fastify 5, TypeORM, PostgreSQL, React Router 7, Vite 8, Material UI 6 (`frontend-design` skill)  
**Storage**: PostgreSQL — extend `users` with `theme_preference` (NOT NULL, default `light`) and `github_login` (nullable varchar)  
**Testing**: Vitest; `tests/014-profile-theme-github/`; `packages/backend/tests/profile-theme-github/`; `packages/web/tests/profile-theme-github/`  
**Target Platform**: Linux-hosted backend + browser SPA  
**Project Type**: Monorepo web application (`packages/backend`, `packages/web`)  
**Performance Goals**: Profile saves complete within 3 seconds under normal conditions (SC-001)  
**Constraints**: Self-only updates via `PATCH /users/me`; no admin directory changes; GitHub handle max 39 chars; theme enum only `light`|`dark`; trim whitespace on GitHub login; 400 `VALIDATION_ERROR` on invalid input  
**Scale/Scope**: One migration, one new route, extend `User` entity + `mapUserToAuthResponse`, extend `AuthUser` types and `ProfilePage`, wire theme bootstrap in `AuthProvider` / app shell

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Principle I (Type-Safe Monorepo Ownership): **PASS**. Shared `UserProfile` shape extended in contract; backend mapper and web `AuthUser` stay aligned.
- Principle II (Security-First): **PASS**. `PATCH /users/me` requires bearer auth; updates scoped to `request.auth.userId`; validation on input; no cross-user path.
- Principle III (Migration-Backed Data Integrity): **PASS**. Migration under `packages/backend/database/migrations` paired with `User` entity columns.
- Principle IV (API and UX Contract Fidelity): **PASS**. OpenAPI delta in `contracts/profile-settings-api.yaml`; merge into `user-roles-api.yaml` at implement time.
- Principle V (Incremental Delivery): **PASS**. Stories: migration + session fields → PATCH API → profile UI theme → profile UI GitHub → session theme bootstrap.
- Principle VI (Mandatory Automated Testing): **PASS**. Backend integration tests for PATCH/validation/auth; web tests for profile UI and theme persistence across session mock.
- Principle VII (Hierarchical DAC): **PASS** (N/A extension). Self-only profile data; no peer/superior reads; admin `GET /users` unchanged.
- Principle VIII (Frontend Design): **PASS**. `ProfilePage` uses `frontend-design` + MUI for GitHub field and existing appearance toggle.

**Post-Phase-1 Re-check**: **PASS**. Data model, contract, and quickstart document self-only access, defaults for existing users, and server-over-cookie theme precedence.

## Project Structure

### Documentation (this feature)

```text
specs/014-profile-theme-github/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── profile-settings-api.yaml
└── tasks.md                                    # created by /speckit-tasks
```

### Source Code (repository root)

```text
packages/
├── backend/
│   ├── database/migrations/
│   │   └── *-AddUserProfilePreferences.ts      # theme_preference, github_login
│   └── src/
│       ├── database/entities/User.ts
│       ├── services/authUserMapper.ts
│       ├── services/userProfileValidation.ts   # new: theme + github rules
│       ├── services/userService.ts             # updateUserProfileSettings
│       └── routes/users.ts                     # PATCH /users/me
├── web/
│   └── src/
│       ├── auth/AuthProvider.tsx               # extend AuthUser; theme bootstrap hook
│       ├── theme/AppThemeProvider.tsx          # accept initial mode from auth
│       ├── pages/ProfilePage.tsx               # GitHub field, API save, theme PATCH
│       └── services/profileApi.ts              # new: patchMyProfile
tests/014-profile-theme-github/
packages/backend/tests/profile-theme-github/
    └── profile-settings.*.test.ts
packages/web/tests/profile-theme-github/
    └── profile-*.test.tsx
```

**Structure Decision**: Extend existing user persistence and auth payloads rather than a separate preferences table; single self-service endpoint keeps scope minimal and matches spec FR-012.

## Complexity Tracking

| Item | Why Needed | Simpler Alternative Rejected Because |
|------|------------|-------------------------------------|
| Server + cookie for theme | Spec FR-014: account is source of truth when signed in | Cookie-only fails cross-device requirement |
| `PATCH /users/me` | Spec FR-012 self-service update | Overloading admin `PATCH /users/:id/roles` wrong semantics and ACL |

No constitutional violations.

## Phase 0 & Phase 1 Outputs

- [research.md](./research.md) — endpoint choice, column design, validation, theme bootstrap
- [data-model.md](./data-model.md) — `users` columns and API payloads
- [contracts/profile-settings-api.yaml](./contracts/profile-settings-api.yaml) — v0.1 delta
- [quickstart.md](./quickstart.md) — implementation steps

## End-to-End Regression Notes

- New user / migrated user: theme `light`, GitHub empty on `/auth/me`.
- Profile: toggle dark → persists → reload `/app/profile` shows dark.
- Sign-in on clean browser: dark from server applied without manual toggle.
- GitHub: save valid handle, clear to empty, invalid chars show error and no persist.
- `PATCH /users/me` without token → 401; cannot PATCH another user's id via this route.
- Name, email, roles on profile unchanged (read-only).
