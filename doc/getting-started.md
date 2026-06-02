# Getting started

## Authentication overview

This project uses Google authentication with a web login flow and a backend token
validation endpoint. For local development, an optional **dev login** bypass lets
you sign in as any user in the database without a Google account. See
[development-login.md](development-login.md) for setup and usage.

## Prerequisites

- Node.js 24+ (see [`.nvmrc`](../.nvmrc) at the repo root)
- PostgreSQL instance
- Google OAuth Client ID (required for production; optional locally if dev login is enabled)

## Environment files

Create local environment files from examples:

- `packages/backend/.env.example`
- `packages/web/.env.example`

Required backend values:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
- `GOOGLE_CLIENT_ID`
- `APP_AUTH_SECRET`
- `APP_AUTH_TOKEN_TTL`

Required web values:

- `VITE_API_BASE_URL`
- `VITE_GOOGLE_CLIENT_ID`

## Install and run

From the repository root:

```bash
npm install
npm run dev
```

This starts the web app on port 3000 (proxies `/api` to the backend) and the API on port 3001.

## Migrations and seeds

After PostgreSQL is configured in `packages/backend/.env` and PostgreSQL is
running, use these commands from the repository root.

### Run migrations

Apply pending migrations:

```bash
npm run db:migration:run --workspace @em-tool/backend
```

### Run seeds

```bash
npm run db:seed --workspace @em-tool/backend
```

To create migration or seed files, see [database.md](database.md). For rollback
and running commands via Lerna scope, see [lerna.md](lerna.md).

## Expected auth behavior

- `/login` is the only public web page.
- `/app` and other non-login web routes require authentication.
- `/healthcheck` and `/healthcheck/complete` remain public for operational checks.
- Successful login redirects to the welcome screen in the app shell.

## Other commands

Test, lint, build, and database scripts are documented in [lerna.md](lerna.md).
Quick reference from the repository root:

| Action | Command |
|--------|---------|
| Lint (all packages) | `npm run lint` |
| Test (all packages) | `npm run test` |
| Build (all packages) | `npm run build` |
