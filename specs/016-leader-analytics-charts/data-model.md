# Data Model: Leader Analytics Charts

## Entities (existing, read-only)

### Deliverable

- **Used fields**: `id`, `user_id` (owner), `business_impact`, `created_at`
- **Filter rule**: `created_at` between UTC start/end of `startDate`/`endDate` inclusive (FR-009, FR-010, FR-012).

### DeliverableReview

- **Used fields**: `deliverable_id`, `reviewer_user_id`, `reviewed`
- **Pending rule**: Deliverable counts as **pending** for actor when no review row exists for `(actor, deliverable_id)` or `reviewed` is false per current 010 implementation.

### User

- **Used fields**: `id`, `full_name`, `email`, `leader_id`
- **Subtree**: Owners must be in `fetchLeaderDescendantRows(actorUserId)`; optional filter to single `userId` after subtree check.

## Computed aggregates (API, non-persistent)

### Week bucket

- **`weekStart`**: ISO date string (YYYY-MM-DD) for Monday UTC week containing `created_at`
- Generated server-side for every week overlapping `[startDate, endDate]` → `weekStarts[]` for chart axes

### Impact bucket row

- **`weekStart`**: string
- **`impact`**: `LOW` | `MEDIUM` | `HIGH` | `TRANSFORMATIONAL`
- **`count`**: non-negative integer

### Engagement bucket row

- **`weekStart`**: string
- **`userId`**: UUID (owner)
- **`displayName`**: string (`fullName.trim() || email`)
- **`count`**: non-negative integer (deliverables created that week by that user)

### TeamAnalyticsResponse

- **`startDate`**, **`endDate`**: echo query bounds
- **`userId`**: optional echo when filtered
- **`weekStarts`**: ordered array of week labels in range
- **`deliverablesByWeekAndImpact`**: `ImpactBucketRow[]`
- **`engagementByWeek`**: `EngagementBucketRow[]`
- **`pendingReviewCount`**: integer >= 0

## Authorization

### `GET /users/leader/team-analytics`

- **Allow**: authenticated user with leader role; optional `userId` in actor subtree
- **Deny**: non-leader (403); unauthenticated (401); `userId` outside subtree (403); invalid date range (400)

### UI route `/app/leader/team-analytics`

- **Allow**: `LeaderRoute` (leader role)
- **Deny**: non-leader — same pattern as Team Deliverables

## Widget layout state (client-only)

- **Storage**: `sessionStorage` key `em-tool:leader-analytics-layout:v1`
- **Shape**: `react-grid-layout` layout array `{ i, x, y, w, h }[]` for widgets: `impact`, `engagement`, `pending-review`
- **Not persisted** to PostgreSQL in v1

## DAC test matrix

| Case | Expected |
|------|----------|
| Leader loads analytics without `userId` | Aggregates over all descendants only |
| Leader loads with subtree `userId` | Scoped aggregates |
| Leader passes out-of-subtree `userId` | 403 |
| Non-leader analytics API | 403 |
| Unauthenticated | 401 |
| Invalid date range | 400 |
| Actor's own deliverables in subtree-wide engagement | Excluded (not in descendant owner set) |
| Peer/superior deliverables | Never in aggregates |

## State transitions

### Load / refresh analytics

1. Verify leader role.
2. Validate `startDate` / `endDate`.
3. Resolve owner ID set (descendants or single `userId`).
4. Query impact + engagement aggregations grouped by week (+ impact / user).
5. Query pending review count with review left join.
6. Build `weekStarts` for range.
7. Return `TeamAnalyticsResponse`.
