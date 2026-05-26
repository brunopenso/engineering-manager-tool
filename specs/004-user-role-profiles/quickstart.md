# Quickstart: User Role Profiles

## Preconditions

- Node.js 24+ and PostgreSQL configured (same as auth feature).
- Backend running with existing Google authentication.
- At least one user record exists (or sign in once to create one).

## 1. Install dependencies

From repository root:

```bash
npm install
```

## 2. Environment variables

Add to backend environment (example):

- `BOOTSTRAP_ADMIN_EMAILS` — optional comma-separated list of emails to receive `ADMINISTRATOR` during migration backfill (use for first admin in dev).

## 3. Create and run migrations

From repository root:

```bash
npm run db:migration:create --workspace @em-tool/backend -- AddUserRolesAndRoleAssignmentEvents
```

Implement migration in `packages/backend/database/migrations` per `data-model.md`:

- Create `user_roles` table with unique (`user_id`, `role`).
- Create `role_assignment_events` table.
- Backfill `COLLABORATOR` for all existing users.
- Optionally seed `ADMINISTRATOR` from `BOOTSTRAP_ADMIN_EMAILS`.

Run migrations:

```bash
npm run db:migration:run --workspace @em-tool/backend
```

## 4. Backend implementation checklist

In `packages/backend`:

- Add `UserRole` and `RoleAssignmentEvent` entities.
- Extend `userService` to ensure collaborator on user creation.
- Add `roleService` for grant/revoke with audit writes.
- Add `authorizationService` (`hasRole`, `requireAdministrator`).
- Extend `authUserMapper` / `AuthUserResponse` with `roles: UserRoleType[]`.
- Register routes: `GET /users`, `GET /users/:userId`, `PATCH /users/:userId/roles`.
- Extend auth middleware to load roles into request context after token verification.

## 5. Web implementation checklist

In `packages/web`:

- Extend `AuthUser` / `authApi` types with `roles`.
- Add `/app/profile` page showing active roles (all users).
- Add `/app/admin/users` page for administrator role management (`frontend-design` skill).
- Hide admin menu entry unless `ADMINISTRATOR` is in session roles.
- Add shell menu entries and route guards aligned with `contracts/user-roles-api.yaml`.

## 6. Run locally

```bash
npm run dev
```

## 7. Verify acceptance (manual)

### Collaborator default (US1)

1. Sign in with Google as a new user.
2. Call `GET /auth/me` with bearer token.
3. Expect `roles` contains `COLLABORATOR` only.

### View own profile (US2)

1. Open `/app/profile` while signed in.
2. Expect displayed roles match `/auth/me` response.

### Administrator role management (US3)

1. Ensure bootstrap admin email has `ADMINISTRATOR`.
2. Sign in as admin; open `/app/admin/users`.
3. Grant `LEADER` to another user via UI or:

```bash
curl -X PATCH "http://localhost:3001/users/{targetUserId}/roles" \
  -H "Authorization: Bearer {adminToken}" \
  -H "Content-Type: application/json" \
  -d '{"role":"LEADER","action":"GRANT"}'
```

4. Sign in as target user; confirm `roles` includes `COLLABORATOR` and `LEADER`.

### Authorization denials (US3/US4)

1. As collaborator-only user, call `PATCH /users/{id}/roles` → expect `403`.
2. As collaborator-only user, call `GET /users` → expect `403`.

## 8. Automated test expectations

- Backend integration tests: role backfill, grant/revoke idempotency, collaborator immutability, admin-only guards, audit row creation.
- Web tests: profile role display, admin route guard, admin UI grant/revoke flow.
- DAC fixtures: collaborator self-only deny cases; leader role check present (hierarchy data deferred).

## 9. Build verification

```bash
npm run build
npm run lint
npm test
```
