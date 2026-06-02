# Technical documentation

Setup and development guides for running the Engineering Manager Tool locally.

**New here?** Follow [Getting started](getting-started.md) end to end, then use
[Lerna](lerna.md) as the command reference for day-to-day work.

## Guides

Same order as the [root README](../README.md#documentation):

- [Getting started](getting-started.md) — prerequisites, environment files, install, migrations/seeds, and dev servers
- [Database](database.md) — creating migrations and seed files
- [Architecture](architecture.md) — monorepo layout, system diagram, and request flow
- [Lerna](lerna.md) — run test, lint, migrations, and seeds per package or across the monorepo
- [Development login](development-login.md) — local-only sign-in without Google OAuth

## Fast path

After [prerequisites](getting-started.md#prerequisites) and PostgreSQL are in place:

```bash
# Create packages/backend/.env and packages/web/.env — see getting-started.md
npm install
npm run db:migration:run --workspace @em-tool/backend
npm run dev
```

Optional sample data: `npm run db:seed --workspace @em-tool/backend` (see
[database.md](database.md)). For Google-free sign-in, see
[development-login.md](development-login.md).
