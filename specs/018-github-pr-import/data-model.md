# Data Model: GitHub Pull Request Import

**Feature**: `018-github-pr-import`  
**Date**: 2026-08-10

## Existing entities (consumed, not redefined)

### User (collaborator)

- **Key field**: `githubLogin` (`users.github_login`, nullable varchar 39)
- Import processes only users where `githubLogin` is non-null / non-empty
- Retrieve maps requested GitHub logins to users via case-insensitive match on `githubLogin`

### GithubIntegration (enabled organization)

- **Table**: `github_integrations`
- **Key field**: `organizationName` (normalized lowercase slug)
- Import iterates only currently enabled (present) organizations

## New entities

### GithubImportedPullRequest

Persisted merged pull request collected from GitHub.

| Field                     | Type                 | Notes                              |
| ------------------------- | -------------------- | ---------------------------------- |
| `id`                      | UUID                 | Internal primary key               |
| `githubPullRequestId`     | bigint / string      | GitHub node/REST id; **unique**    |
| `organization`            | string               | Org login/slug (enabled org)       |
| `repository`              | string               | Repository name                    |
| `repositoryId`            | bigint / string      | GitHub repository id               |
| `title`                   | string               |                                    |
| `body`                    | text, nullable       | Description                        |
| `number`                  | integer              | PR number within repo              |
| `changedFilesCount`       | integer              | Files changed                      |
| `additionsCount`          | integer              |                                    |
| `deletionsCount`          | integer              |                                    |
| `sourceBranch`            | string               | Head ref                           |
| `targetBranch`            | string               | Base ref                           |
| `authorGithubLogin`       | string               | Author login as from GitHub        |
| `mergedAt`                | timestamptz          | Merged date/time                   |
| `url`                     | string, nullable     | HTML URL when available            |
| `collaboratorId`          | UUID FK → `users.id` | Owning collaborator at import time |
| `createdAt` / `updatedAt` | timestamptz          | Audit                              |

**Relationships**:

- Many-to-one → User (`collaboratorId`)
- One-to-many → `GithubPullRequestComment`
- One-to-many → `GithubPullRequestReview`

**Validation / rules**:

- Only persisted when author matches collaborator GitHub login, org is enabled, and `mergedAt` is within selected inclusive UTC range
- Upsert on `githubPullRequestId` on retry after failed collection

### GithubPullRequestComment

Conversation (issue) comment on an imported pull request.

| Field                     | Type             | Notes                         |
| ------------------------- | ---------------- | ----------------------------- |
| `id`                      | UUID             | Internal PK                   |
| `githubCommentId`         | bigint / string  | **unique**                    |
| `pullRequestId`           | UUID FK          | → `GithubImportedPullRequest` |
| `authorGithubLogin`       | string           |                               |
| `body`                    | text             | Full text                     |
| `createdAtGithub`         | timestamptz      | GitHub created                |
| `updatedAtGithub`         | timestamptz      | GitHub updated                |
| `url`                     | string, nullable |                               |
| `createdAt` / `updatedAt` | timestamptz      | Local audit                   |

**Validation**: Requires parent imported PR; upsert on `githubCommentId`.

### GithubPullRequestReview

Review on an imported pull request.

| Field                     | Type                  | Notes                                                           |
| ------------------------- | --------------------- | --------------------------------------------------------------- |
| `id`                      | UUID                  | Internal PK                                                     |
| `githubReviewId`          | bigint / string       | **unique**                                                      |
| `pullRequestId`           | UUID FK               | → `GithubImportedPullRequest`                                   |
| `reviewerGithubLogin`     | string                |                                                                 |
| `body`                    | text, nullable        | Full text (GitHub may send empty)                               |
| `state`                   | string                | e.g. APPROVED, CHANGES_REQUESTED, COMMENTED, DISMISSED, PENDING |
| `createdAtGithub`         | timestamptz           |                                                                 |
| `updatedAtGithub`         | timestamptz, nullable | When available                                                  |
| `url`                     | string, nullable      |                                                                 |
| `createdAt` / `updatedAt` | timestamptz           | Local audit                                                     |

**Validation**: Requires parent imported PR; upsert on `githubReviewId`.

### GithubPrCollectionControl

Tracks import attempts per collaborator, organization, and date range.

| Field                     | Type                 | Notes                              |
| ------------------------- | -------------------- | ---------------------------------- |
| `id`                      | UUID                 | Internal PK                        |
| `collaboratorId`          | UUID FK → `users.id` |                                    |
| `githubLogin`             | string               | Login used for the attempt         |
| `organization`            | string               | Org slug                           |
| `startDate`               | date                 | Inclusive UTC start (calendar day) |
| `endDate`                 | date                 | Inclusive UTC end                  |
| `status`                  | enum/string          | `success` \| `failed` \| `skipped` |
| `executedAt`              | timestamptz          | Execution timestamp                |
| `errorDetails`            | text, nullable       | Present when failed                |
| `createdAt` / `updatedAt` | timestamptz          |                                    |

**Uniqueness**: Unique on `(collaboratorId, organization, startDate, endDate)`.

**State transitions**:

1. First attempt → insert `success` or `failed`
2. Re-run when existing `success` → mark/return `skipped` (no PR duplicates)
3. Re-run when existing `failed` → retry import; on success update to `success` and clear `errorDetails`; on failure update `errorDetails` / `executedAt`

```text
[none] --> failed --> success
[none] --> success --> skipped (on re-run)
failed --> failed (retry still failing)
```

## Indexes (recommended)

- Unique: `github_imported_pull_requests.github_pull_request_id`
- Unique: `github_pull_request_comments.github_comment_id`
- Unique: `github_pull_request_reviews.github_review_id`
- Unique: `github_pr_collection_controls (collaborator_id, organization, start_date, end_date)`
- Query: `(author_github_login, merged_at)` for retrieve API
- Query: `(collaborator_id)` for ownership / cleanup

## Table naming (suggested)

| Entity                    | Table                           |
| ------------------------- | ------------------------------- |
| GithubImportedPullRequest | `github_imported_pull_requests` |
| GithubPullRequestComment  | `github_pull_request_comments`  |
| GithubPullRequestReview   | `github_pull_request_reviews`   |
| GithubPrCollectionControl | `github_pr_collection_controls` |

## Out of scope for this model

- Inline review comments (diff comments)
- Storing GitHub tokens or org credentials in these tables
- Web UI models / client caches
