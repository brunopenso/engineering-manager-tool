# Research: Administrator GitHub Organization Configuration

## Decision 1: Persistence model

- **Decision**: New table **`github_integrations`** with columns `id` (uuid PK), `login` (varchar 39, unique), `created_at`, `updated_at`. Only enabled organizations exist as rows; disabling deletes the row.
- **Rationale**: User clarification (2026-06-04); spec FR-003/FR-012; simplest expression of “enabled list”.
- **Alternatives considered**:
  - `github_enabled_organizations` (rejected after clarification).
  - `enabled` boolean flag (rejected for v1).

## Decision 2: API resource naming

- **Decision**: Administrator API at **`/github-integrations`** (`GET`, `POST`, `DELETE /github-integrations/:integrationId`). JSON collection key **`integrations`**; single resource **`integration`**.
- **Rationale**: User clarification; aligns persistence name with HTTP resource; room for future integration fields on same table.
- **Alternatives considered**:
  - `/github-organizations` (rejected after clarification).

## Decision 3: Organization login normalization

- **Decision**: Trim input; validate GitHub org slug format; persist `login` as **lowercase**; unique index on `login`.
- **Rationale**: Spec edge case on letter case; same rules as profile GitHub handle validation.

## Decision 4: Validation rules

- **Decision**: Slug pattern `^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$`, length 1–39.
- **Rationale**: Spec FR-004/FR-005/FR-010.

## Decision 5: Authorization

- **Decision**: All routes require bearer auth + `assertAdministrator`; web uses `AdminRoute` on `/app/admin/github`.
- **Rationale**: Spec FR-011; same as tags admin.

## Decision 6: Duplicate handling

- **Decision**: Unique constraint on `login`; duplicate insert returns **409** with `DUPLICATE_GITHUB_INTEGRATION_LOGIN`.
- **Rationale**: Spec FR-006; mirrors tags duplicate pattern.

## Decision 7: Web shell and screen

- **Decision**: Route `/app/admin/github`; menu **GitHub integration**; page lists rows from `GET /github-integrations`.
- **Rationale**: Spec FR-001/FR-002.

## Decision 8: Test layout

- **Decision**: `tests/015-admin-github-orgs/`; `packages/backend/tests/admin-github-orgs/`; `packages/web/tests/admin-github-orgs/`.
- **Rationale**: Constitution VI.

## Decision 9: Entity naming

- **Decision**: TypeORM entity **`GithubIntegration`** → table **`github_integrations`**; service **`githubIntegrationService`**; routes **`githubIntegrations.ts`**.
- **Rationale**: Matches clarified table and API names.
