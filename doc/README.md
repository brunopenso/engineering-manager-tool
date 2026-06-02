# Technical documentation

Setup and development guides for running the Engineering Manager Tool locally.

## Guides

- [Architecture](architecture.md) — monorepo layout, system diagram, and request flow
- [Getting started](getting-started.md) — prerequisites, environment files, install, migrations, seeds, and auth behavior
- [Development login](development-login.md) — local-only sign-in without Google OAuth

## Fast path

```bash
cp packages/backend/.env.example packages/backend/.env
cp packages/web/.env.example packages/web/.env
npm install
npm run db:migration:run --workspace @em-tool/backend
npm run dev
```

For Google-free local testing, enable dev login as described in [development-login.md](development-login.md).
