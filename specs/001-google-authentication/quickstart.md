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
- Edit generated migration in database/migrations with User and LoginAudit tables.
- npm run db:migration:run --workspace @em-tool/backend

## 4. Implement backend auth flow
In packages/backend:
- Add entities for User and LoginAuditEvent.
- Add Google token validation service.
- Add auth route(s) for Google login and session introspection.
- Keep healthcheck endpoints public.
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
- Successful Google login redirects to welcome page.
- Backend creates/updates User and writes LoginAuditEvent.

## 7. Verify acceptance
- First login creates one User row with firstLoginAt and lastLoginAt.
- Second login for same email updates only lastLoginAt.
- Each successful login writes exactly one LoginAuditEvent row.
- Invalid/expired Google token denies access and does not write success audit.
