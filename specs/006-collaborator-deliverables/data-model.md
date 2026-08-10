# Data Model: Collaborator Deliverables

## Enum: BusinessImpact

- Values: `LOW`, `MEDIUM`, `HIGH`, `TRANSFORMATIONAL`
- Rules: Required on every deliverable; immutable type set in v1 (FR-006, FR-019).

## Entity: Deliverable

- **Purpose**: Collaborator-owned portfolio record of meaningful work (FR-001).
- **Table name**: `deliverables`
- **Fields**:
  - `id`: UUID, primary key
  - `userId`: UUID, required, FK → `users.id`, ON DELETE CASCADE (owner)
  - `title`: varchar(200), required, trimmed non-empty (FR-002)
  - `description`: text, required, max 5000 trimmed (FR-003)
  - `roleInDeliverable`: varchar(500), required, `role_in_deliverable` column (FR-004)
  - `businessImpact`: enum/varchar, required, `business_impact` column (FR-006)
  - `improvementPoints`: text, required, `improvement_points` column (FR-007)
  - `technicalDescription`: text, nullable, `technical_description` (FR-009)
  - `createdAt`: timestamptz, required
  - `updatedAt`: timestamptz, required
- **Indexes**:
  - `user_id` for owner list queries
  - `(user_id, updated_at DESC)` for portfolio listing (SC-004)
- **Relationships**:
  - Many-to-one → `User` (owner)
  - One-to-many → `DeliverableSystemTag`
  - One-to-many → `DeliverableUserTag`
  - One-to-many → `DeliverableLink`

## Entity: DeliverableSystemTag (junction)

- **Purpose**: Associate deliverable with administrator catalog tags (FR-005, FR-018).
- **Table name**: `deliverable_system_tags`
- **Fields**:
  - `deliverableId`: UUID, FK → `deliverables.id`, ON DELETE CASCADE
  - `tagId`: UUID, FK → `tags.id`, ON DELETE RESTRICT (prevent delete of in-use tags; admin must reassign first — or RESTRICT with clear error)
- **Constraints**:
  - Primary key or unique on `(deliverable_id, tag_id)`
  - Service rule: count ≥ 1 per deliverable on create/update
  - Max 20 associations per deliverable
- **Note**: If administrator deletes a tag still referenced, save/update MUST fail validation (FR edge case) — RESTRICT on `tag_id` supports this.

## Entity: DeliverableUserTag

- **Purpose**: Optional free-form labels (FR-008).
- **Table name**: `deliverable_user_tags`
- **Fields**:
  - `id`: UUID, primary key
  - `deliverableId`: UUID, FK → `deliverables.id`, ON DELETE CASCADE
  - `label`: varchar(64), required, trimmed non-empty
- **Constraints**:
  - Max 20 rows per deliverable (service layer)

## Entity: DeliverableLink

- **Purpose**: Optional reference URLs (FR-010, FR-020).
- **Table name**: `deliverable_links`
- **Fields**:
  - `id`: UUID, primary key
  - `deliverableId`: UUID, FK → `deliverables.id`, ON DELETE CASCADE
  - `url`: varchar(2048), required, `http`/`https` only
  - `label`: varchar(120), nullable
- **Constraints**:
  - Max 20 rows per deliverable (service layer)

## Entity: Tag (existing)

- Referenced only via `DeliverableSystemTag`; no schema changes in this feature.

## Value Objects (API)

### DeliverableSummary

- `id`, `ownerUserId`, `title`, `businessImpact`, `systemTags` (TagSummary[]), `updatedAt`

### DeliverableDetail

- All summary fields plus `description`, `roleInDeliverable`, `improvementPoints`, optional `technicalDescription`, `userTags` (string[]), `links` ({ url, label? }[]), `createdAt`

### DeliverableCreateRequest / DeliverableUpdateRequest

- Mirror writable fields; update replaces child collections (user tags, links, system tags) atomically in service transaction.

## Authorization (non-persistent)

### Read (`GET` list/detail, including `/users/{userId}/deliverables`)

- **Allow** if `actorUserId === ownerUserId`
- **Allow** if `isDescendantOf(ownerUserId, actorUserId)` via hierarchy resolver (superior chain read-only, FR-016c)
- **Deny** peers, upward (subordinate viewing superior), unrelated branches (FR-016d–f)

### Mutate (`POST`, `PATCH`, `DELETE`)

- **Allow** only if `actorUserId === ownerUserId` (FR-015, FR-017)
- **Deny** superiors and administrators acting on others' records in v1

### Tag catalog read (`GET /tags/catalog`)

- Any authenticated user (for system tag picker)

## State Transitions

### Create deliverable (owner)

1. Verify `actorUserId` will own record.
2. Validate all required fields and child collections.
3. Verify all `tagId` values exist in `tags`.
4. Insert `deliverables` + junction/children in transaction.
5. Return `DeliverableDetail`.

### Update deliverable (owner)

1. Load by `id`; 404 if missing.
2. Verify `actorUserId === deliverable.userId`; else 403.
3. Validate payload; replace system tags, user tags, links in transaction.
4. Return updated detail.

### Delete deliverable (owner)

1. Load by `id`; 404 if missing.
2. Verify ownership; else 403.
3. Hard delete (CASCADE children).

### Read deliverable / list (owner or superior)

1. Resolve target `ownerUserId` (self or path param).
2. Run DAC read check; 403 if denied.
3. Return summary list or detail (no mutation fields differ; UI enforces read-only for non-owner).

## DAC Test Matrix (fixtures until org persistence)

| Case                           | Expected |
| ------------------------------ | -------- |
| Owner reads self               | Allow    |
| Direct manager reads report    | Allow    |
| Top-of-chain reads deep report | Allow    |
| Peer reads peer                | Deny     |
| Report reads manager           | Deny     |
| User in other branch           | Deny     |
| Superior PATCH/DELETE          | Deny     |
