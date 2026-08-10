# Data Model: Leader Team Deliverables

## Entity: DeliverableReview (new)

- **Purpose**: Persist per-leader reviewed state for a deliverable (FR-012, FR-013, FR-014).
- **Table name**: `deliverable_reviews`
- **Fields**:
  - `id`: UUID, primary key
  - `deliverableId`: UUID, required, FK → `deliverables.id`, ON DELETE CASCADE
  - `reviewerUserId`: UUID, required, FK → `users.id`, ON DELETE CASCADE
  - `reviewed`: boolean, required, default `true` (row presence with `reviewed = true` means reviewed; upsert sets true, clearing sets false via delete or update)
  - `updatedAt`: timestamptz, required
- **Constraints**:
  - UNIQUE (`deliverable_id`, `reviewer_user_id`)
- **Indexes**:
  - `(reviewer_user_id, deliverable_id)` for join on search
- **Relationships**:
  - Many-to-one → `Deliverable`
  - Many-to-one → `User` (reviewer)

## Entity: Deliverable (existing)

- **Used fields for this feature**: `id`, `user_id` (owner), `title`, `description`, `updated_at`
- **Filter rule**: Include row when `updated_at` is within `[startDate, endDate]` inclusive calendar-day bounds (FR-006).

## Entity: User (existing)

- **Used fields**: `id`, `full_name`, `email`, `leader_id`
- **Subtree rule**: Team member selectable when user is reachable via recursive `leader_id` chain from actor (actor excluded from picker).

## Value Objects (API)

### TeamMemberOption

- `id`: UUID
- `displayName`: string (`fullName.trim() || email`)

### TeamDeliverableRow

- `id`: UUID
- `title`: string
- `description`: string
- `reviewed`: boolean (for current reviewer; default `false`)

### TeamDeliverablesSearchResponse

- `ownerUserId`: UUID
- `deliverables`: `TeamDeliverableRow[]`

### TeamMembersResponse

- `members`: `TeamMemberOption[]`

### SetDeliverableReviewedRequest

- `reviewed`: boolean

### SetDeliverableReviewedResponse

- `deliverableId`: UUID
- `reviewed`: boolean

## Authorization (non-persistent)

### Team members list (`GET /users/leader/team-members`)

- **Allow**: authenticated user with leader role
- **Deny**: non-leader, unauthenticated

### Team deliverables search (`GET /users/leader/team-deliverables`)

- **Allow**: leader role AND `userId` is in actor's descendant subtree (not self required excluded from picker but direct API with self could still use read rules — spec excludes self from picker only)
- **Deny**: non-leader; `userId` not in subtree; invalid date range (`startDate > endDate`)

### Set reviewed (`PUT /deliverables/{deliverableId}/reviewed`)

- **Allow**: leader role AND `assertCanReadDeliverables(actor, deliverable.ownerUserId)` (superior read path)
- **Deny**: non-leader; cannot read target deliverable; deliverable not found → 404

### Deliverable content on this screen

- **Read-only**: no mutation of title/description or other deliverable fields (FR-015)

## State Transitions

### Search deliverables

1. Verify leader role.
2. Validate date range (`startDate <= endDate`).
3. Verify `userId` in actor subtree via CTE.
4. Query deliverables for owner `userId` filtered by `updated_at`.
5. Left-join reviews for `(reviewer = actor, deliverable_id)`.
6. Return rows with `reviewed` boolean.

### Toggle reviewed

1. Load deliverable by id; 404 if missing.
2. Verify leader role and read access to owner.
3. If `reviewed === true`: upsert `deliverable_reviews` row.
4. If `reviewed === false`: delete row or set `reviewed = false` (implementation choice: delete row keeps table sparse).
5. Return `{ deliverableId, reviewed }`.

## DAC Test Matrix

| Case                                              | Expected                         |
| ------------------------------------------------- | -------------------------------- |
| Leader lists team members                         | Allow; only descendants returned |
| Leader searches subtree member deliverables       | Allow                            |
| Leader searches user outside subtree              | Deny 403                         |
| Non-leader team-members                           | Deny 403                         |
| Non-leader search                                 | Deny 403                         |
| Leader toggles reviewed on authorized deliverable | Allow; persists                  |
| Leader toggles on out-of-subtree deliverable      | Deny 403                         |
| Collaborator toggles reviewed                     | Deny 403                         |
| Second leader same deliverable                    | Independent reviewed state       |
| Date filter excludes old deliverable              | Not in results                   |
| Boundary day deliverable                          | Included                         |
