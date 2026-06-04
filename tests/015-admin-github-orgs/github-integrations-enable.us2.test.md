# Acceptance: US2 Enable GitHub organization

Maps to `specs/015-admin-github-orgs/contracts/github-integrations-api.yaml`.

## Scenarios

1. Administrator `POST /github-integrations` with valid `login` returns `201` and persists the organization.
2. Duplicate login returns `409` `DUPLICATE_GITHUB_INTEGRATION_LOGIN`.
3. Invalid or empty login returns `400` `VALIDATION_ERROR`.
4. Non-administrator `POST` returns `403`.
5. Profile UI enable form calls the API and refreshes the list.

Automated coverage: `packages/backend/tests/admin-github-orgs/github-integrations-enable.us2.test.ts`, `github-integrations-auth.us2.test.ts`, `packages/web/tests/admin-github-orgs/admin-github-page-enable.us2.test.tsx`.
