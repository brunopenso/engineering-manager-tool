# Quickstart: GitHub Pull Request Import

**Feature**: `018-github-pr-import`  
**Date**: 2026-08-10

Validate the import command, collection control, and retrieve API end-to-end. See [data-model.md](./data-model.md), [contracts/github-pr-import-cli.md](./contracts/github-pr-import-cli.md), and [contracts/github-pr-import-api.yaml](./contracts/github-pr-import-api.yaml).

## Prerequisites

- Node.js 26 / npm 11 (see `.nvmrc`)
- PostgreSQL running; backend `.env` configured
- Migrations applied: `npm run db:migration:run --workspace @em-tool/backend`
- At least one enabled GitHub org (`POST /github-integrations` as admin) — see feature `015-admin-github-orgs`
- At least one user with `githubLogin` set — see feature `014-profile-theme-github`
- `GITHUB_TOKEN` set in the environment for live import (tests mock GitHub)

## Setup

```bash
npm install
npm run db:migration:run --workspace @em-tool/backend
export GITHUB_TOKEN=ghp_or_fine_grained_token
```

## Automated tests

```bash
npm run test --workspace @em-tool/backend -- tests/018-github-pr-import
```

Expected: import, collection-control, query filter, and DAC allow/deny suites pass without live GitHub calls.

## Manual import (operator)

Previous UTC day:

```bash
npm run github:import-prs
```

Explicit range:

```bash
npm run github:import-prs -- --start 2026-08-09 --end 2026-08-09
```

Expected:

- Console summary of success / skipped / failed per collaborator+org
- Rows in `github_pr_collection_controls` with required fields
- Matching rows in `github_imported_pull_requests` (+ comments/reviews when present on GitHub)
- Second run for the same successful period reports skipped and does not duplicate PR rows

## Retrieve API

Start API (`npm run dev` or backend alone), then with a valid app bearer token:

```bash
curl -sS -X POST http://localhost:3001/github-pull-requests/query \
  -H "Authorization: Bearer $APP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "githubLogins": ["alice-dev"],
    "startDate": "2026-08-09",
    "endDate": "2026-08-09"
  }'
```

Expected:

- `200` with `{ "pullRequests": [ ... ] }` including nested `comments` and `reviews`
- Empty `pullRequests` when nothing matches
- `401` without token; `403` (or equivalent deny) for peer/superior logins; admin can query any mapped collaborator

## DAC smoke matrix

| Caller | Requested login | Expected |
|--------|-----------------|----------|
| Self | own `githubLogin` | 200 + own PRs |
| Leader | direct/nested subordinate | 200 + subordinate PRs |
| Any | peer or superior | denied |
| Administrator | any product collaborator login | 200 |
| None | any | 401 |

## Done when

- [ ] Migrations create the four new tables with uniqueness constraints
- [ ] `npm run github:import-prs` documented at root and backend
- [ ] Re-import of a successful period does not duplicate PRs
- [ ] Failed control rows are retryable
- [ ] `POST /github-pull-requests/query` matches the OpenAPI contract
- [ ] DAC matrix tests green under `tests/018-github-pr-import/`
