# Research: Profile Theme and GitHub Login

## Decision 1: Persistence location

- **Decision**: Add `theme_preference` and `github_login` columns on existing `users` table via TypeORM migration.
- **Rationale**: Spec treats both as attributes of the user account; no separate settings entity needed; aligns with Principle III.
- **Alternatives considered**:
  - Key-value `user_preferences` table (rejected: over-engineering for two fields).
  - Client-only theme storage (rejected: spec requires backend persistence and cross-session restore).

## Decision 2: Theme column shape

- **Decision**: `theme_preference varchar NOT NULL DEFAULT 'light'` with application-level enum `light` | `dark` only.
- **Rationale**: Spec FR-001/FR-002; matches existing `ThemeMode` in web; simple check constraint optional in migration.
- **Alternatives considered**:
  - Boolean `dark_mode` (rejected: spec uses named modes; less explicit in API).

## Decision 3: GitHub login column shape

- **Decision**: `github_login varchar(39) NULL` — nullable; empty string normalized to `NULL` on save.
- **Rationale**: GitHub username maximum length is 39 characters; optional field per spec FR-008.
- **Alternatives considered**:
  - Unique index across users (rejected: spec allows duplicate handles).
  - URL storage (rejected: spec defines handle only).

## Decision 4: Validation rules

- **Decision**:
  - Theme: reject unless `light` or `dark`.
  - GitHub: after trim, empty → `NULL`; non-empty must match `^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$` with length 1–39 (GitHub-style alphanumeric + internal hyphens, no leading/trailing hyphen).
- **Rationale**: Spec FR-009/FR-010; blocks URLs and spaces; returns 400 `VALIDATION_ERROR`.
- **Alternatives considered**:
  - Allow any unicode (rejected: spec requires ASCII alphanumeric + hyphens).
  - Case normalization on display (deferred: store trimmed user input; spec assumption allows display-as-entered).

## Decision 5: Self-service API surface

- **Decision**: New `PATCH /users/me` accepting partial body `{ themePreference?, githubLogin? }`; caller identity from `request.auth.userId`; response `{ user: UserProfile }`.
- **Rationale**: Spec FR-012; avoids admin-only `GET /users/:userId` paths; clear self-scope; matches Fastify auth middleware pattern on other routes.
- **Alternatives considered**:
  - `PUT /auth/me` (rejected: auth routes are session/token focused; profile fields fit user resource).
  - Separate endpoints per field (rejected: one profile save reduces round trips for GitHub + optional combined updates).

## Decision 6: Session identity payload

- **Decision**: Extend `AuthUserResponse` / `UserProfile` with `themePreference` and `githubLogin` (nullable string) on login, `/auth/me`, and `/auth/refresh`.
- **Rationale**: Spec FR-005, FR-011, US3; enables shell bootstrap without extra GET.
- **Alternatives considered**:
  - Profile-only GET endpoint (rejected: extra round trip; spec prefers session inclusion).

## Decision 7: Web theme bootstrap

- **Decision**: After successful login, `/auth/me` bootstrap, or refresh, if `user.themePreference` is set, call `setMode` in `AppThemeProvider` and `setThemeCookie` to align local cache with server.
- **Rationale**: Spec FR-014; server wins over stale cookie when authenticated.
- **Alternatives considered**:
  - Remove cookie entirely (rejected: still useful for pre-login flash; keep as cache).
  - Read theme only on Profile page (rejected: whole shell must reflect preference).

## Decision 8: Profile UI interaction

- **Decision**:
  - Theme toggle: optimistic UI + `PATCH` with `{ themePreference }` on change; revert + error alert on failure.
  - GitHub: controlled `TextField`, explicit **Save** button (or save on blur with loading state) calling `PATCH` with `{ githubLogin }`; inline helper text “GitHub username, not a URL”.
- **Rationale**: Spec US1/US2; theme already toggles inline; GitHub needs deliberate save to avoid validating partial typing.
- **Alternatives considered**:
  - Debounced auto-save for GitHub (acceptable variant; Save button clearer for validation errors).

## Decision 9: Contract and test layout

- **Decision**: Document delta in `contracts/profile-settings-api.yaml`; merge `UserProfile` fields and `PATCH /users/me` into `specs/004-user-role-profiles/contracts/user-roles-api.yaml` during implementation. Tests under `tests/014-profile-theme-github/`, `packages/backend/tests/profile-theme-github/`, `packages/web/tests/profile-theme-github/`.
- **Rationale**: Principle IV and VI; matches 013/004 patterns.

## Decision 10: Backfill for existing users

- **Decision**: Migration sets `theme_preference = 'light'` for all existing rows; `github_login` NULL.
- **Rationale**: Spec FR-002 and assumptions; no re-login required for default.
