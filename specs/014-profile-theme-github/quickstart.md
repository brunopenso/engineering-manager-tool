# Quickstart: Profile Theme and GitHub Login

## Preconditions

- Node.js 24+ and PostgreSQL configured.
- Branch: `014-profile-theme-github`.
- Run migrations after implementation: `npm run db:migration:run --workspace @em-tool/backend`.

## 1. Backend migration and entity

In `packages/backend`:

- Create migration adding `theme_preference` (NOT NULL, default `light`) and `github_login` (nullable, max 39) to `users`.
- Update `database/entities/User.ts` with `themePreference` and `githubLogin` columns.
- Add `userProfileValidation.ts` with `parseThemePreference` and `parseGithubLogin` (trim, empty → null, regex + length).
- Add `updateUserProfileSettings(userId, partial)` in `userService.ts`.
- Extend `authUserMapper.ts` `AuthUserResponse` with new fields (default theme `light`, github `null`).
- Register `PATCH /users/me` in `routes/users.ts` (or dedicated `profile.ts` registered in app): require auth, validate body, update, return `mapUserToAuthResponse`.
- Tests in `packages/backend/tests/profile-theme-github/`:
  - Default theme light on existing user
  - PATCH theme dark/light
  - PATCH github valid / clear / invalid
  - PATCH without auth → 401
  - GET `/auth/me` includes new fields after update

## 2. Frontend

In `packages/web`:

- Extend `AuthUser` in `authApi.ts` and `AuthProvider.tsx` with `themePreference` and `githubLogin`.
- Add `profileApi.ts` with `patchMyProfile(accessToken, body)`.
- Update `ProfilePage.tsx`:
  - GitHub `TextField` + Save + helper text
  - Theme toggle calls `patchMyProfile` on change; error revert
  - On success, update session user via `setSession`
- Wire theme bootstrap: after login / session restore, `setMode(user.themePreference)` and sync cookie (hook in `AuthProvider` or parent wrapping `AppThemeProvider`).
- Move or extend tests from `packages/web/tests/profile/profile-theme.test.tsx` into `packages/web/tests/profile-theme-github/` for server-backed theme.
- Add GitHub save/validation UI tests.

## 3. Contract

- `specs/014-profile-theme-github/contracts/profile-settings-api.yaml`
- Merge `themePreference`, `githubLogin` on `UserProfile` and `PATCH /users/me` into `specs/004-user-role-profiles/contracts/user-roles-api.yaml`.

## 4. Verify

```bash
npm run db:migration:run --workspace @em-tool/backend
npm run test --workspace @em-tool/backend -- --run profile-theme-github
npm run test --workspace @em-tool/web -- --run profile-theme-github
npm run test --workspace @em-tool/web -- --run profile/profile-theme
npm run lint --workspace @em-tool/backend
npm run lint --workspace @em-tool/web
```

### Verification outcomes (2026-06-04)

- Migration `AddUserProfilePreferences1779768000000` applied successfully.
- Backend: 12 tests passed in `packages/backend/tests/profile-theme-github/`.
- Web: 6 tests passed in `packages/web/tests/profile-theme-github/` and `packages/web/tests/profile/profile-theme.test.tsx`.
- Lint: `@em-tool/backend` and `@em-tool/web` `tsc --noEmit` passed.

## Manual smoke

1. Sign in → confirm theme matches account (default light).
2. `/app/profile` → switch to dark → reload → still dark.
3. Set GitHub login `my-handle` → save → reload shows value.
4. Clear GitHub → save → field empty.
5. Invalid handle `bad handle!` → error, not saved.
