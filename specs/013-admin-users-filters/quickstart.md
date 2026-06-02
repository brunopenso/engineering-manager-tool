# Quickstart: Admin Users List Filters

## Preconditions

- Node.js 24+ and PostgreSQL configured.
- Branch: `013-admin-users-filters`.
- Administrator test user available (see `packages/backend/src/test/fixtures/roles.ts`).

## 1. Backend

In `packages/backend`:

- Add `AdminUserListFilters` type (`name?`, `email?`, `roles?`).
- Add `parseAdminUserListFilters(query)` in `services/adminUserListQuery.ts`:
  - Trim `name` / `email`; omit if empty.
  - Parse repeatable `roles`; validate each against `USER_ROLE_TYPES`; throw `DeliverableValidationError` or shared validation error → route returns 400.
- Add `findUsersForAdmin(filters)` in `services/userService.ts`:
  - Query builder on `users` with optional `LOWER(fullName) LIKE` and `LOWER(email) LIKE`.
  - Role filter via `EXISTS` subquery on `user_roles` with `IN (:roles)`.
  - `orderBy email ASC`; return `User[]`.
- Update `GET /users` in `routes/users.ts` to parse query, call `findUsersForAdmin`, map with `mapUserToAuthResponse`.
- Tests: `packages/backend/tests/admin-users-filters/admin-users-list-filters.*.test.ts` (name, email, role OR, AND combo, invalid role 400, non-admin 403).

## 2. Frontend

In `packages/web`:

- Add `AdminUserListFilters` type and extend `listUsers(accessToken, filters?)` to append `URLSearchParams` (`name`, `email`, repeated `roles`).
- Update `AdminUsersPage.tsx`:
  - Filter bar above table: name `TextField`, email `TextField`, role `Select` multi (or Autocomplete multiple) with Collaborator / Leader / Administrator labels matching `RoleBadgeList`.
  - Debounce name/email 300ms (`useDebouncedValue` or equivalent).
  - `useEffect` refetch when token or debounced filters / roles change.
  - **Clear all filters** when any filter active.
  - Empty states: filtered zero vs unfiltered zero.
  - After `updateUserRole`, call `refreshUsers()` with current filter state.
- Use `frontend-design` skill for layout (stacked filter row, responsive wrap, accessible labels).

## 3. Contract

- `specs/013-admin-users-filters/contracts/admin-users-filters-api.yaml`.
- Merge query parameters into `specs/004-user-role-profiles/contracts/user-roles-api.yaml` `GET /users` during implementation.

## 4. Verify

```bash
npm run test --workspace @em-tool/backend -- --run admin-users-filters
npm run test --workspace @em-tool/web -- --run admin-users-filters
npm run test --workspace @em-tool/web -- --run admin-users.us3
npm run lint
```

**Verified 2026-06-01**: Backend `admin-users-filters` suites (13 tests) and web `admin-users-filters` + `admin-users.us3` suites passing.

Manual: sign in as administrator; open `/app/admin/users`; filter by partial name, email, and role; clear all; grant/revoke a role and confirm list respects active filters. Confirm network tab shows query params and no full-list client-side filtering.

## 5. Out of scope

- Client-side-only filtering.
- Filter persistence across sessions or URL deep-linking.
- Pagination (existing full list acceptable for v1).
- Changes to non-admin user endpoints or hierarchical screens.
