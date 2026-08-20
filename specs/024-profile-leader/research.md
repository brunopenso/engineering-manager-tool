# Research: Profile Assigned Leader

## Decision 1: Transport leader on session identity

- **Decision**: Add `leader: { id, fullName } | null` to `AuthUserResponse` / web `AuthUser`, populated in `mapUserToAuthResponse`. Login, `GET /auth/me`, `POST /auth/refresh`, and `PATCH /users/me` all return it.
- **Rationale**: Profile already renders from session user; FR-001/FR-002 require identity to include leader after sign-in; avoids a new endpoint.
- **Alternatives considered**:
  - `GET /users/me` dedicated profile GET (rejected: extra round trip; PATCH already exists).
  - Reuse leader hierarchy view API (rejected: leader-role gated; collaborators would be denied).

## Decision 2: Resolve leader inside the mapper

- **Decision**: If `user.leaderId` is null, return `leader: null` without a query. Otherwise `findOne` on the User repository selecting `id` and `fullName`. If the relation is already loaded, use it. Missing row → `null`. Do not import `userService`.
- **Rationale**: Avoids a circular import (`userService` already uses auth mapping paths indirectly). Matches SET NULL on leader delete.
- **Alternatives considered**:
  - Always `relations: ['leader']` on `findUserById` (rejected: widens every user load).
  - Join in every caller (rejected: easy to miss login/refresh/PATCH).

## Decision 3: Empty state copy on Profile

- **Decision**: Always show the Leader row. Value is `leader.fullName` or i18n `fields.leaderNone` (“No leader assigned” / “Nenhum líder atribuído”).
- **Rationale**: Approved product choice; FR-005; avoids a blank field that looks like a load failure.
- **Alternatives considered**:
  - Hide the row when null (rejected by product).
  - Show leader id (rejected: not user-facing).

## Decision 4: Admin directory payload

- **Decision**: Accept that `GET /users` inherits `leader` via the shared mapper. Do not change admin UI in this feature.
- **Rationale**: One UserProfile contract; administrators already see user directory data.
- **Alternatives considered**:
  - Strip `leader` for admin list (rejected: dual shapes, more bugs).

## Decision 5: No migration

- **Decision**: Use existing `users.leader_id`.
- **Rationale**: Relationship already persisted by leader user creation and hierarchy management.
- **Alternatives considered**:
  - Denormalize leader name on users (rejected: stale names).
