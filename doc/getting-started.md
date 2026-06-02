# Getting started

First-time setup for running the stack locally. For a minimal command checklist,
see the [fast path](README.md#fast-path) in [doc/README.md](README.md).

## Prerequisites

- Node.js 24+ (see [`.nvmrc`](../.nvmrc) at the repo root)
- PostgreSQL instance (running and reachable from your machine)
- Google OAuth Client ID (required for production; optional locally if [dev login](development-login.md) is enabled)

## Environment files

From the repository root, copy the example files:

```bash
cp packages/backend/.env.example packages/backend/.env
cp packages/web/.env.example packages/web/.env
```

Edit `packages/backend/.env` for your PostgreSQL connection and secrets. The
example defaults (`DB_USER` / `DB_PASS` of `postgres` / `postgres`, database
`engineering_manager_tool`) match a typical local install — adjust as needed.

Required backend values:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
- `GOOGLE_CLIENT_ID`
- `APP_AUTH_SECRET`
- `APP_AUTH_TOKEN_TTL`

Required web values:

- `VITE_API_BASE_URL` — use `/api` in local dev so the Vite dev server (port 3000) proxies API requests to the backend
- `VITE_GOOGLE_CLIENT_ID`

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
you sign in as any user in the database without a Google account. The example
env files enable it by default — see [development-login.md](development-login.md)
for usage, role testing, and security notes.

## Expected auth behavior

- `/login` is the only public web page.
- `/app` and other non-login web routes require authentication.
- `/healthcheck` and `/healthcheck/complete` remain public for operational checks.
- Successful login redirects to the welcome screen in the app shell.

## Day-to-day commands

Test, lint, build, and per-package scripts are documented in [lerna.md](lerna.md).
