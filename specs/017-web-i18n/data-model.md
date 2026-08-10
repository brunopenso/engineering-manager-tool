# Data Model: Web Internationalization (i18n)

## Backend (existing — no schema changes)

Columns on `users` (migration `1779770000000-AddUserProfileLocalePreferences`):

| Column                   | Type                   | Default | Allowed values      |
| ------------------------ | ---------------------- | ------- | ------------------- |
| `language_preference`    | `varchar(10)` NOT NULL | `en-US` | `en-US`, `pt-BR`    |
| `date_format_preference` | `varchar(3)` NOT NULL  | `MDY`   | `MDY`, `DMY`, `YMD` |

Canonical types: `packages/backend/src/types/profilePreferences.ts`.

`UserProfile` / auth session payload fields (camelCase):

| Field                  | Type                    | Notes                           |
| ---------------------- | ----------------------- | ------------------------------- |
| `languagePreference`   | `en-US` \| `pt-BR`      | UI translation catalog selector |
| `dateFormatPreference` | `MDY` \| `DMY` \| `YMD` | Display date component order    |

`PATCH /users/me` accepts optional `languagePreference` and `dateFormatPreference` alongside `themePreference` and `githubLogin` (at least one field required).

## Web client types (to extend)

### `AuthUser` (`authApi.ts`, `AuthProvider.tsx`)

Add to existing shape:

```typescript
languagePreference: 'en-US' | 'pt-BR';
dateFormatPreference: 'MDY' | 'DMY' | 'YMD';
```

Defaults when absent in test fixtures: `en-US`, `MDY` (match backend defaults).

### `ProfileSettingsUpdate` (`profileApi.ts`)

```typescript
languagePreference?: 'en-US' | 'pt-BR';
dateFormatPreference?: 'MDY' | 'DMY' | 'YMD';
```

## Translation catalog (web-only, not persisted)

### Locale directories

```text
packages/web/src/locales/
├── en-US/
│   ├── common.json       # shared buttons, errors, loading
│   ├── shell.json        # navigation, header, unavailable page
│   ├── auth.json         # login
│   ├── profile.json
│   ├── deliverables.json
│   ├── leader.json       # team deliverables, analytics, hierarchy
│   └── admin.json
└── pt-BR/
    └── (same files, matching keys)
```

### Key naming convention

- Flat keys within namespace using dot segments: `"list.title"`, `"form.save"`, `"filters.dateRange"`.
- Interpolation: `{{name}}`, `{{count}}` (i18next default).
- Pluralization where needed: `"items_one"`, `"items_other"` or i18next JSON v4 plural keys.

### Namespace → surface mapping

| Namespace      | Primary surfaces                                                                |
| -------------- | ------------------------------------------------------------------------------- |
| `common`       | Generic actions, validation fallbacks, save errors                              |
| `shell`        | `shellOptions.ts`, `AppShellLayout`, `ShellNavigation`, `OptionUnavailablePage` |
| `auth`         | `LoginPage`                                                                     |
| `profile`      | `ProfilePage`, `RoleBadgeList` role labels                                      |
| `deliverables` | `DeliverablesPage`, `DeliverableFormPage`, `DeliverablesViewPage`               |
| `leader`       | Leader pages + `components/leader-*`, `components/team-deliverables/*`          |
| `admin`        | `AdminUsersPage`, `AdminTagsPage`, `AdminGithubIntegrationsPage`                |

## Runtime state (web)

| State                  | Source                                      | Lifecycle                                                       |
| ---------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| Active i18n language   | `i18n.language`                             | Set by detector (anonymous) or `AuthLocaleSync` (authenticated) |
| `dateFormatPreference` | `user.dateFormatPreference` via `useAuth()` | Updated on profile save; read by `formatDisplayDate`            |
| MUI locale object      | derived from `languagePreference`           | Updated when i18n language changes                              |

## Validation rules (inherited from backend)

| Field                  | Rule                           | Error                  |
| ---------------------- | ------------------------------ | ---------------------- |
| `languagePreference`   | Must be `en-US` or `pt-BR`     | 400 `VALIDATION_ERROR` |
| `dateFormatPreference` | Must be `MDY`, `DMY`, or `YMD` | 400 `VALIDATION_ERROR` |

Web profile UI MUST only offer enumerated values (no free-text).

## Out of scope (not translated / not modeled)

- User-generated deliverable text, tag names, review notes
- Raw API error `message` strings (may display in English)
- Google OAuth widget copy (provider-controlled)
