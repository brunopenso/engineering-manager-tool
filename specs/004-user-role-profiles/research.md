# Research: User Role Profiles

## Decision 1: Persist roles in a dedicated `user_roles` table with enum values

- **Decision**: Store one row per active role per user (`COLLABORATOR`, `LEADER`, `ADMINISTRATOR`) with a unique constraint on `(user_id, role)`.
- **Rationale**: Supports concurrent roles, idempotent grants, migration backfill, and database-level integrity without encoding role sets in opaque JSON.
- **Alternatives considered**:
  - Boolean columns (`is_leader`, `is_administrator`) with implicit collaborator: rejected because it does not model collaborator as a first-class persisted role required for backfill verification (FR-011).
  - Single `primary_role` enum: rejected because it violates the requirement that all three roles can coexist.

## Decision 2: Treat collaborator as invariant at creation and deny revocation in service layer

- **Decision**: `upsertUserFromGoogleIdentity` and migration backfill always insert `COLLABORATOR`; role-management APIs only accept `LEADER` and `ADMINISTRATOR` as grant/revoke targets.
- **Rationale**: Matches FR-002 and FR-008; keeps admin UI simple and prevents accidental removal even via direct API misuse.
- **Alternatives considered**:
  - Database trigger to re-insert collaborator: rejected as harder to test and reason about than explicit service rules.

## Decision 3: Load roles from database on authenticated requests (not only from JWT)

- **Decision**: After access-token verification, resolve the user's active roles from PostgreSQL and attach them to the request context; include roles in `/auth/me` and login responses via `AuthUserResponse`.
- **Rationale**: Role changes must take effect on the next request (spec assumption) without requiring re-login; embedding roles only in JWT would be stale until token refresh.
- **Alternatives considered**:
  - JWT-only role claims: rejected due to stale authorization after admin updates.
  - Short-lived tokens with forced refresh on role change: rejected as unnecessary UX friction for v1.

## Decision 4: Record grant/revoke history in `role_assignment_events`

- **Decision**: Append-only audit rows for every successful grant or revoke of `LEADER` or `ADMINISTRATOR`, capturing actor, target user, role, action, and timestamp.
- **Rationale**: Satisfies FR-012 and supports operational investigation of privilege changes.
- **Alternatives considered**:
  - Application logs only: rejected because they are not queryable or migration-backed per constitution.

## Decision 5: Centralize authorization helpers and apply at route boundaries

- **Decision**: Add `requireRoles` / `hasRole` utilities in backend middleware/services; protect role-management and user-directory routes with `ADMINISTRATOR`; define leader checks for future hierarchical endpoints without implementing org-tree storage in this feature.
- **Rationale**: Aligns with constitution Principle II (explicit authorization at route boundaries) and FR-010.
- **Alternatives considered**:
  - Per-route inline checks: rejected as inconsistent and harder to test.

## Decision 6: Bootstrap initial administrators via migration seed using environment variable

- **Decision**: Migration backfill assigns `COLLABORATOR` to all users; optional `BOOTSTRAP_ADMIN_EMAILS` (comma-separated) env var seeds `ADMINISTRATOR` for known operators in non-production and controlled production bootstrap.
- **Rationale**: Avoids chicken-and-egg where no user can grant the first administrator role.
- **Alternatives considered**:
  - Manual SQL in production: rejected as error-prone and non-repeatable.
  - First user auto-admin: rejected as insecure for multi-tenant org sign-in flows.

## Decision 7: Web surfaces — profile for self, admin directory for role management

- **Decision**: Add `/app/profile` for signed-in users to view roles; add `/app/admin/users` (admin-only) to list users and grant/revoke `LEADER` and `ADMINISTRATOR`; use `frontend-design` skill for both screens.
- **Rationale**: Covers user stories 2 and 3 with clear route boundaries and menu integration in existing app shell.
- **Alternatives considered**:
  - Roles only in header tooltip: rejected as insufficient for admin management workflows (SC-002).

## Decision 8: Leader hierarchical visibility is role-gated but org relationships are out of scope

- **Decision**: Implement `hasRole('LEADER')` authorization primitive and DAC test fixtures; defer reporting-line entity/API until a future feature. Until then, leader-only endpoints return structured "not configured" or empty scoped results in tests.
- **Rationale**: Spec assumes hierarchy may come later; this feature still delivers role model and authorization plumbing required by constitution VII.
- **Alternatives considered**:
  - Blocking feature until org chart exists: rejected because collaborator/admin flows deliver standalone value.
