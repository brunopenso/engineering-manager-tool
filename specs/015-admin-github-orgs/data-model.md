# Data Model: Administrator GitHub Organization Configuration

## Database: `github_integrations`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK, generated | Stable identifier |
| `organization_name` | varchar(39) | NOT NULL, **UNIQUE** | Organization slug; stored lowercase |
| `created_at` | timestamptz | NOT NULL | Audit |
| `updated_at` | timestamptz | NOT NULL | Audit |

**Migration**: Create `github_integrations` table with unique index on `organization_name`.

**Entity**: `GithubIntegration` mapped to `github_integrations`.

**Lifecycle**: POST creates row (enable); DELETE removes row (disable). No historical disabled rows in v1.

## API: GithubIntegration (response shape)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | uuid | yes | |
| `organizationName` | string | yes | Canonical lowercase slug (`organization_name` column) |
| `createdAt` | date-time | yes | ISO string in JSON |
| `updatedAt` | date-time | optional in list | ISO string if exposed |

### List response

`GET /github-integrations`

```json
{ "integrations": [ GithubIntegration, ... ] }
```

### Create request

| Field | Type | Validation |
|-------|------|------------|
| `organizationName` | string | Trim; slug rules; lowercase persist; unique (`organization_name`) |

### Create response

`POST /github-integrations`

```json
{ "integration": GithubIntegration }
```

Status **201** on success.

### Delete (disable)

`DELETE /github-integrations/:integrationId` → **204**; **404** if id not found.

## Errors

| Condition | HTTP | Code |
|-----------|------|------|
| Invalid organization name format | 400 | `VALIDATION_ERROR` |
| Duplicate organization name | 409 | `DUPLICATE_GITHUB_INTEGRATION_LOGIN` |
| Non-administrator | 403 | `FORBIDDEN` |
| Missing auth | 401 | `MISSING_APP_TOKEN` |
| Unknown id on delete | 404 | `NOT_FOUND` |

## UI state (AdminGithubIntegrationsPage)

| State | Notes |
|-------|-------|
| `integrations` | From `GET /github-integrations` |
| `organizationNameDraft` | Add form input |
| `errorMessage` | API errors |
| `disableTarget` | Row pending confirmation dialog |
| `isLoading` | Initial list fetch |

## Access control

| Actor | GET list | POST enable | DELETE disable | Menu / screen |
|-------|----------|-------------|----------------|---------------|
| Administrator | Allow | Allow | Allow | Visible |
| Other authenticated | Deny | Deny | Deny | Hidden / blocked |
| Unauthenticated | Deny | Deny | Deny | Redirect login |

## Relationships

- **No FK** to `users` in v1; global configuration table.
- Future GitHub features consume `github_integrations` as the enabled-org allowlist.
