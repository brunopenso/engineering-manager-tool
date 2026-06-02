# Data Model: Admin Users List Filters

No new database tables or migrations. Extends the **administrator user list query** with server-side filter parameters and UI filter state.

## Existing entities (unchanged persistence)

### User

| Field | Type | Notes |
|-------|------|-------|
| `full_name` | string | **Name filter** target (`fullName` in API) |
| `email` | string | **Email filter** target |

### UserRole (`user_roles`)

| Field | Type | Notes |
|-------|------|-------|
| `user_id` | uuid FK | Join to user |
| `role` | enum | `COLLABORATOR`, `LEADER`, `ADMINISTRATOR` — **role filter** target |

## API: GET /users query parameters

| Parameter | Required | Default | Notes |
|-----------|----------|---------|-------|
| `name` | no | — | Trimmed; case-insensitive substring on `full_name` |
| `email` | no | — | Trimmed; case-insensitive substring on `email` |
| `roles` | no | — | Repeatable enum; OR semantics; omit when empty |

**Combined filter**: AND across provided dimensions. Scope: all users (administrator-only endpoint).

### Response

`{ users: UserProfile[] }` — unchanged shape from `004-user-role-profiles`; each profile includes `roles` array.

### Errors

| Condition | Response |
|-----------|----------|
| Invalid `roles` value | 400 `VALIDATION_ERROR` |
| Non-administrator caller | 403 `FORBIDDEN` |

## UI filter state (session-local)

| Field | Default | Notes |
|-------|---------|-------|
| `name` | `''` | Debounced 300ms before API call |
| `email` | `''` | Debounced 300ms before API call |
| `selectedRoles` | `[]` | Empty = omit `roles` from query; immediate refetch on change |

**Clear all filters**: reset all fields to defaults → `GET /users` with no filter params.

## State transitions

```text
[Load page] --> no filters --> GET /users

[Change name/email] --> debounce 300ms --> GET /users?name&email&roles...

[Change roles] --> GET /users?...

[Clear all filters] --> reset state --> GET /users

[Grant/revoke role] --> GET /users with current filter params
```

## Access control

Unchanged from feature 004: only administrators may call `GET /users`. Filter parameters do not bypass the administrator gate.

## Empty states

| Condition | UI message |
|-----------|------------|
| Filters active, zero rows | No users match filters + clear hint |
| No filters, zero rows | No users in organization (if applicable) |
| Loading | Loading users... |
| API error | Existing error alert |
