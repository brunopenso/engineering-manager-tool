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

## Migrations

```bash
npm run db:migration:run --workspace @em-tool/backend
```

## Seeds

Seed files live in `packages/backend/database/seeds` and are executed in
filename order. The first seed, `000-clear-database.seed.ts`, truncates all
application tables on every run. Schema and migration history are preserved, but
all row data is deleted before subsequent seeds run. Use this for local/dev
reset only; do not run `db:seed` against production databases with real data.

Create a seed with the `*.seed.ts` suffix:

```ts
import { defineSeed } from '../../src/database/seeds.js';

export default defineSeed({
  name: 'example-seed',
  async run(dataSource) {
    await dataSource.transaction(async (manager) => {
      // Insert or update seed data here. Keep seeds idempotent.
      // Example pattern: await manager.upsert(Entity, records, conflictPaths);
    });
  },
});
```

Run all seeds:

```bash
npm run db:seed --workspace @em-tool/backend
```

## Expected auth behavior

- `/login` is the only public web page.
- `/app` and other non-login web routes require authentication.
- `/healthcheck` and `/healthcheck/complete` remain public for operational checks.
- Successful login redirects to the welcome screen in the app shell.

## Other commands

From the repository root ([`package.json`](../package.json)):

| Action | Command |
|--------|---------|
| Lint | `npm run lint` |
| Test | `npm run test` |
| Build | `npm run build` |
