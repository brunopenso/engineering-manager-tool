# Research: GitHub Pull Request Natural Key

**Feature**: `019-github-pr-natural-key`  
**Date**: 2026-08-10

## 1. Imported PR uniqueness

**Decision**: Enforce uniqueness on composite `(repository_id, github_pull_request_id)`. Drop the standalone unique constraint on `github_pull_request_id` alone.

**Rationale**: Spec defines the natural key as repository id + GitHub pull request id. Composite uniqueness matches that requirement and remains correct even if PR ids were ever ambiguous across repos in source payloads. Upsert lookup uses both fields.

**Alternatives considered**:

- Keep unique on `github_pull_request_id` only — rejected; does not match clarified natural key.
- Unique on `(repository_id, number)` — rejected; clarifications define pull request id as the GitHub PR id, not the per-repo number.

## 2. Collaborator ownership on imported PRs

**Decision**: Remove `collaborator_id` (FK to `users`) from `github_imported_pull_requests`. Keep `author_github_login` as the attribute used for retrieve filtering and DAC mapping. Import may still iterate collaborators with a GitHub login for discovery.

**Rationale**: Spec FR-004 — collaborator must not be part of PR identity. Tables are empty, so dropping the column is simpler and safer than leaving a misleading ownership FK. DAC remains via author login → user mapping at query time.

**Alternatives considered**:

- Keep nullable `collaborator_id` as “last importer” audit — rejected; adds ambiguity without required product value.
- Store `collaborator_id` but exclude from uniqueness — rejected; still implies user ownership contrary to the feature goal.

## 3. Collection-control key and behavior

**Decision**: Re-key `github_pr_collection_controls` to unique `(repository_id, github_pull_request_id)`. Store latest `status`, `executed_at`, and `error_details` for audit. Remove collaborator/org/date-range uniqueness and the import-time skip on successful control. Every import hit refreshes PR data and updates the control row.

**Rationale**: Clarifications require PR-based uniqueness and always-refresh / audit-only control. Period-based skip is incompatible with Option C.

**Alternatives considered**:

- Keep period control and also add PR uniqueness — rejected; duplicate control models and conflicts with clarifications.
- Append-only control history (many rows per PR) — rejected; uniqueness-on-PR implies one current audit row per natural key, updated in place.
- Skip on successful control — rejected by clarification (Option C).

## 4. Search-level failures without a PR key

**Decision**: Collection-control rows exist only when a pull request natural key is known. Failures during org/author search (before a concrete PR is identified) are reported in the import run summary only and do not create control rows. Failures while fetching/persisting a known PR update that PR’s control row to `failed`.

**Rationale**: Control uniqueness is PR-scoped; there is no natural key before a PR is identified.

**Alternatives considered**:

- Retain collaborator+org period control for search failures — rejected; reintroduces user-period identity the feature removes.
- Synthetic control keys for search failures — rejected; invents non-PR identities.

## 5. Retrieve filtering after removing `collaborator_id`

**Decision**: Query imported PRs by `author_github_login` matching the authorized requested logins (case-insensitive normalize), plus merged-date range. Continue DAC checks against the product users mapped from those logins before returning data.

**Rationale**: Spec keeps author login as filter/DAC attribute. Response contract already does not expose `collaboratorId`.

**Alternatives considered**:

- Join users on `github_login` and filter by user id — unnecessary once author login is authoritative for matching; DAC still uses user ids for hierarchy checks.

## 6. Migration strategy (empty tables)

**Decision**: Add a new TypeORM migration that alters the existing 018 tables (drop old uniques/FKs/columns; add new columns/uniques). Do not rewrite the historical 018 migration. No data backfill or duplicate merge.

**Rationale**: Clarification — tables empty; schema-only. Preserving the original migration keeps deploy history reproducible for DBs that already applied 018.

**Alternatives considered**:

- Edit 018 migration in place — rejected for environments that already ran it; empty local DBs could reset, but shared history should stay append-only.
- Drop and recreate tables in 019 — acceptable alternative if alter path is awkward; prefer alter for clarity of intent. Either is fine given empty tables.

## 7. GitHub search hit repository id

**Decision**: Ensure search hits and `getPullRequest` both populate distinct `repositoryId` (GitHub repository id) and `githubPullRequestId` (GitHub PR id). Fix any path that incorrectly assigns the issue/PR search item id to `repositoryId`. Reject persist when either value is missing/blank after detail fetch.

**Rationale**: Natural key integrity depends on correct source fields. Current search mapping used `item.id` for both fields in one code path; detail fetch already uses `data.base.repo.id` and `data.id`.

**Alternatives considered**:

- Rely only on detail fetch for ids and ignore search hit ids — acceptable; still require validation before persist.

## 8. Status value `skipped`

**Decision**: Stop producing `skipped` outcomes for “already successfully collected period.” Keep the column as a free-form/status string; `success` and `failed` remain primary. Import summary may drop or zero out skip counts driven by prior control success.

**Rationale**: Always-refresh removes the skip path. Leaving unused enum member is harmless; removing it is optional cleanup.
