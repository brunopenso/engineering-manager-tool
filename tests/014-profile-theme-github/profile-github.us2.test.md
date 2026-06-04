# Acceptance: US2 GitHub login on profile

Maps to `specs/014-profile-theme-github/contracts/profile-settings-api.yaml`.

## Scenarios

1. Empty GitHub login clears stored value (`null` in API).
2. Valid handle is trimmed and saved.
3. Invalid characters return `400` with message.
4. Overlong handle (>39) returns `400`.
5. Profile Save button calls `patchMyProfile({ githubLogin })`.
6. Session user updates after successful save.

Automated coverage: `packages/backend/tests/profile-theme-github/profile-settings-github.us2.test.ts`, `packages/web/tests/profile-theme-github/profile-page-github.us2.test.tsx`.
