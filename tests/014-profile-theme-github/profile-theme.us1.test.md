# Acceptance: US1 Profile theme persistence

Maps to `specs/014-profile-theme-github/contracts/profile-settings-api.yaml`.

## Scenarios

1. Default appearance is `light` for users without an explicit save.
2. `PATCH /users/me` with `{ "themePreference": "dark" }` persists and returns `dark`.
3. `PATCH /users/me` with `{ "themePreference": "light" }` overwrites a previous dark preference.
4. Invalid `themePreference` returns `400` `VALIDATION_ERROR`.
5. Unauthenticated `PATCH /users/me` returns `401`.
6. Profile UI toggle triggers `patchMyProfile` and reflects saved preference.

Automated coverage: `packages/backend/tests/profile-theme-github/profile-settings-theme.us1.test.ts`, `packages/web/tests/profile-theme-github/profile-page-theme.us1.test.tsx`.
