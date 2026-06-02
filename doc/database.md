# Database

Migrations and seeds are managed in `@em-tool/backend` under
`packages/backend/database/`. Configure `packages/backend/.env` and ensure
PostgreSQL is running before using these workflows.

First-time apply/run workflow: [getting-started.md](getting-started.md). To run,
roll back, or re-run seeds anytime, see
[lerna.md — Database migrations and seeds](lerna.md#database-migrations-and-seeds).

## Create a new migration

From the repository root:

```bash
npm run db:migration:create --workspace @em-tool/backend -- AddUsersTable
```

Use a short descriptive name; the script writes a timestamped file under
`packages/backend/database/migrations/`.

## Create a seed

Add a file with the `*.seed.ts` suffix under `packages/backend/database/seeds`:

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

Seed files run in filename order. The first seed, `000-clear-database.seed.ts`,
**truncates all application tables** on every `db:seed` run. Schema and migration
history are preserved, but all row data is deleted before subsequent seeds run.
Use seeds for local/dev resets only — do not run `db:seed` against production
databases with real data.

## Related docs

- [Getting started](getting-started.md) — first-time setup including migrations
- [Lerna](lerna.md) — run, roll back, and seed commands (canonical reference)
