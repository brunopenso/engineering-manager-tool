# Data Model: Administrator Tag Management

## Entity: Tag

- **Purpose**: Organization-wide label catalog entry with visual color for future product use.
- **Table name**: `tags`
- **Fields**:
  - `id`: UUID, primary key, generated on insert, immutable (FR-009)
  - `name`: varchar(64), required, unique case-insensitively (FR-002, FR-003)
  - `color`: varchar(7), required, format `#RRGGBB` (FR-004)
  - `createdAt`: timestamptz, required
  - `updatedAt`: timestamptz, required
- **Constraints**:
  - Primary key on `id`
  - Unique index on `lower(name)` (or functional unique constraint equivalent)
  - Check or application validation: `color` matches `^#[0-9A-Fa-f]{6}$`
- **Indexes**:
  - Unique on `lower(name)` for duplicate prevention
  - Primary key on `id` for lookups by identifier
- **Validation rules** (service layer, mirrored in API contract):
  - `name`: trim; length 1–64; must not be whitespace-only
  - `color`: must match `#RRGGBB`
  - Duplicate name (case-insensitive) on create or rename → `409` or `400` with stable `DUPLICATE_TAG_NAME` code
  - Update/delete on missing `id` → `404` with stable `NOT_FOUND` code

## Value Object: TagSummary (API response)

- **Purpose**: Serializable tag for list and detail responses.
- **Fields**:
  - `id`: string (UUID)
  - `name`: string
  - `color`: string (`#RRGGBB`)
  - `createdAt`: ISO-8601 string (optional on list if not needed for UI v1)
  - `updatedAt`: ISO-8601 string (optional on list)

## Value Object: TagCreateRequest (non-persistent)

- **Fields**:
  - `name`: string, required
  - `color`: string, required

## Value Object: TagUpdateRequest (non-persistent)

- **Fields** (at least one required):
  - `name`: string, optional
  - `color`: string, optional

## Relationships

- None in v1 (no foreign keys from other entities to `tags`).

## Authorization (non-persistent)

- All CRUD operations require active `ADMINISTRATOR` role on the authenticated user (from `user_roles` via existing auth middleware).
- Non-administrators: `403` on API; web `AdminRoute` redirect away from `/app/admin/tags`.

## State Transitions

### Create tag (administrator)

1. Verify actor has `ADMINISTRATOR`.
2. Validate `name` and `color`.
3. Reject if `lower(name)` already exists.
4. Insert `Tag` row; return `TagSummary`.

### Update tag (administrator)

1. Verify actor has `ADMINISTRATOR`.
2. Load tag by `id`; if missing → `404`.
3. If `name` provided, validate and check uniqueness excluding current row.
4. If `color` provided, validate format.
5. Update fields; `id` unchanged; refresh `updatedAt`.

### Delete tag (administrator)

1. Verify actor has `ADMINISTRATOR`.
2. Load tag by `id`; if missing → `404`.
3. Delete row (hard delete).

### Unauthorized attempt

- No mutation; return `403` with stable forbidden code.

## DAC Notes

- Not applicable: tags are global admin configuration, not hierarchical collaborator data.
- Constitution VII validation for this feature is limited to administrator-only API/UI guards (negative tests for collaborator and leader-without-admin).
