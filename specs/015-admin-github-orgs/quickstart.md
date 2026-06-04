# Quickstart: Administrator GitHub Organization Configuration

## Preconditions

- Node.js 24+ and PostgreSQL configured.
- Branch: `015-admin-github-orgs`.
- At least one user with `ADMINISTRATOR` role.

## 1. Backend

In `packages/backend`:

- Add `DUPLICATE_GITHUB_INTEGRATION_LOGIN` to `auth/types.ts`.
- Create migration for table **`github_integrations`**.
- Add entity `GithubIntegration.ts` → table `github_integrations`.
- Add `githubIntegrationValidation.ts` and `githubIntegrationService.ts`.
- Add `routes/githubIntegrations.ts`: `GET` / `POST` / `DELETE /github-integrations/:integrationId` + `assertAdministrator`.
- Register routes in `index.ts`.
- Tests in `packages/backend/tests/admin-github-orgs/`.

## 2. Frontend

In `packages/web`:

- Menu **GitHub integration** + route `/app/admin/github`.
- Add `githubIntegrationsApi.ts` calling **`/github-integrations`**.
- Create `AdminGithubIntegrationsPage.tsx` (uses `integrations` list from API).
- `AdminRoute` guard on `/app/admin/github`.
- Tests in `packages/web/tests/admin-github-orgs/`.

## 3. Contract

- `specs/015-admin-github-orgs/contracts/github-integrations-api.yaml`

## 4. Verify

```bash
npm run db:migration:run --workspace @em-tool/backend
npm run test --workspace @em-tool/backend -- --run admin-github-orgs
npm run test --workspace @em-tool/web -- --run admin-github-orgs
npm run lint
```

## Manual smoke

1. Administration → **GitHub integration**.
2. `POST /github-integrations` with `{ "login": "my-org" }` → row in **`github_integrations`**.
3. `DELETE /github-integrations/:id` → row removed.
