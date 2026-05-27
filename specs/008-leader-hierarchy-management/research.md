# Research: Leader Hierarchy Management

## Decision 1: Search strategy for orphan users

- **Decision**: Support name/email search with case-insensitive partial matching over users where leader is null.
- **Rationale**: Matches clarified requirement exactly and provides practical discoverability for leaders without requiring exact values.
- **Alternatives considered**:
  - Exact-match only search (rejected: poor usability and conflicts with clarification).
  - Email-only search (rejected: does not satisfy name search requirement).

## Decision 2: Assignment authorization boundary

- **Decision**: Enforce leader-only authorization server-side for both listing/searching orphan users and assignment actions.
- **Rationale**: Prevents bypass via direct API calls and aligns with security and hierarchical access constitution principles.
- **Alternatives considered**:
  - Frontend-only guard (rejected: insufficient security control).
  - Shared permission inferred from any authenticated user (rejected: violates leader-only scope).

## Decision 3: Concurrency handling for assignment

- **Decision**: Validate orphan status at write time and reject assignment if the user already gained a leader between search and submit.
- **Rationale**: Handles race conditions safely and preserves single-source leader integrity.
- **Alternatives considered**:
  - Trust search-time eligibility only (rejected: stale eligibility creates integrity risk).
  - Last-write-wins overwrite (rejected: can silently steal hierarchy ownership).

## Decision 4: Audit event approach

- **Decision**: Record one assignment audit event per successful assignment, including actor, target user, previous leader state, new leader state, and timestamp.
- **Rationale**: Supports traceability and incident analysis while staying minimal for this scope.
- **Alternatives considered**:
  - No explicit audit event (rejected: weak operational traceability).
  - Full generic change-history subsystem in this feature (rejected: over-scoped for current delivery).

## Decision 5: Transfer leadership scope

- **Decision**: Exclude transfer-leadership behavior from this feature.
- **Rationale**: User clarification explicitly removed this requirement; keeping scope tight lowers delivery risk.
- **Alternatives considered**:
  - Keep transfer as optional stretch goal (rejected: contradicts clarified scope).
