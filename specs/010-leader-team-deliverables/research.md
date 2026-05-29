# Research: Leader Team Deliverables

## Decision 1: Team member selector data source

- **Decision**: Add `GET /users/leader/team-members` returning a flat `{ members: [{ id, displayName }] }` list of all direct and indirect reports (exclude actor), ordered by display name. Use the same PostgreSQL recursive CTE on `leader_id` as `getLeaderHierarchyView`, flattened (no nested tree).
- **Rationale**: Spec FR-003/FR-004 require descendant-only options with display names; flat list suits a `<Select>` control; server-side filtering prevents out-of-subtree IDs in the picker.
- **Alternatives considered**:
  - Reuse hierarchy-view nested tree in a tree-select (rejected: overkill for a filter dropdown; spec calls for select field).
  - Client-side flatten of hierarchy-view response (rejected: extra payload and couples UI to tree shape).

## Decision 2: Filtered deliverables search endpoint

- **Decision**: Add `GET /users/leader/team-deliverables?userId={uuid}&startDate={YYYY-MM-DD}&endDate={YYYY-MM-DD}` returning `{ ownerUserId, deliverables: [{ id, title, description, reviewed }] }`. Filter `deliverables.updated_at` to `[startDate 00:00:00 UTC, endDate 23:59:59.999 UTC]` inclusive. Left-join `deliverable_reviews` for `(reviewer_user_id = actor, deliverable_id)`; `reviewed` defaults `false` when no row.
- **Rationale**: Single round-trip for table render; keeps leader workflow separate from owner portfolio list; date + reviewed joined efficiently in one query.
- **Alternatives considered**:
  - Extend `GET /users/:userId/deliverables` with query params (rejected: mixes collaborator/superior read contract with leader-screen-specific reviewed join).
  - Client-side date filter on full list (rejected: over-fetches and breaks SC-005 for large portfolios).

## Decision 3: Reviewed persistence model

- **Decision**: New table `deliverable_reviews` with columns `id`, `deliverable_id`, `reviewer_user_id`, `reviewed` (boolean, default true when row exists), `updated_at`. Unique constraint on `(deliverable_id, reviewer_user_id)`. Toggle via `PUT /deliverables/{deliverableId}/reviewed` body `{ reviewed: boolean }` — upsert row when `true`, delete row when `false` (or set `reviewed = false`; upsert with boolean is simpler for reads).
- **Rationale**: Satisfies FR-012–FR-014 per-leader isolation; CASCADE on deliverable delete handles orphan edge case.
- **Alternatives considered**:
  - JSON column on `deliverables` (rejected: poor query/index semantics, no FK integrity).
  - Single global `reviewed` on deliverable (rejected: violates per-leader requirement).

## Decision 4: Subtree authorization for team endpoints

- **Decision**: Implement `assertUserInLeaderSubtree(actorUserId, targetUserId)` in `userService` using recursive CTE (`targetUserId` must appear in subtree where `leader_id = actorUserId`). Use on team-members (implicit), team-deliverables search, and reviewed toggle (via existing `assertCanReadDeliverables` plus leader role).
- **Rationale**: `leader_id` is persisted (migration `1779765000000`); hierarchy view already uses DB CTE; injectable `organizationalHierarchy` resolver is unset in production and must not gate this feature.
- **Alternatives considered**:
  - Wire production DB resolver globally in this feature (deferred: valuable follow-up but broader than team deliverables scope).
  - Leader role only without subtree check (rejected: violates constitution VII).

## Decision 5: Date range UI control

- **Decision**: Use paired MUI `TextField` inputs with `type="date"` for start and end, defaulting to `(today - 29 days)` through `today` on mount. Validate `startDate <= endDate` before search; show inline error if invalid.
- **Rationale**: No new npm dependencies; accessible native date inputs; sufficient for v1 changeable range with last-30-days default.
- **Alternatives considered**:
  - `@mui/x-date-pickers` (deferred: adds adapter peer deps; can upgrade later without API changes).
  - Preset-only chips (rejected: spec clarification requires changeable range).

## Decision 6: Search trigger and loading UX

- **Decision**: `useEffect` (or equivalent) runs search when `selectedUserId`, `startDate`, and `endDate` are valid; abort in-flight requests on filter change. Show loading spinner in table area; optimistic reviewed toggle with rollback on API error.
- **Rationale**: Matches FR-007–FR-009; prevents stale results edge case.
- **Alternatives considered**:
  - Manual “Search” button only (rejected: spec requires automatic search on selection/date change).

## Decision 7: Route and navigation

- **Decision**: Page at `/app/leader/team-deliverables`; shell label **Team Deliverables** in Leader section; guard with existing `LeaderRoute`.
- **Rationale**: Consistent with other leader routes (`/app/leader/hierarchy/view`, etc.).
- **Alternatives considered**:
  - Extend `DeliverablesViewPage` (rejected: different filters, reviewed mutation, and team-member picker).

## Decision 8: Date boundary semantics

- **Decision**: Compare deliverable `updated_at` using inclusive calendar-day bounds in UTC: `updated_at >= startOfDay(startDate)` AND `updated_at <= endOfDay(endDate)`.
- **Rationale**: Matches spec acceptance scenario for boundary inclusion; consistent server-side regardless of client timezone display.
- **Alternatives considered**:
  - Rolling 30-day window only server-side (rejected: spec requires arbitrary changeable range after clarification).
