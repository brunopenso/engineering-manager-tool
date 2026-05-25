# Data Model: User Role Profiles

## Enum: UserRoleType

- Values: `COLLABORATOR`, `LEADER`, `ADMINISTRATOR`
- Rules:
  - `COLLABORATOR` is required for every user.
  - `LEADER` and `ADMINISTRATOR` are optional overlays.
  - A user may hold any combination including all three.

## Entity: User (existing, extended relationship)

- Purpose: Canonical authenticated identity (unchanged core fields).
- Fields: `id`, `email`, `fullName`, `firstLoginAt`, `lastLoginAt`, `createdAt`, `updatedAt`
- New relationships:
  - One-to-many with `UserRole`
  - One-to-many with `RoleAssignmentEvent` as target (`targetUserId`)
  - One-to-many with `RoleAssignmentEvent` as actor (`actorUserId`)

## Entity: UserRole

- Purpose: Materializes the active role set for a user.
- Fields:
  - `id`: UUID, primary key
  - `userId`: UUID, required, foreign key to `User.id`, on delete CASCADE
  - `role`: `UserRoleType`, required
  - `createdAt`: timestamptz, required
- Constraints:
  - Unique (`userId`, `role`)
  - Check constraint or application rule: `role` must be one of enum values
- Validation rules:
  - Exactly one `COLLABORATOR` row per user at all times
  - At most one row each for `LEADER` and `ADMINISTRATOR` per user (enforced by unique constraint)
  - Grant/revoke APIs MUST NOT target `COLLABORATOR`
- Indexes:
  - Unique index on (`user_id`, `role`)
  - Index on `user_id` for profile loads

## Entity: RoleAssignmentEvent

- Purpose: Audit trail for elevated role changes (FR-012).
- Fields:
  - `id`: UUID, primary key
  - `targetUserId`: UUID, required, FK to `User.id`
  - `actorUserId`: UUID, required, FK to `User.id`
  - `role`: `UserRoleType`, required (`LEADER` or `ADMINISTRATOR` only)
  - `action`: enum `GRANT` | `REVOKE`, required
  - `createdAt`: timestamptz, required
- Validation rules:
  - `role` MUST NOT be `COLLABORATOR` in audit events
  - `actorUserId` MUST reference a user with active `ADMINISTRATOR` at event time (enforced in service layer)
  - Idempotent grant/revoke MUST NOT create duplicate active `UserRole` rows; audit MAY still record attempt policy (see service rule: no-op grant returns success without duplicate row; optional audit skip for strict idempotency — implementation records only state-changing events)

## Value Object: RoleProfile (non-persistent)

- Purpose: API/session view of active roles for a user.
- Fields:
  - `roles`: ordered array of `UserRoleType` (always includes `COLLABORATOR`)
- Derived helpers (application layer):
  - `isCollaborator`: always true when profile exists
  - `isLeader`: `roles` includes `LEADER`
  - `isAdministrator`: `roles` includes `ADMINISTRATOR`

## Value Object: RoleChangeRequest (non-persistent)

- Purpose: Admin request body for grant/revoke operations.
- Fields:
  - `role`: `LEADER` | `ADMINISTRATOR`
  - `action`: `GRANT` | `REVOKE`
- Validation rules:
  - Reject `COLLABORATOR` as target role
  - Reject changes when actor lacks `ADMINISTRATOR`

## State Transitions

### New user (Google sign-in)

1. Create or update `User` (existing flow).
2. Ensure `UserRole` row exists for `COLLABORATOR` (insert if missing).
3. Return `RoleProfile` in auth responses.

### Backfill (migration)

1. For every existing `User` without `COLLABORATOR`, insert `UserRole(COLLABORATOR)`.
2. Optionally seed `ADMINISTRATOR` for emails in `BOOTSTRAP_ADMIN_EMAILS`.

### Administrator grants leader

1. Verify actor has `ADMINISTRATOR`.
2. Insert `UserRole(LEADER)` if absent (idempotent success if present).
3. Insert `RoleAssignmentEvent(GRANT)`.
4. Target user's next auth request loads updated roles.

### Administrator revokes leader

1. Verify actor has `ADMINISTRATOR`.
2. Delete `UserRole(LEADER)` if present; no-op success if absent.
3. Insert `RoleAssignmentEvent(REVOKE)`.
4. `COLLABORATOR` row remains untouched.

### Unauthorized role change attempt

- No `UserRole` mutation.
- No audit event (or audit `DENIED` only if security logging added later — out of v1 scope).
- Return `403` with stable error code.

## DAC Notes (leader role)

- Leader visibility rules apply when organizational reporting data exists.
- This feature stores the role and enforces `hasRole('LEADER')` at boundaries; recursive descendant tests use fixtures/mocks until hierarchy entities ship.
- Collaborator-only users: self-only visibility.
- Administrator: user directory + role management per access matrix in spec.
