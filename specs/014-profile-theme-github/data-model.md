# Data Model: Profile Theme and GitHub Login

## Database changes (`users` table)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `theme_preference` | `varchar(5)` | NO | `'light'` | Allowed values: `light`, `dark` |
| `github_login` | `varchar(39)` | YES | NULL | GitHub username handle; NULL = unset |

**Migration**: Add columns with `IF NOT EXISTS`; backfill `theme_preference = 'light'` for existing rows.

**Entity** (`User`): map to `themePreference` and `githubLogin` camelCase properties.

## API: UserProfile (extended)

| Field | Type | Required in response | Notes |
|-------|------|---------------------|-------|
| `id` | uuid | yes | unchanged |
| `email` | string | yes | unchanged |
| `fullName` | string | yes | unchanged |
| `firstLoginAt` | date-time | yes | unchanged |
| `lastLoginAt` | date-time | yes | unchanged |
| `roles` | UserRoleType[] | yes | unchanged |
| `themePreference` | `light` \| `dark` | yes | always present; default `light` |
| `githubLogin` | string \| null | yes | `null` when unset |

## API: PATCH /users/me

**Authentication**: Bearer app token (`request.auth`).

**Request body** (all fields optional; at least one required):

| Field | Type | Validation |
|-------|------|------------|
| `themePreference` | `light` \| `dark` | enum only |
| `githubLogin` | string \| null | trim; empty → null; non-empty → GitHub handle rules |

**Response**: `{ user: UserProfile }`

**Errors**:

| Condition | Response |
|-----------|----------|
| Missing bearer | 401 `MISSING_APP_TOKEN` / `INVALID_APP_TOKEN` |
| Empty body / no recognized fields | 400 `VALIDATION_ERROR` |
| Invalid theme or GitHub format | 400 `VALIDATION_ERROR` |
| User not found for token subject | 401 `INVALID_APP_TOKEN` |

**Authorization**: Only the authenticated user's row is updated (`request.auth.userId`). No `userId` path parameter.

## UI state (Profile page)

| Field | Source | Notes |
|-------|--------|-------|
| `themePreference` | `user.themePreference` from auth + local `useAppTheme` | Toggle PATCH on change |
| `githubLogin` | Local draft + `user.githubLogin` from auth | Save button commits PATCH |
| `saveStatus` | idle \| saving \| error | For GitHub and theme error handling |

## Session bootstrap flow

```text
[Login / auth/me / refresh]
  --> UserProfile includes themePreference, githubLogin
  --> setMode(themePreference) + setThemeCookie
  --> Render shell with correct theme

[Profile: toggle theme]
  --> optimistic setMode + PATCH themePreference
  --> on failure: revert mode + error

[Profile: save GitHub]
  --> PATCH githubLogin
  --> update auth user state (setSession) on success
```

## Access control

| Actor | Read | Update |
|-------|------|--------|
| Signed-in user | Own fields via session + Profile | `PATCH /users/me` only |
| Unauthenticated | — | Denied |
| Administrator (directory) | Unchanged (no new columns in admin list) | No cross-user profile edit in this feature |

## Key entities (logical)

- **User account**: gains appearance preference and optional GitHub login.
- **Profile settings**: `{ themePreference, githubLogin }` — editable subset on Profile screen.
