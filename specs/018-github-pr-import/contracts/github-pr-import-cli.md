# CLI Contract: GitHub PR Import Command

**Feature**: `018-github-pr-import`  
**Date**: 2026-08-10

## Command

Root (preferred operator entry):

```bash
npm run github:import-prs -- [--start YYYY-MM-DD] [--end YYYY-MM-DD]
```

Backend workspace equivalent:

```bash
npm run github:import-prs --workspace @em-tool/backend -- [--start YYYY-MM-DD] [--end YYYY-MM-DD]
```

Implementation entry: `packages/backend/scripts/github-import-prs.ts` (via `tsx`).

## Arguments

| Flag | Required | Description |
|------|----------|-------------|
| `--start` | No | Inclusive UTC start date (`YYYY-MM-DD`). Defaults with `--end` to previous UTC calendar day when both omitted. |
| `--end` | No | Inclusive UTC end date (`YYYY-MM-DD`). Must be ≥ `--start` when provided. |

Rules:

- If neither flag is set → import **previous UTC calendar day** (start = end = yesterday UTC).
- If only one of `--start` / `--end` is set → validation error (both required together).
- If `end < start` → validation error.
- Dates must be valid ISO calendar dates.

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_APP_{org}_APP_ID` | Yes for live GitHub | GitHub App ID for the enabled organization `{org}` |
| `GITHUB_APP_{org}_PRIVATE_KEY` | Yes for live GitHub | GitHub App private key (PEM; `\n` escapes supported) |
| `GITHUB_APP_{org}_INSTALLATION_ID` | Yes for live GitHub | Installation ID of the app on that organization |
| Database env (existing backend `.env`) | Yes | Standard TypeORM / PostgreSQL connection settings |

Missing GitHub App credentials for an organization when a live fetch is attempted → collection control `failed` with error details (and non-zero CLI exit if any collections failed per quickstart).

## Behavior summary

1. Load enabled organizations from `github_integrations`.
2. Load users with non-empty `github_login`.
3. For each user × org × resolved date range:
   - If control row exists with `success` → skip (`skipped`).
   - Else query GitHub for merged PRs matching author + org + merged range; persist PRs, comments, reviews; write/update control row `success` or `failed`.
4. Print a human-readable summary: processed, skipped, failed counts; exit `0` when no failures, non-zero when any collection failed.

## Non-goals

- Does not enable/disable organizations.
- Does not set user `githubLogin`.
- Does not expose an HTTP trigger in this feature.
