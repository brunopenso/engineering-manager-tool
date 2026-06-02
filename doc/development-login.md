# Development login (local only)

Prerequisites: [getting-started.md](getting-started.md).

Use dev login when you need to test the app as different users (collaborator,
leader, admin, hierarchy views) but do not have Google access to those accounts.

Dev login **does not bypass authorization**. It only skips Google OAuth. Roles
and org hierarchy still come from PostgreSQL, same as in production.

## Enable dev login

Complete [getting-started.md](getting-started.md) first (env files copied,
migrations applied). The example env files already enable dev login with matching
secrets.

1. Confirm these variables are set in `packages/backend/.env` and
   `packages/web/.env` (enabled by default in `.env.example`):

   ```env
   DEV_AUTH_ENABLED=true
   DEV_AUTH_SECRET=local-dev-only-change-me
   VITE_DEV_AUTH_ENABLED=true
   VITE_DEV_AUTH_SECRET=local-dev-only-change-me
   ```

   The secret in both files **must match**. Change it to any value you like for
   local use.

2. Start or restart dev servers:

   ```bash
   npm run dev
   ```

3. Confirm the backend logs `DEV AUTH ENABLED — do not use in production` at
   startup.

## Use dev login in the browser

1. Open [http://localhost:3000/login](http://localhost:3000/login).
2. Below the Google sign-in button, a **Development login** section appears.
3. Choose one of these options:

   **Sign in as an existing user**

   - Pick a user from the **Existing user** dropdown (shows name, email, and roles).
   - Click **Sign in as selected user**.

   **Sign in with a new email**

   - Enter an **Email** and optional **Full name**.
   - Click **Sign in with email**.
   - A new user is created with the default `COLLABORATOR` role.

4. You are redirected to `/app` with a normal JWT session, identical to a Google login.

To switch users, sign out and return to `/login`, then pick a different account.

## Prepare users for role and hierarchy testing

Dev login signs you in as a user; it does not grant roles automatically (except
the default collaborator role for newly created users). To test admin, leader, or
hierarchy features:

1. Sign in once (via Google or dev login) with an account you control.
2. Grant roles through the admin UI, or insert rows in `user_roles`:

   ```sql
   INSERT INTO user_roles (user_id, role)
   SELECT id, 'ADMINISTRATOR' FROM users WHERE email = 'admin@example.com'
   ON CONFLICT DO NOTHING;

   INSERT INTO user_roles (user_id, role)
   SELECT id, 'LEADER' FROM users WHERE email = 'leader@example.com'
   ON CONFLICT DO NOTHING;
   ```

3. Create subordinates via leader APIs or set `users.leader_id` in the database.
4. Use the dev login picker to switch between those users.

Optional: set `BOOTSTRAP_ADMIN_EMAILS=your@email.com` in `packages/backend/.env`
before running migrations to auto-grant `ADMINISTRATOR` to specific emails on
first migration backfill.

## Dev login API (optional)

You can also call the backend directly (for scripts or API clients):

```bash
# List users
curl -s http://localhost:3001/auth/dev/users \
  -H "X-Dev-Auth-Secret: local-dev-only-change-me"

# Sign in as an existing user
curl -s -X POST http://localhost:3001/auth/dev/login \
  -H "Content-Type: application/json" \
  -H "X-Dev-Auth-Secret: local-dev-only-change-me" \
  -d '{"userId":"<user-uuid>"}'

# Sign in with a new email
curl -s -X POST http://localhost:3001/auth/dev/login \
  -H "Content-Type: application/json" \
  -H "X-Dev-Auth-Secret: local-dev-only-change-me" \
  -d '{"email":"report@example.com","fullName":"Direct Report"}'
```

Use the returned `accessToken` as `Authorization: Bearer <token>` on protected routes.

## Disable dev login

Remove or set to `false`:

```env
DEV_AUTH_ENABLED=false
VITE_DEV_AUTH_ENABLED=false
```

Restart `npm run dev`. The development login section disappears from the login page.

## Security notes

Dev login is **disabled in production** (`NODE_ENV=production`), even if env vars
are set. Never enable it in deployed environments.

| Guard | Purpose |
|-------|---------|
| `NODE_ENV !== 'production'` | Hard block in production |
| `DEV_AUTH_ENABLED=true` | Explicit opt-in on the backend |
| `VITE_DEV_AUTH_ENABLED=true` | Explicit opt-in on the web app |
| `X-Dev-Auth-Secret` header | Required on every dev auth API request |
| No role override in login body | Roles remain DB-authoritative |
