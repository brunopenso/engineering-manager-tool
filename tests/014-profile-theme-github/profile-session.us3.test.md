# Acceptance: US3 Session identity profile fields

Maps to `specs/014-profile-theme-github/contracts/profile-settings-api.yaml`.

## Scenarios

1. `POST /auth/refresh` returns `themePreference` and `githubLogin` on `user`.
2. After profile update, refreshed session reflects latest GitHub login.
3. `AuthThemeSync` applies `user.themePreference` and updates theme cookie on bootstrap.

Automated coverage: `packages/backend/tests/profile-theme-github/profile-settings-session.us3.test.ts`, `packages/web/tests/profile-theme-github/profile-session-theme.us3.test.tsx`.
