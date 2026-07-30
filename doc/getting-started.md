# Getting started

First-time setup for running the stack locally. For a minimal command checklist,
see the [fast path](README.md#fast-path) in [doc/README.md](README.md).

## Prerequisites

- Node.js 24+ (see [`.nvmrc`](../.nvmrc) at the repo root)
- PostgreSQL instance (running and reachable from your machine)
- Google OAuth Client ID (required for production; optional locally if [dev login](development-login.md) is enabled)

## Environment files

`.env` files are gitignored. Create them at the paths below and adjust values
for your machine.

**`packages/backend/.env`**

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=engineering_manager_tool

GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
APP_AUTH_SECRET=replace-with-a-strong-secret
APP_AUTH_TOKEN_TTL=48h
BOOTSTRAP_ADMIN_EMAILS=admin@example.com

# Development-only login bypass (disabled when NODE_ENV=production)
DEV_AUTH_ENABLED=true
DEV_AUTH_SECRET=local-dev-only-change-me
```

**`packages/web/.env`**

```env
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Development-only login bypass (must match backend DEV_AUTH_SECRET)
VITE_DEV_AUTH_ENABLED=true
VITE_DEV_AUTH_SECRET=local-dev-only-change-me
```

PostgreSQL defaults (`DB_USER` / `DB_PASS` of `postgres` / `postgres`, database
`engineering_manager_tool`) match a typical local install — adjust as needed.

- `VITE_API_BASE_URL` — use `/api` in local dev so the Vite dev server (port 3000) proxies API requests to the backend
- `VITE_API_PROXY_TARGET` — backend origin the Vite `/api` proxy forwards to
- `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` — same Google OAuth client ID in both files
- For Google-free local sign-in, keep the `DEV_AUTH_*` / `VITE_DEV_AUTH_*` values in sync; see [development-login.md](development-login.md)

## PostgreSQL

Create the database named in `DB_NAME` if it does not exist yet, for example:

```bash
createdb engineering_manager_tool
```

Ensure the PostgreSQL service is running before the steps below.

## Install dependencies

From the repository root:

```bash
npm install
```

## Migrations and seeds

With PostgreSQL running and `packages/backend/.env` configured, apply pending
migrations (required before the first dev run):

```bash
npm run db:migration:run --workspace @em-tool/backend
```

Optional: load local sample data (truncates application tables first — see
[database.md](database.md)):

```bash
npm run db:seed --workspace @em-tool/backend
```

To create migration or seed files, see [database.md](database.md). For rollback,
Lerna scope, and other database commands, see
[lerna.md — Database migrations and seeds](lerna.md#database-migrations-and-seeds).

## Start dev servers

From the repository root:

```bash
npm run dev
```

This starts the web app on port 3000 (proxies `/api` to the backend) and the API
on port 3001.

## Authentication

This project uses Google authentication with a web login flow and a backend token
validation endpoint. For local development, an optional **dev login** bypass lets
you sign in as any user in the database without a Google account. The templates
above enable it by default — see [development-login.md](development-login.md)
for usage, role testing, and security notes.

## Expected auth behavior

- `/login` is the only public web page.
- `/app` and other non-login web routes require authentication.
- `/healthcheck` and `/healthcheck/complete` remain public for operational checks.
- Successful login redirects to the welcome screen in the app shell.

## Day-to-day commands

Test, lint, build, and per-package scripts are documented in [lerna.md](lerna.md).
