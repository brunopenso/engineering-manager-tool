# Research: Admin Users List Filters

## Decision 1: Filtering execution location

- **Decision**: Apply all filters **server-side** on `GET /users` via query parameters: optional `name`, optional `email`, optional repeatable `roles` (`COLLABORATOR` | `LEADER` | `ADMINISTRATOR`). Replace unconditional `findAllUsers()` with `findUsersForAdmin(filters)` using TypeORM query builder.
- **Rationale**: Spec FR-012 and assumptions require backend filtering; aligns with `012-deliverables-list-filters` and avoids shipping full user directory to the client.
- **Alternatives considered**:
  - Client-side filter on `listUsers()` result (rejected by spec).

## Decision 2: Name and email match semantics

- **Decision**: After `trim()`, non-empty `name` applies `LOWER(user.fullName) LIKE :namePattern` with `namePattern = '%' + lower(trimmed) + '%'`. Non-empty `email` applies `LOWER(user.email) LIKE :emailPattern` similarly. Empty or whitespace-only values omit that dimension.
- **Rationale**: Matches spec FR-003, FR-005; reuses proven pattern from `searchOrphanUsers` but with **separate** fields (spec requires independent name and email filters, not a single combined query).
- **Alternatives considered**:
  - Full-text search / trigram index (rejected: out of scope for current org size; no migration).
  - Exact match only (rejected: spec requires partial).

## Decision 3: Role filter semantics

- **Decision**: When one or more valid `roles` are provided, restrict to users with `EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = user.id AND ur.role IN (:roles))` (OR within roles). When omitted or empty, no role constraint.
- **Rationale**: Spec FR-007, FR-008; `user_roles` is authoritative for active roles.
- **Alternatives considered**:
  - Filter only elevated roles in SQL without collaborator row (rejected: collaborator filter must match rows in `user_roles` like API responses).

## Decision 4: Combined filter logic

- **Decision**: **AND** across active dimensions (name + email + roles); **OR** within the `roles` array.
- **Rationale**: Spec FR-008; consistent with deliverables portfolio filters.

## Decision 5: Default and clear behavior

- **Decision**: Initial page load sends **no** filter query params (full list). **Clear all filters** resets UI state to empty strings / empty role selection and refetches without params.
- **Rationale**: Spec assumptions; differs from deliverables (which defaults to last 30 days).
- **Alternatives considered**:
  - Default to “Leaders only” (rejected: not in spec).

## Decision 6: List refresh trigger (web)

- **Decision**: `useEffect` refetches when `accessToken`, debounced `name`, debounced `email`, or `selectedRoles` change. Debounce **300ms** for name/email text fields; **no debounce** for role multi-select changes.
- **Rationale**: Text typing would otherwise spam `GET /users`; role control is discrete.
- **Alternatives considered**:
  - Manual “Search” button only (rejected: poorer UX vs deliverables auto-refetch pattern).
  - Refetch on every keystroke (rejected: unnecessary load).

## Decision 7: Response mapping and performance

- **Decision**: After query builder returns `User[]`, map with existing `mapUserToAuthResponse` per user (same as today). Order by `email ASC` preserved.
- **Rationale**: Minimal change; N+1 role loads acceptable at current scale; can batch-load roles in a follow-up if needed.
- **Alternatives considered**:
  - Single JOIN query returning roles inline (deferred: not required for v1).

## Decision 8: Validation and errors

- **Decision**: Unknown `roles` values → `400` with `VALIDATION_ERROR` and clear message. No max length on name/email for v1 (reasonable trim only).
- **Rationale**: Principle II; prevents injection of arbitrary role strings.

## Decision 9: Contract and API surface

- **Decision**: Document delta in `contracts/admin-users-filters-api.yaml`. Merge query parameters into `specs/004-user-role-profiles/contracts/user-roles-api.yaml` during implementation.
- **Rationale**: Principle IV; extends existing admin list endpoint.

## Decision 10: Test layout

- **Decision**: Backend integration tests in `packages/backend/tests/admin-users-filters/` (name, email, role, AND combo, 400 invalid role, 403 non-admin). Web tests in `packages/web/tests/admin-users-filters/` assert query string on fetch mock and empty states. Feature doc scenarios under `tests/013-admin-users-filters/`.
- **Rationale**: Constitution VI feature-scoped test directories.

## Decision 11: Empty states (web)

- **Decision**: When `users.length === 0` and any filter active → “No users match your filters” + hint to clear. When no filters and empty → optional “No users in the organization” (if org can be empty in test fixtures).
- **Rationale**: Spec FR-010, SC-003.
