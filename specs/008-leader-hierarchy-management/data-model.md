# Data Model: Leader Hierarchy Management

## Entity: User (existing, behavior in scope)

- **Purpose**: Represents a person in the organization and their reporting relationship.
- **Primary fields in scope**:
  - `id`: UUID, primary key
  - `fullName` (or equivalent name field): string, required
  - `email`: string, required unique
  - `leaderId`: UUID, nullable (null means orphan user)
  - `updatedAt`: timestamp
- **Feature-specific rules**:
  - Search candidates must have `leaderId = null`.
  - Assignment sets `leaderId = authenticatedLeaderId`.
  - Assignment must fail when `leaderId` is no longer null at confirmation time.

## Entity: HierarchyAssignmentAuditEvent (new or mapped to existing audit mechanism)

- **Purpose**: Capture who assigned which orphan user and when.
- **Fields**:
  - `id`: UUID, primary key
  - `actorLeaderUserId`: UUID, FK -> `users.id`
  - `targetUserId`: UUID, FK -> `users.id`
  - `previousLeaderId`: UUID, nullable (expected null for this feature)
  - `newLeaderId`: UUID, FK -> `users.id`
  - `assignedAt`: timestamp
- **Constraints**:
  - One event per successful assignment.
  - Foreign key integrity for actor, target, and new leader.

## Value Objects (API)

### OrphanUserSearchRequest

- `query`: optional string; when provided, applies case-insensitive partial matching to name and email.
- `limit`/`offset` (optional, if existing pagination conventions apply).

### OrphanUserSummary

- Minimal data for selection list:
  - `id`
  - `name`
  - `email`

### AssignLeaderRequest

- `userId`: UUID of orphan user to assign.

### AssignLeaderResponse

- `userId`
- `leaderId` (resolved to authenticated leader)
- `updatedAt`

## Authorization Rules

- **Allow**: Authenticated users with leader role may search orphan users and assign leader.
- **Deny**: Non-leader or unauthenticated actors for all feature actions.

## State Transitions

### Search orphan users

1. Authenticate actor.
2. Verify actor is leader.
3. Query users where `leaderId` is null and name/email matches search query (partial or full).
4. Return filtered orphan-user list.

### Assign orphan user to leader

1. Authenticate actor.
2. Verify actor is leader.
3. Validate target user exists.
4. Re-check target user has `leaderId` null.
5. Update target `leaderId` to actor id.
6. Persist assignment audit event.
7. Return updated assignment summary.
