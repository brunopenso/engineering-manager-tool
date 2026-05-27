# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is a TypeScript monorepo (Lerna + npm workspaces) with two packages:

- **`@em-tool/backend`** — Fastify 5 REST API (port 3001)
- **`@em-tool/web`** — React 19 + Vite 8 SPA (port 3000, proxies `/api` to backend)

### Node.js version

Requires **Node.js 24** (see `.nvmrc`). The Cloud VM's `/exec-daemon/node` shim is v22 and shadows nvm. To use the correct version, ensure `~/.bashrc` exports:

```
export PATH="/home/ubuntu/.nvm/versions/node/v24.16.0/bin:$PATH"
```

If Node 24 is not installed yet: `nvm install 24 && nvm alias default 24`.

### PostgreSQL

The backend requires a local PostgreSQL instance. After installing, start it with:

```
sudo pg_ctlcluster 16 main start
```

Database credentials used by `.env` files: user `emtool`, password `emtool123`, database `engineering_manager_tool`.

### Environment files

The `.env` files are gitignored. They must exist at:

- `packages/backend/.env` — DB credentials, `GOOGLE_CLIENT_ID`, `APP_AUTH_SECRET`, `APP_AUTH_TOKEN_TTL`
- `packages/web/.env` — `VITE_API_BASE_URL=/api`, `VITE_GOOGLE_CLIENT_ID`

For dev/test without real Google OAuth, placeholder values work for `GOOGLE_CLIENT_ID` since tests mock the token validator.

### Common commands

All commands run from the workspace root. See `package.json` for the full list.

| Action | Command |
|---|---|
| Install deps | `npm install` |
| Dev servers | `npm run dev` |
| Lint | `npm run lint` |
| Test | `npm run test` |
| Migrations | `npm run db:migration:run --workspace @em-tool/backend` |

### Known issues

- **Backend lint** (`tsc --noEmit`) fails on `src/__tests__/auth-refresh.test.ts` due to a pre-existing type mismatch with vitest mock types. This does not affect runtime or test execution.
- The backend starts in **degraded mode** if the database is unavailable (healthcheck still works, but data routes fail).

### Authentication

The app uses Google OAuth exclusively. Without a valid `GOOGLE_CLIENT_ID`, you cannot complete the login flow in a browser. However, all automated tests mock the auth layer and run without real credentials.
