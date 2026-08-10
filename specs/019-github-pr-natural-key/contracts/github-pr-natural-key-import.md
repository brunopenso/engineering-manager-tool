# Contract: GitHub PR Natural Key — Import Behavior

**Feature**: `019-github-pr-natural-key`  
**Date**: 2026-08-10  
**Related CLI**: `specs/018-github-pr-import/contracts/github-pr-import-cli.md` (command flags unchanged)

## Command surface (unchanged)

- Root/workspace script: `npm run github:import-prs`
- Optional `--start YYYY-MM-DD` / `--end YYYY-MM-DD` (inclusive UTC); default previous UTC day

Date range remains a **search** filter for finding merged PRs on GitHub. It is **not** the uniqueness key for collection-control rows.

## Persistence identity

| Entity            | Unique key                                         |
| ----------------- | -------------------------------------------------- |
| Imported PR       | `(repositoryId, githubPullRequestId)`              |
| Collection control| `(repositoryId, githubPullRequestId)` (audit row)  |

- Collaborator/user is **not** part of either unique key.
- Missing/blank `repositoryId` or `githubPullRequestId` → do not persist that PR; record a clear item failure reason.

## Refresh / control semantics

1. On every import hit for a PR natural key, **always refresh** PR fields and nested comments/reviews via upsert (no skip because prior control was `success`).
2. Upsert collection-control for that natural key with latest `status`, `executedAt`, and `errorDetails` when failed.
3. Search/orchestration failures **without** a known PR natural key appear in the run summary only (no control row).

## Run summary expectations

- Counts should reflect processed discovery work and per-PR import outcomes.
- Do **not** increment a “skipped because already successfully collected period” path driven by collection-control success.
- Re-running the same date range may re-fetch and refresh the same PRs; PR row count for each natural key remains 1.

## Out of scope for this contract

- Changing CLI flag names or default previous-day behavior
- Changing GitHub App credential env var scheme from 018
