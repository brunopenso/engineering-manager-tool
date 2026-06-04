# Acceptance: US3 Maintain enabled organizations

Maps to `specs/015-admin-github-orgs/contracts/github-integrations-api.yaml`.

## Scenarios

1. Administrator `GET /github-integrations` returns all enabled organizations with stable `id` and `login`.
2. Administrator `DELETE /github-integrations/:integrationId` removes the row and returns `204`.
3. Unknown `integrationId` returns `404`.
4. UI disable confirmation removes the row and shows empty state when last org is disabled.

Automated coverage: `packages/backend/tests/admin-github-orgs/github-integrations-list.us3.test.ts`, `github-integrations-disable.us3.test.ts`, `packages/web/tests/admin-github-orgs/admin-github-page-disable.us3.test.tsx`.
