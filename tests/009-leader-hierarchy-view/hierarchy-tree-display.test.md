# Contract Test Plan: Hierarchy Tree Display

**Endpoint**: `GET /users/leader/hierarchy-view`  
**Contract**: `specs/009-leader-hierarchy-view/contracts/hierarchy-view-api.yaml`

## Assertions

- 200 response includes `self` (required) and `reports` (array).
- `manager` is null or a single node without nested superior chain.
- Every node has `id`, `displayName`, `email`, and `isLeader`.
- `self.isCurrentPosition` is true.
- Leader role required (403 for collaborator).
- Unauthenticated requests return 401.
