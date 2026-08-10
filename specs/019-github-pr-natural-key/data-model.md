# Data Model: GitHub Pull Request Natural Key

**Feature**: `019-github-pr-natural-key`  
**Date**: 2026-08-10  
**Supersedes identity rules in**: `specs/018-github-pr-import/data-model.md` (for imported PR + collection control uniqueness/ownership)

## Existing entities (consumed, not redefined)

### User (collaborator)

- **Key field**: `githubLogin` (`users.github_login`, nullable varchar 39)
- Import still discovers activity by iterating users with a GitHub login
- Retrieve maps requested GitHub logins → users for DAC; matches imported rows by `authorGithubLogin`

### GithubIntegration (enabled organization)

- Import still queries only currently enabled organizations

## Changed entities

### GithubImportedPullRequest

Persisted merged pull request. Identity is the natural key `(repositoryId, githubPullRequestId)`.

| Field                     | Type             | Notes                                              |
| ------------------------- | ---------------- | -------------------------------------------------- |
| `id`                      | UUID             | Internal primary key                               |
| `githubPullRequestId`     | string           | GitHub PR id; part of natural key                  |
| `organization`            | string           | Org login/slug                                     |
| `repository`              | string           | Repository name                                    |
| `repositoryId`            | string           | GitHub repository id; part of natural key          |
| `title`                   | string           |                                                    |
| `body`                    | text, nullable   |                                                    |
| `number`                  | integer          | PR number within repo (attribute, not natural key) |
| `changedFilesCount`       | integer          |                                                    |
| `additionsCount`          | integer          |                                                    |
| `deletionsCount`          | integer          |                                                    |
| `sourceBranch`            | string           |                                                    |
| `targetBranch`            | string           |                                                    |
| `authorGithubLogin`       | string           | Attribute for filter + DAC mapping                 |
| `mergedAt`                | timestamptz      |                                                    |
| `url`                     | string, nullable |                                                    |
| `createdAt` / `updatedAt` | timestamptz      | Audit                                              |

**Removed vs 018**:

- `collaboratorId` / FK to `users` — not part of identity; not stored

**Relationships**:

- One-to-many → `GithubPullRequestComment`
- One-to-many → `GithubPullRequestReview`
- No many-to-one ownership FK to User

**Validation / rules**:

- Persist only when `repositoryId` and `githubPullRequestId` are both non-blank
- Upsert on `(repositoryId, githubPullRequestId)`
- Author login, org, merged-date selection rules from import discovery remain as filters for _which_ PRs are fetched, not for uniqueness

### GithubPullRequestComment / GithubPullRequestReview

Unchanged field shapes from 018. Parent FK remains `pullRequestId` → imported PR internal UUID. Upsert on GitHub comment/review id. Re-import must attach to the single natural-keyed parent.

### GithubPrCollectionControl

Audit/history of the latest collection outcome for one PR natural key.

| Field                     | Type           | Notes                                  |
| ------------------------- | -------------- | -------------------------------------- |
| `id`                      | UUID           | Internal PK                            |
| `repositoryId`            | string         | Part of unique key                     |
| `githubPullRequestId`     | string         | Part of unique key                     |
| `status`                  | string         | `success` \| `failed` (primary values) |
| `executedAt`              | timestamptz    | Latest attempt                         |
| `errorDetails`            | text, nullable | Present when failed                    |
| `createdAt` / `updatedAt` | timestamptz    |                                        |

**Removed vs 018 (from uniqueness / required identity)**:

- `collaboratorId`, `githubLogin`, `organization`, `startDate`, `endDate` as unique key components (and as required columns — drop given empty tables)

**Uniqueness**: Unique on `(repositoryId, githubPullRequestId)`.

**Behavior**:

1. Import hit for (R, P) → upsert PR + nested → upsert control `success`
2. Persist/fetch failure for known (R, P) → upsert control `failed` with error details
3. Prior `success` MUST NOT skip a later refresh
4. Search-level failures without a PR key → no control row (run summary only)

```text
[none] --> success --> success (refresh + audit update)
[none] --> failed --> success (later refresh)
failed --> failed (still attempts refresh on later hit)
```

## Indexes / constraints (target)

- Unique: `github_imported_pull_requests (repository_id, github_pull_request_id)`
- Drop: `UQ_github_imported_pull_requests_github_pr_id` (single-column)
- Drop: FK/index usage of `collaborator_id` on imported PRs
- Query: `(author_github_login, merged_at)` retained for retrieve
- Unique: `github_pr_collection_controls (repository_id, github_pull_request_id)`
- Drop: `UQ_github_pr_collection_controls_period` and collaborator FK on controls

## Migration notes

- New migration under `packages/backend/database/migrations`
- Tables expected empty — no row merge/dedupe
- Prefer alter existing tables; dropping/recreating is acceptable if simpler because empty

## Out of scope

- Changing retrieve request body (`githubLogins` + dates)
- New web UI
- Historical data reconciliation
- Changing comment/review GitHub-id uniqueness
