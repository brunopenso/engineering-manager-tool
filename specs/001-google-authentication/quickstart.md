# Quickstart: Google-only Authentication

## Preconditions

- Node.js 24+ installed.
- PostgreSQL running and reachable with backend environment variables.
- Google OAuth client configured for web login and backend token audience validation.

## 1. Install dependencies

From repository root:

- npm install

## 2. Prepare backend environment

Configure backend env values (example names):

- DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME
- GOOGLE_CLIENT_ID
- APP_AUTH_SECRET
- APP_AUTH_TOKEN_TTL

## 3. Create and run migrations

From repository root:

- npm run db:migration:create --workspace @em-tool/backend -- AddUserAndLoginAuditTables
- Edit generated migration in packages/backend/database/migrations with User and LoginAudit tables.
- npm run db:migration:run --workspace @em-tool/backend

## 4. Implement backend auth flow

In packages/backend:

- Add entities for User and LoginAuditEvent.
- Add Google token validation service.
- Add auth route(s) for Google login and session introspection.
- Keep healthcheck endpoints (`/healthcheck` and `/healthcheck/complete`) public as operational exceptions.
- Protect non-public routes with authentication middleware.

## 5. Implement web auth flow

In packages/web:

- Build login page with Google sign-in button as the only entry method.
- Add authenticated route guard for all non-login pages.
- Add welcome page showing the message: Welcome to the system.
- Redirect successful login to the welcome page.

## 6. Run locally

From repository root:

- npm run dev

Expected local behavior:

- Login route is publicly accessible.
- All other web routes redirect to login when unauthenticated.
- Backend healthcheck endpoints remain publicly accessible without authentication.
- Successful Google login redirects to welcome page.
- Backend creates/updates User and writes LoginAuditEvent.

## 7. Verify acceptance

- First login creates one User row with firstLoginAt and lastLoginAt.
- Second login for same email updates only lastLoginAt.
- Each successful login writes exactly one LoginAuditEvent row.
- Invalid/expired Google token denies access and does not write success audit.
- Invalid, expired, issuer-mismatch, and audience-mismatch token failures return distinct user-readable messages.

## 8. Validate public operational endpoints (T036)

From repository root, while backend is running:

```bash
curl -i http://localhost:3001/healthcheck
curl -i http://localhost:3001/healthcheck/complete
```

Expected evidence:

- Both requests return responses without authentication challenges.
- `/healthcheck` returns `200`.
- `/healthcheck/complete` returns `200` (healthy) or `503` (degraded), but never auth-related `401`.

Current run evidence:

- Backend now starts in degraded mode when database initialization fails.
- `GET /healthcheck` (no auth): `200` with `{"status":"ok"}`.
- `GET /healthcheck/complete` (no auth): `503` with `{"status":"degraded","checks":{"database":{"status":"error","message":"Database connection is not initialized"}}}`.

## 9. Feature verification checklist (T039)

- [ ] US1: Google login success redirects user to `/welcome` and displays `Welcome to the system`.
- [x] US1: Invalid token shows `Google token is invalid.`
- [ ] US1: Expired token shows `Google token has expired.`
- [ ] US1: Issuer mismatch shows `Google token issuer is not accepted.`
- [ ] US1: Audience mismatch shows `Google token audience does not match this application.`
- [ ] US2: First login creates user with `firstLoginAt` and `lastLoginAt`.
- [ ] US2: Repeat login updates only `lastLoginAt` for existing user.
- [ ] US3: Successful login writes one `LoginAuditEvent`.
- [ ] US3: Failed login writes no successful-login audit event.

Current run evidence:

- Build verification passed (`npm run build`).
- Lint verification passed (`npm run lint`).
- `POST /auth/google/login` with invalid token returned `401` and `{"code":"INVALID_TOKEN","message":"Google token is invalid."}`.
- `GET /auth/me` without bearer token returned `401` and `{"code":"MISSING_APP_TOKEN","message":"Authentication token is missing."}`.
- Remaining checklist items are pending valid database credentials and Google test tokens for success/issuer/audience/expiry scenario execution.
