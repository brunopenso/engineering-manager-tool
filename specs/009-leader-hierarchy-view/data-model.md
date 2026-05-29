# Data Model: Leader Hierarchy View

## Entity: User (existing, read scope only)

- **Purpose**: Person in the organization; reporting link via `leader_id`.
- **Fields used**:
  - `id`: UUID
  - `fullName`: string (`full_name`)
  - `email`: string, unique
  - `leaderId`: UUID, nullable (`leader_id`)
- **Feature rules**:
  - **Manager node**: user where `id = actor.leaderId` (0 or 1 record).
  - **Self node**: `id = actorUserId`.
  - **Descendants**: all users reachable by following `leader_id` from any user whose `leader_id = actorUserId`, recursively.

## Value Object: HierarchyViewNode

- **Purpose**: One person shown in the tree or manager summary.
- **Fields**:
  - `id`: UUID
  - `displayName`: string ( `fullName` if non-empty, else `email` )
  - `email`: string (for fallback verification and optional screen-reader context)
  - `isLeader`: boolean (true when user has the LEADER role)
  - `isCurrentPosition`: boolean (true only on `self`)
  - `children`: `HierarchyViewNode[]` (only on nodes in the downward tree; manager has empty/absent children)

## API Aggregate: LeaderHierarchyViewResponse

- **Purpose**: Complete payload for the read-only screen.
- **Fields**:
  - `manager`: `HierarchyViewNode | null` (no `children`, never chained upward)
  - `self`: `HierarchyViewNode` (`isCurrentPosition: true`, `children` = direct reports only at top level of `reports` — see assembly note)
  - `reports`: `HierarchyViewNode[]` (forest of direct reports, each with nested `children` for indirect reports)

**Assembly note**: `self.children` MAY be omitted when `reports` is provided as sibling array; contract allows either pattern but implementation SHOULD use `reports` as direct children of self in the UI builder for a single logical root. Preferred response shape:

```json
{
  "manager": { "id": "...", "displayName": "...", "email": "..." },
  "self": { "id": "...", "displayName": "...", "email": "...", "isCurrentPosition": true },
  "reports": [ { "id": "...", "displayName": "...", "email": "...", "children": [ ... ] } ]
}
```

## Authorization Rules

- **Allow**: Authenticated user with leader role receives hierarchy view for their own `userId` only (implicit from session).
- **Deny**: Non-leader → 403; unauthenticated → 401.
- **Data filter (server)**:
  - Include: `manager` (if `actor.leaderId` set), `self`, all descendants of `self`.
  - Exclude: peers, users in other branches, second-level+ managers, users not in subtree.

## UI State (client)

- **expandedNodeIds**: Set of node IDs; initialized to `{ self.id }` only.
- **Tree root for SimpleTreeView**: virtual root or `self` item with `reports` attached as children in view-model.
- **Current position styling**: applied when `isCurrentPosition === true`.

## State Transitions

### Load hierarchy view

1. Authenticate actor.
2. Verify leader role.
3. Load actor user; resolve direct manager (one hop).
4. Query all descendants via recursive CTE.
5. Build nested `reports` tree; compute `displayName` for each node.
6. Return `LeaderHierarchyViewResponse`.

### Expand/collapse (client only)

1. User toggles node expansion.
2. Update `expandedNodeIds` (does not refetch; children already in payload).
3. Render one additional visible level under expanded node.
