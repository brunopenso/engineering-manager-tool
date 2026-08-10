# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is a TypeScript monorepo (Lerna + npm workspaces) with two packages:

- **`@em-tool/backend`** — Fastify 5 REST API (port 3001)
- **`@em-tool/web`** — React 19 + Vite 8 SPA (port 3000, proxies `/api` to backend)

Human-oriented setup: see [`doc/getting-started.md`](doc/getting-started.md).

### Node.js version

Requires **Node.js 26** (see `.nvmrc`; `package.json` engines pin node 26 / npm 11). The Cloud VM's `/exec-daemon/node` shim is v22 and shadows nvm. To use the correct version, ensure `~/.bashrc` exports (already added during setup):

```
export PATH="/home/ubuntu/.nvm/versions/node/v26.5.1/bin:$PATH"
```

If Node 26 is not installed yet: `nvm install 26 && nvm alias default 26`.

### PostgreSQL

The backend requires a local PostgreSQL instance. After installing, start it with:

```
sudo pg_ctlcluster 16 main start
```

Database credentials used by `.env` files: user `emtool`, password `emtool123`, database `engineering_manager_tool`.

### Environment files

The `.env` files are gitignored. They must exist at:

- `packages/backend/.env` — DB credentials, `GOOGLE_CLIENT_ID`, `APP_AUTH_SECRET`, `APP_AUTH_TOKEN_TTL`
- `packages/web/.env` — `VITE_API_BASE_URL=/api`, `VITE_API_PROXY_TARGET`, `VITE_GOOGLE_CLIENT_ID`

For dev/test without real Google OAuth, placeholder values work for `GOOGLE_CLIENT_ID` since tests mock the token validator.

**Important — injected env secrets shadow `.env`:** the backend loads config with `dotenv.config()`, which does NOT override variables already present in the process environment. Several vars (e.g. `DEV_AUTH_SECRET`, `VITE_DEV_AUTH_SECRET`, `DEV_AUTH_ENABLED`, `GOOGLE_CLIENT_ID`, `BOOTSTRAP_ADMIN_EMAILS`) may be injected as Cloud Agent env secrets and will take precedence over whatever is written in the `.env` files. The backend log line `injected env (0) from .env` at startup indicates dotenv found the vars already set. This is fine because both the backend and Vite read the same injected values, so dev login stays consistent — but when calling the dev-auth API by hand, use `$DEV_AUTH_SECRET` from the environment rather than the literal in `.env`.

### Common commands

All commands run from the workspace root. See `package.json` for the full list.

| Action       | Command                                                 |
| ------------ | ------------------------------------------------------- |
| Install deps | `npm install`                                           |
| Dev servers  | `npm run dev`                                           |
| Lint         | `npm run lint`                                          |
| Test         | `npm run test`                                          |
| Migrations   | `npm run db:migration:run --workspace @em-tool/backend` |

### Known issues

- The backend starts in **degraded mode** if the database is unavailable (healthcheck still works, but data routes fail).
- **Web tests can flake under the full parallel run.** `npm run test` occasionally fails `tests/auth/logout-confirm.us3.test.tsx` ("expected ... to be null") due to `localStorage` bleed across parallel test files. Re-running that file alone (`npx vitest run tests/auth/logout-confirm.us3.test.tsx` from `packages/web`) passes. Backend tests are stable.

### Authentication

The app supports Google OAuth and a **development login bypass** (see [`doc/development-login.md`](doc/development-login.md)). With `DEV_AUTH_ENABLED=true` / `VITE_DEV_AUTH_ENABLED=true` (and matching `DEV_AUTH_SECRET` / `VITE_DEV_AUTH_SECRET`), you can sign in as any user without Google — the `/login` page shows a "Development login" section. This is how you complete an end-to-end browser login in the Cloud VM without real Google credentials. All automated tests mock the auth layer and run without real credentials.
