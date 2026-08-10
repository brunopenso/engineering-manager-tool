# Quickstart: GitHub Pull Request Natural Key

**Feature**: `019-github-pr-natural-key`  
**Date**: 2026-08-10

Validate natural-key persistence, always-refresh import, PR-keyed audit control, and retrieve/DAC. See [data-model.md](./data-model.md), [contracts/github-pr-natural-key-import.md](./contracts/github-pr-natural-key-import.md), and [contracts/github-pr-natural-key-api.yaml](./contracts/github-pr-natural-key-api.yaml).

## Prerequisites

- Node.js 26 / npm 11 (see `.nvmrc`)
- PostgreSQL running; backend `.env` configured
- Feature `018-github-pr-import` code present; tables may be empty
- Migrations applied after 019 migration lands: `npm run db:migration:run --workspace @em-tool/backend`

## Setup

```bash
npm install
npm run db:migration:run --workspace @em-tool/backend
```

Confirm schema (illustrative):

- Unique on `github_imported_pull_requests (repository_id, github_pull_request_id)`
- No `collaborator_id` on imported PRs
- Unique on `github_pr_collection_controls (repository_id, github_pull_request_id)`

## Automated tests

```bash
npm run test --workspace @em-tool/backend -- tests/019-github-pr-natural-key
```

Expected:

- Upsert by `(repositoryId, githubPullRequestId)` keeps a single PR row on re-import
- Persist refused when repository id or pull request id missing
- Collection control keyed by PR natural key; prior success does not skip refresh
- Nested comments/reviews stay on the single parent
- Retrieve filters by author login + dates; DAC allow/deny matrix still holds

## Manual import refresh check

With mocks or a safe org fixture:

```bash
npm run github:import-prs -- --start 2026-08-09 --end 2026-08-09
npm run github:import-prs -- --start 2026-08-09 --end 2026-08-09
```

Expected:

- Second run still refreshes matching PRs (not skipped due to prior control success)
- Still exactly one row per `(repository_id, github_pull_request_id)`
- Control row for each imported PR updated (`executed_at` / status), not period-scoped by collaborator

## Retrieve API

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

- `200` with PRs matching author login + merged date; each natural key once
- Nested `comments` / `reviews` present when stored
- `401` without token; peer/superior denied; admin may query any mapped collaborator

## DAC smoke matrix

| Caller        | Requested login           | Expected              |
| ------------- | ------------------------- | --------------------- |
| Self          | own `githubLogin`         | 200 + own PRs         |
| Leader        | direct/nested subordinate | 200 + subordinate PRs |
| Peer/superior | other collaborator login  | denied                |
| Admin         | any mapped login          | 200 when data exists  |
| None          | any                       | 401                   |
