# Data Model: PR Developer Performance

## Entities (existing, read-only)

### User

- **Used fields**: `id`, `full_name`, `email`, `github_login`, `leader_id`
- **Subtree**: Developers must be in `fetchLeaderDescendantRows(actorUserId)` (excludes actor). Optional filter to single `userId` after `assertUserInLeaderSubtree`.
- **Identity join**: `LOWER(TRIM(github_login))` matched to PR/comment/review login fields. Null/empty `github_login` → all metrics zero.

### GithubImportedPullRequest

- **Table**: `github_imported_pull_requests`
- **Used fields**: `id`, `author_github_login`, `merged_at`, `repository_full_name` (or equivalent), `title`, `classification_type`, `user_reclassification`, plus detail fields needed for drill-down
- **Filter rule**: `merged_at` between UTC start/end of `startDate`/`endDate` inclusive
- **Authored rule**: author’s login matches developer’s `github_login`

### GithubPullRequestComment

- **Table**: `github_pull_request_comments`
- **Used fields**: parent PR id, `author_github_login`
- **Count rule**: comments by developer login on PRs whose `merged_at` is in range

### GithubPullRequestReview

- **Table**: `github_pull_request_reviews`
- **Used fields**: parent PR id, `reviewer_github_login`
- **Count rule**: reviews by developer login on PRs whose `merged_at` is in range

## Computed values (API, non-persistent)

### Effective classification

- **Rule**: `user_reclassification` if present, else `classification_type`, else `unclassified`
- **Typed values**: `feature` | `fix` | `documentation` | `maintenance`
- **Unclassified**: explicit bucket key `unclassified` (never invent a typed class)

### Week bucket

- **`weekStart`**: ISO date (YYYY-MM-DD) Monday UTC week containing `merged_at`
- **`weekStarts[]`**: every week overlapping `[startDate, endDate]` for axis zero-fill

### Totals

- **`authoredPullRequestCount`**, **`commentCount`**, **`reviewCount`**: sums over current developer scope

### DeveloperPrPerformanceRow

- **`userId`**: UUID
- **`displayName`**: `fullName.trim() || email`
- **`email`**: string (fallback / identity)
- **`githubLogin`**: string | null
- **`authoredPullRequestCount`**, **`commentCount`**, **`reviewCount`**: integers ≥ 0

### WeeklyClassificationBucketRow

- **`weekStart`**: string
- **`classification`**: `feature` | `fix` | `documentation` | `maintenance` | `unclassified`
- **`count`**: integer ≥ 0 (authored PRs only)

### TeamPrPerformanceResponse

- **`startDate`**, **`endDate`**: echo query bounds
- **`userId`**: optional echo when filtered
- **`totals`**: Totals object
- **`developers`**: `DeveloperPrPerformanceRow[]` (default order: authored desc, displayName asc)
- **`weekStarts`**: string[]
- **`authoredByWeekAndClassification`**: `WeeklyClassificationBucketRow[]` (sparse OK if client zero-fills from `weekStarts` + known keys; prefer server completeness)

### DeveloperPrDrilldownItem

- **`id`**, **`title`**, **`repository`**, **`mergedAt`**, **`involvementRole`** (`owner` | `involved`)
- **`effectiveClassification`**: typed or `unclassified`
- **`url`** (optional), nested actor comment/review summaries as needed for modal

### DeveloperPrDrilldownResponse

- **`userId`**, **`startDate`**, **`endDate`**, **`pullRequests`**: `DeveloperPrDrilldownItem[]` (newest `mergedAt` first)

## Authorization

### `GET /users/leader/team-pr-performance`

- **Allow**: authenticated leader; optional `userId` in descendant subtree
- **Deny**: non-leader (403); unauthenticated (401); `userId` outside subtree (403); invalid date range (400)

### `GET /users/leader/team-pr-performance/developers/{userId}/pull-requests`

- **Allow**: authenticated leader and `{userId}` in descendant subtree
- **Deny**: same as above for auth/role/subtree/dates

### UI route `/app/leader/team-pr-performance`

- **Allow**: `LeaderRoute` (leader role)
- **Deny**: non-leader — same pattern as Team Analytics / Team Deliverables

## DAC test matrix

| Case                                           | Expected                             |
| ---------------------------------------------- | ------------------------------------ |
| Leader loads without `userId`                  | Aggregates over all descendants only |
| Leader loads with subtree `userId`             | Scoped aggregates + chart            |
| Leader passes out-of-subtree `userId`          | 403                                  |
| Non-leader API                                 | 403                                  |
| Unauthenticated                                | 401                                  |
| Invalid date range                             | 400                                  |
| Actor’s own PR activity in subtree-wide totals | Excluded                             |
| Peer/superior PR activity                      | Never in aggregates or drill-down    |
| Week segment sum vs authored count             | Equal including Unclassified         |

## State transitions

None. Read-only analytics over imported data; reclassification of PRs remains owned by existing My Pull Requests flows and is reflected on next fetch via effective classification.
