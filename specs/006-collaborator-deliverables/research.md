# Research: Collaborator Deliverables

## Decision 1: Persist deliverables in a dedicated `deliverables` table with owner FK

- **Decision**: Store core deliverable fields on `deliverables` with `user_id` FK to `users.id` (CASCADE on delete), UUID primary key, and `created_at` / `updated_at` timestamps.
- **Rationale**: Satisfies FR-001 and FR-023; aligns with existing TypeORM + migration patterns.
- **Alternatives considered**:
  - JSON document per user: rejected — poor relational integrity for system tag references and DAC queries.
  - Embed deliverables on user row: rejected — unbounded cardinality and migration risk.

## Decision 2: Model system tags via junction table `deliverable_system_tags`

- **Decision**: Many-to-many between `deliverables` and `tags` with composite unique `(deliverable_id, tag_id)`; require ≥1 row per deliverable at service layer (FR-005).
- **Rationale**: Normalized references to administrator catalog; validates FK to `tags` on insert/update (FR-018).
- **Alternatives considered**:
  - UUID array column: rejected — no FK enforcement at database level.

## Decision 3: Model user tags and reference links as child tables

- **Decision**: `deliverable_user_tags` (`id`, `deliverable_id`, `label`) and `deliverable_links` (`id`, `deliverable_id`, `url`, `label` nullable); replace-all on update for simplicity in v1.
- **Rationale**: FR-008 and FR-010; straightforward validation and list ordering.
- **Alternatives considered**:
  - JSONB columns: acceptable but weaker per-element validation; child tables preferred for URL checks and limits.

## Decision 4: Business impact as PostgreSQL enum / check-constrained varchar

- **Decision**: Column `business_impact` with allowed values `LOW`, `MEDIUM`, `HIGH`, `TRANSFORMATIONAL` (FR-006, FR-019).
- **Rationale**: Stable API contract; prevents invalid classifications at persistence boundary.
- **Alternatives considered**:
  - Free text: rejected by spec.

## Decision 5: Field length and cardinality limits (v1)

- **Decision**:
  - `title`: 1–200 chars trimmed
  - `description`, `improvement_points`: 1–5000 chars trimmed
  - `role_in_deliverable`: 1–500 chars trimmed
  - `technical_description`: optional, max 5000 chars
  - `user_tags`: max 20 labels, each 1–64 chars
  - `system_tags`: min 1, max 20 tag IDs
  - `links`: max 20 entries; URL must be `http:` or `https:` with valid URL parse
- **Rationale**: Spec assumption to define limits at planning; prevents abuse while supporting rich portfolios (SC-004).
- **Alternatives considered**:
  - Unbounded text/arrays: rejected for DoS and UI performance risk.

## Decision 6: REST API under `/deliverables` with owner-scoped mutations

- **Decision**:
  - `GET /deliverables` — list authenticated user's own deliverables (default owner = self)
  - `GET /users/{userId}/deliverables` — list another user's deliverables when DAC allows (superior read-only)
  - `GET /deliverables/{deliverableId}` — detail with DAC
  - `POST /deliverables` — create (owner = auth user)
  - `PATCH /deliverables/{deliverableId}` — update (owner only)
  - `DELETE /deliverables/{deliverableId}` — delete (owner only)
- **Rationale**: Clear separation of self-management vs hierarchical read; mirrors `/users` patterns; testable per user story.
- **Alternatives considered**:
  - Single list endpoint with optional `ownerUserId` query: acceptable but less explicit for DAC tests; split paths chosen for clarity.

## Decision 7: Authenticated read-only tag catalog for system tag picker

- **Decision**: Add `GET /tags/catalog` returning `{ tags: TagSummary[] }` for any authenticated user (read-only); keep existing administrator-only `/tags` mutations unchanged.
- **Rationale**: Collaborators must select system tags (FR-005) but must not access admin tag management (005-admin-tags scope).
- **Alternatives considered**:
  - Open `GET /tags` to all authenticated users: rejected — blurs administrator-only catalog management contract.
  - Duplicate tag list in deliverable response only: rejected — extra payload and stale picker data.

## Decision 8: DAC via hierarchy resolver extension point

- **Decision**: Add `canReadDeliverablesForOwner(actorUserId, ownerUserId)` in `authorizationService` delegating to injectable `OrganizationalHierarchyResolver.isDescendantOf(descendant, ancestor)`. Default resolver returns false for non-self until org persistence ships; Vitest fixtures inject trees for US5 / FR-016 tests.
- **Rationale**: Constitution VII + clarified spec (peers deny, full superior chain allow read-only); matches 004-user-role-profiles deferral pattern without blocking deliverable CRUD for owners.
- **Alternatives considered**:
  - Leader role badge only: rejected — spec requires reporting position, not role overlay alone.

## Decision 9: Web routes and shell navigation

- **Decision**:
  - `/app/deliverables` — owner portfolio (list/create/edit/delete) for all authenticated collaborators
  - `/app/deliverables/view/:userId` — read-only superior portfolio (US5) when API allows
  - Shell menu entry "Deliverables" in base options (available: true)
- **Rationale**: FR-011; dedicated management screen; superior view separated to prevent accidental edits.
- **Alternatives considered**:
  - Query param on same route only: acceptable for v1 but split routes reduce edit UI exposure for superiors.

## Decision 10: Hard delete deliverables

- **Decision**: `DELETE` removes deliverable row; CASCADE removes junction/child rows.
- **Rationale**: FR-014; no assignment references from other entities in v1.
- **Alternatives considered**:
  - Soft delete: deferred until audit requirements exist.

## Decision 11: List ordering and pagination

- **Decision**: Default sort `updated_at DESC`; no pagination in v1; acceptable up to ~50–100 items per SC-004 with client-side list.
- **Rationale**: SC-004 targets 50 items without unacceptable delay; pagination deferred until measured need.
- **Alternatives considered**:
  - Cursor pagination in v1: rejected as premature for personal portfolios.
