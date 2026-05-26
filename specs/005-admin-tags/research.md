# Research: Administrator Tag Management

## Decision 1: Persist tags in a dedicated `tags` table

- **Decision**: Store tags as rows with UUID primary key, `name` (varchar), `color` (varchar), and standard `created_at` / `updated_at` timestamps.
- **Rationale**: Matches FR-001 and FR-011; aligns with existing TypeORM entity + migration pattern used for `user_roles`.
- **Alternatives considered**:
  - JSON catalog in configuration: rejected because it is not migration-backed and fails constitution Principle III.
  - Composite key (name only): rejected because FR-009 requires stable identifier across renames.

## Decision 2: Enforce unique tag names case-insensitively at the database

- **Decision**: Add a unique index on `lower(name)` (or equivalent migration constraint) plus service-layer normalization (trim + case-fold compare).
- **Rationale**: Satisfies FR-002 and edge case for duplicate names regardless of casing.
- **Alternatives considered**:
  - Application-only uniqueness check: rejected as race-prone under concurrent creates.

## Decision 3: Validate color as six-digit hexadecimal (`#RRGGBB`)

- **Decision**: Accept only `#` followed by six hexadecimal digits; reject other formats with `VALIDATION_ERROR`.
- **Rationale**: Matches spec assumption for v1; simple to validate in API and render as swatches in UI.
- **Alternatives considered**:
  - Named CSS colors: rejected as ambiguous and harder to preview consistently.
  - RGB/HSL objects: rejected as unnecessary complexity for v1.

## Decision 4: Reuse existing administrator authorization primitives

- **Decision**: Protect all `/tags` routes with `assertAdministrator(auth.roles)` using `authorizationService` already loaded in auth middleware.
- **Rationale**: FR-006/FR-007; consistent with `/users` admin routes and constitution Principle II.
- **Alternatives considered**:
  - New role type for tag admin: rejected; spec explicitly requires existing administrator role.

## Decision 5: REST admin API under `/tags`

- **Decision**: Implement `GET /tags`, `POST /tags`, `PATCH /tags/:tagId`, `DELETE /tags/:tagId` with bearer auth and administrator guard.
- **Rationale**: Mirrors established Fastify route style; supports automated integration tests per FR-012.
- **Alternatives considered**:
  - GraphQL: rejected; project uses REST for product APIs.

## Decision 6: Dedicated web route `/app/admin/tags` with existing `AdminRoute` guard

- **Decision**: Add administrator-only page for list/create/edit/delete; expose shell menu entry only when `isAdministrator(user)`; implement UI with `frontend-design` skill and Material UI (color input + swatch).
- **Rationale**: FR-005, FR-008, constitution Principle VIII; parallels `/app/admin/users`.
- **Alternatives considered**:
  - Embed tag management inside user admin page: rejected as mixed concerns and poorer UX for catalog maintenance.

## Decision 7: Name validation rules

- **Decision**: Trim whitespace; require length 1–64 characters after trim; reject empty names.
- **Rationale**: FR-003; reasonable display limit for labels without over-constraining admins.
- **Alternatives considered**:
  - 255 characters: acceptable but unnecessary for tag labels in v1.

## Decision 8: Hierarchical DAC is not in scope

- **Decision**: No descendant/peer visibility matrix for tags; access is binary administrator vs non-administrator per spec role table.
- **Rationale**: Tags are global configuration, not collaborator organizational data (constitution VII applies when hierarchy data is exposed).
- **Alternatives considered**:
  - Leader read-only tag list: rejected; spec assumes non-admins have no management catalog access in v1.

## Decision 9: Tag assignment to other entities deferred

- **Decision**: No join tables or foreign keys from users/work items to tags in this feature.
- **Rationale**: Spec assumptions explicitly exclude assignment in v1.
- **Alternatives considered**:
  - Ship `user_tags` junction: rejected as scope creep.

## Decision 10: Delete semantics

- **Decision**: Hard delete tag row on confirmed administrator delete; return `404` when tag id not found; no soft-delete in v1.
- **Rationale**: FR-010; catalog housekeeping without orphan complexity while no assignments exist.
- **Alternatives considered**:
  - Soft delete: deferred until assignment features need referential safety.
