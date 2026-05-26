# Research: Leader User Creation

## Decision 1: Reuse existing user creation endpoint namespace with leader-only authorization

- **Decision**: Implement this feature as a protected `POST /users` flow with explicit leader role check in backend authorization/service layer.
- **Rationale**: Keeps user lifecycle operations in one bounded context and minimizes API surface area while satisfying FR-001/FR-005.
- **Alternatives considered**:
  - Add separate endpoint like `/leaders/users`: rejected due to duplicate domain behavior and higher maintenance overhead.

## Decision 2: Enforce creator-as-leader assignment server-side only

- **Decision**: Ignore/reject any client-provided leader identifier and always set the created user's `leaderId` (or equivalent relation) to authenticated creator user id.
- **Rationale**: Guarantees FR-003/FR-004 even if frontend is bypassed or payload is tampered.
- **Alternatives considered**:
  - Frontend-only assignment: rejected because it is bypassable.
  - Allow optional override for admins: rejected because out of scope and conflicts with requested behavior.

## Decision 3: Keep frontend leader field non-editable and informative

- **Decision**: Build a dedicated leader-only create page that displays "Leader assigned automatically to you" instead of a leader selector.
- **Rationale**: Prevents user confusion and aligns UX with immutable assignment rule (User Story 3).
- **Alternatives considered**:
  - Show disabled leader picker: acceptable but creates unnecessary UI complexity.

## Decision 4: Capture auditable creator metadata at creation time

- **Decision**: Persist `createdByUserId` metadata (or equivalent audit event) for user creation if not already available in existing audit mechanisms.
- **Rationale**: Satisfies FR-007 and enables traceability for compliance and debugging.
- **Alternatives considered**:
  - Rely only on generic logs: rejected because logs may not be durable/queryable enough for product-level audit trails.

## Decision 5: Validate deny paths at route and API contract level

- **Decision**: Return explicit authorization error for non-leaders at both page guard and API call boundaries; do not leak additional user details.
- **Rationale**: Meets FR-005 and Constitution Principle II for secure explicit authorization boundaries.
- **Alternatives considered**:
  - Hide menu only without backend deny: rejected because security cannot rely on UI visibility.

## Decision 6: Add focused automated tests per story

- **Decision**: Add backend integration tests for leader allow/non-leader deny/tampered payload plus web tests for route visibility and successful creation flow.
- **Rationale**: Satisfies Principle VI and ensures all acceptance criteria are verifiable.
- **Alternatives considered**:
  - Manual verification only: rejected by constitution.
