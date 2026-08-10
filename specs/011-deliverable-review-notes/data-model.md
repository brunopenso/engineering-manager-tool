# Data Model: Deliverable Review Notes

## Entity: DeliverableReview (extended)

- **Purpose**: Persist per-leader reviewed state and private review notes for a deliverable (FR-003, FR-010–FR-012).
- **Table name**: `deliverable_reviews` (existing from feature 010)
- **New field**:
  - `notes`: text, nullable — private coaching notes authored by `reviewer_user_id`; `null` means no note text stored
- **Existing fields** (unchanged):
  - `id`: UUID, primary key
  - `deliverableId`: UUID, required, FK → `deliverables.id`, ON DELETE CASCADE
  - `reviewerUserId`: UUID, required, FK → `users.id`, ON DELETE CASCADE
  - `reviewed`: boolean, required, default `true`
  - `updatedAt`: timestamptz, required
- **Constraints**:
  - UNIQUE (`deliverable_id`, `reviewer_user_id`) — unchanged
- **Validation**:
  - `notes` trimmed length MUST be ≤ 8000 when non-empty (FR-016)
- **Relationships**:
  - Many-to-one → `Deliverable`
  - Many-to-one → `User` (reviewer)

## Entity: Deliverable (existing)

- **Used fields**: `id`, `user_id` (owner)
- **Authorization**: Notes access gated by deliverable owner read rules via `assertCanReadDeliverables`.

## Entity: User (existing)

- **Used fields**: `id`, `leader_id` (for hierarchy/DAC fixtures in tests)

## Value Objects (API)

### DeliverableReviewNotesResponse

- `deliverableId`: UUID
- `notes`: string | null — trimmed note text for the logged-in reviewer; `null` when none
- `reviewed`: boolean — current reviewed state for the logged-in reviewer
- `updatedAt`: string | null — ISO8601 last update; `null` when no review row exists

### SaveDeliverableReviewNotesRequest

- `notes`: string — raw note text (server trims; may be empty to clear)

### SaveDeliverableReviewNotesResponse

- Same shape as `DeliverableReviewNotesResponse`

## Authorization (non-persistent)

### Get review notes (`GET /deliverables/{deliverableId}/review-notes`)

- **Allow**: authenticated user with leader role AND `assertCanReadDeliverables(actor, deliverable.ownerUserId)`
- **Deny**: non-leader; cannot read deliverable; unauthenticated
- **Response scope**: Only row where `reviewer_user_id = actor`; never another leader's notes

### Save review notes (`PUT /deliverables/{deliverableId}/review-notes`)

- **Allow**: same as GET
- **Deny**: same as GET; validation error when notes exceed max length
- **Side effect**: If trimmed notes non-empty → upsert row with `reviewed = true` for actor

## State Transitions

### Load notes (GET)

1. Verify bearer auth and leader role.
2. Load deliverable by id; 404 if missing.
3. Verify `assertCanReadDeliverables(actor, owner)`.
4. Find review row for `(deliverable_id, reviewer_user_id = actor)`.
5. Return `{ deliverableId, notes, reviewed, updatedAt }` — default `notes: null`, `reviewed: false`, `updatedAt: null` when no row.

### Save notes (PUT)

1. Steps 1–3 as GET.
2. Trim `notes`; validate length ≤ 8000.
3. Upsert review row for `(deliverable_id, reviewer_user_id = actor)`.
4. Set `notes` to trimmed string or `null` if empty after trim.
5. If trimmed non-empty → set `reviewed = true`; else leave `reviewed` unchanged (new row with empty save: `reviewed = false`, `notes = null`).
6. Return updated DTO.

### Reviewed toggle interaction (`PUT /deliverables/{id}/reviewed`)

- **Required change from feature 010**: `setDeliverableReviewed(false)` MUST set `reviewed = false` on the existing row instead of deleting it when `notes` is non-null (FR-012).
- When `reviewed = false` and `notes` is null/empty, delete row to keep table sparse (matches prior delete semantics for note-less reviews).
- `setDeliverableReviewed(true)` unchanged: upsert row with `reviewed = true`, preserve existing `notes`.
- Team deliverables search already filters join with `reviewed: true`; rows with `reviewed = false` correctly show unreviewed in table.

## DAC Test Matrix

| Case                                   | Expected                           |
| -------------------------------------- | ---------------------------------- |
| Authorized leader GET own notes        | 200; notes/reviewed for actor only |
| Authorized leader PUT non-empty notes  | 200; reviewed true for actor       |
| Second leader GET same deliverable     | 200; empty notes (own row only)    |
| Peer GET/PUT notes                     | 403                                |
| Subordinate GET/PUT notes              | 403                                |
| Non-leader GET/PUT                     | 403 LEADER_REQUIRED                |
| Unauthenticated                        | 401                                |
| Notes > 8000 chars                     | 400 validation                     |
| Toggle reviewed off with notes present | reviewed false; notes preserved    |
| Clear notes (empty save)               | notes null; reviewed unchanged     |
