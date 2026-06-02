# Working with Lerna

This repository is an [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces)
monorepo orchestrated by [Lerna](https://lerna.js.org/). Packages live under
`packages/`:

| Package | Name |
|---------|------|
| Backend API | `@em-tool/backend` |
| Web SPA | `@em-tool/web` |

Run all commands below from the **repository root** unless noted otherwise.

## Two ways to target a package

You can run a script in one package using either **npm workspaces** or **Lerna scope**:

```bash
# npm workspaces (recommended — matches CI and package.json scripts)
npm run <script> --workspace @em-tool/backend
npm run <script> --workspace @em-tool/web

# Lerna scope (equivalent for scripts defined in a package)
npx lerna run <script> --scope=@em-tool/backend
npx lerna run <script> --scope=@em-tool/web
```

To run a script in **every** package that defines it, use the root shortcut (Lerna
runs across all workspaces):

```bash
npm run <script>
```

---

## Tests

### All packages

```bash
npm run test
```

Runs `vitest run` in both `@em-tool/backend` and `@em-tool/web` (via
`lerna run test --stream`).

### One package

```bash
npm run test --workspace @em-tool/backend
npm run test --workspace @em-tool/web
```

Or with Lerna:

```bash
npx lerna run test --scope=@em-tool/backend
npx lerna run test --scope=@em-tool/web
```

### Watch mode (single package)

Watch mode is only defined per package, not at the root:

```bash
npm run test:watch --workspace @em-tool/backend
npm run test:watch --workspace @em-tool/web
```

---

## Lint

Lint in both packages is TypeScript type-checking (`tsc --noEmit`).

### All packages

```bash
npm run lint
```

Runs lint in parallel across all packages (`lerna run lint --parallel`).

Auto-fix (where supported by the underlying tool):

```bash
npm run lint:fix
```

### One package

```bash
npm run lint --workspace @em-tool/backend
npm run lint --workspace @em-tool/web
```

Or with Lerna:

```bash
npx lerna run lint --scope=@em-tool/backend
npx lerna run lint --scope=@em-tool/web
```

---

## Database migrations and seeds

Migration and seed scripts exist **only** on `@em-tool/backend`. Ensure
`packages/backend/.env` is configured and PostgreSQL is running before running
these commands.

### Run migrations

Apply pending migrations:

```bash
npm run db:migration:run --workspace @em-tool/backend
```

### Roll back last migration

```bash
npm run db:migration:rollback --workspace @em-tool/backend
```

### Run seeds

```bash
npm run db:seed --workspace @em-tool/backend
```

To create migrations or seed files, see [database.md](database.md).

### Lerna equivalents

```bash
npx lerna run db:migration:run --scope=@em-tool/backend
npx lerna run db:migration:rollback --scope=@em-tool/backend
npx lerna run db:seed --scope=@em-tool/backend
```

---

## Other root scripts

| Script | What it does |
|--------|----------------|
| `npm run dev` | Start web and backend dev servers in parallel |
| `npm run build` | Build all packages |
| `npm run clean` | Clean build artifacts in all packages and remove root `node_modules` |
| `npm run lerna:repair` | Repair Lerna metadata if the monorepo gets out of sync |

Per-package build:

```bash
npm run build --workspace @em-tool/backend
npm run build --workspace @em-tool/web
```

---

## Related docs

- [Getting started](getting-started.md) — first-time setup and environment files
- [Database](database.md) — creating migrations and seeds
- [Architecture](architecture.md) — how the packages fit together
