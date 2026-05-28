# Research: Leader Hierarchy View

## Decision 1: API shape for scoped hierarchy

- **Decision**: Add `GET /users/leader/hierarchy-view` returning `{ manager, self, reports }` where `manager` is nullable direct manager summary, `self` is the actor node (marked `isCurrentPosition: true`), and `reports` is a nested array of descendant nodes each with `id`, `displayName`, `email`, and `children`.
- **Rationale**: Single round-trip satisfies SC-005; server builds the allowed set so the client cannot request out-of-scope users; nested `children` maps directly to tree UI.
- **Alternatives considered**:
  - Paginated/lazy child fetch per node (rejected for v1: adds latency and complexity; subtree cap 200 is acceptable in one query).
  - Reuse admin `GET /users` list (rejected: exposes entire org and violates DAC).

## Decision 2: Descendant query strategy

- **Decision**: Load actor with `leader` relation for manager, then fetch all users whose reporting chain is under the actor using a PostgreSQL recursive CTE on `leader_id`, assembled into a tree in application code.
- **Rationale**: Correct for arbitrary depth; one query for descendants; leverages existing `leader_id` column without migration.
- **Alternatives considered**:
  - N+1 queries per level (rejected: poor performance for deep/wide trees).
  - Materialized path column (rejected: requires schema change outside feature scope).

## Decision 3: Display name fallback

- **Decision**: `displayName = fullName.trim() || email` computed server-side for every node in the response.
- **Rationale**: Matches FR-004; keeps UI simple and consistent across manager/self/reports.
- **Alternatives considered**:
  - Client-only fallback (rejected: duplicates logic and risks inconsistent API consumers).

## Decision 4: Tree UI composition (manager above + subtree below)

- **Decision**: Two-region layout on one page: (1) optional **“Your manager”** summary row when `manager` is present; (2) **SimpleTreeView** rooted at `self` with `reports` as `children`, using `defaultExpandedItems={[self.id]}` and controlled `expandedItems` state thereafter.
- **Rationale**: Standard MUI TreeView collapses hide descendants when an ancestor is collapsed; placing the manager outside the tree avoids violating FR-005 (“only current position expanded”) while still showing one level up by name. Subtree expand/collapse uses one-layer-at-a-time TreeView behavior (FR-006).
- **Alternatives considered**:
  - Single tree rooted at manager (rejected: would require manager expanded to show self, conflicting with FR-005).
  - Fully custom accordion list (rejected: weaker tree accessibility; more code than `@mui/x-tree-view`).

## Decision 5: Authorization reuse

- **Decision**: Reuse `assertLeaderForHierarchyManagement` (alias of leader role check) on the new endpoint; reuse `LeaderRoute` and parallel web tests for non-leader deny.
- **Rationale**: Consistent with feature 008 leader tooling; no new role semantics.
- **Alternatives considered**:
  - New permission flag (rejected: unnecessary until role model grows).

## Decision 6: Route and navigation separation

- **Decision**: View at `/app/leader/hierarchy/view`; keep management at `/app/leader/hierarchy`. Shell menu adds **“Hierarchy view”** (or “Org chart”) alongside existing **“Hierarchy”** management link.
- **Rationale**: Satisfies FR-001/FR-009 separation; avoids mixing read-only tree with assignment UI.
- **Alternatives considered**:
  - Tabs on one page (rejected: couples unrelated workflows and complicates guards/testing).

## Decision 7: `@mui/x-tree-view` dependency

- **Decision**: Add `@mui/x-tree-view` at latest stable version compatible with `@mui/material@^6.4.2` (verify with `npm install` and web build during implementation).
- **Rationale**: Constitution Principle VIII and accessible expand/collapse for organizational trees.
- **Alternatives considered**:
  - Material `Collapse` + `List` only (rejected: higher effort for equivalent tree a11y).
