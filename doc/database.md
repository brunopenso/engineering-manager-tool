# Database

Migrations and seeds are managed in `@em-tool/backend` under
`packages/backend/database/`. Configure `packages/backend/.env` and ensure
PostgreSQL is running before using these workflows.

To run or roll back migrations and execute seeds, see [getting-started.md](getting-started.md)
and [lerna.md](lerna.md).

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

- [Getting started](getting-started.md) — apply migrations and run seeds
- [Lerna](lerna.md) — database commands with workspace or Lerna scope
