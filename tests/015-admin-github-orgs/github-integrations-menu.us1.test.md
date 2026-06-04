# Acceptance: US1 GitHub integration menu and screen

Maps to `specs/015-admin-github-orgs/contracts/github-integrations-api.yaml`.

## Scenarios

1. Administrator sees **GitHub integration** in the Administration menu.
2. Non-administrator does not see the menu entry.
3. Administrator opens `/app/admin/github` and sees the configuration screen.
4. Non-administrator navigating to `/app/admin/github` is redirected away.
5. Empty `GET /github-integrations` shows an empty-state message on the screen.

Automated coverage: `packages/backend/tests/admin-github-orgs/github-integrations-auth.us1.test.ts`, `packages/web/tests/admin-github-orgs/admin-github-menu.us1.test.tsx`, `admin-github-route-guard.us1.test.tsx`, `admin-github-page-empty.us1.test.tsx`.
