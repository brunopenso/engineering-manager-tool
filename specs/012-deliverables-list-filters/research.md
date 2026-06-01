# Research: Deliverables Portfolio Filters

## Decision 1: Filtering execution location (supersedes prior client-side decision)

- **Decision**: Apply all filters **server-side** on `GET /deliverables` via query parameters: `startDate`, `endDate`, optional `businessImpact` (repeatable or comma-separated), optional `systemTagIds` (repeatable or comma-separated). Extend `listDeliverablesForOwner` (or dedicated query function) with TypeORM `Where` / query builder on `created_at`, `business_impact`, and tag join.
- **Rationale**: Clarification session 2026-06-01 — user requires backend filtering; aligns with Team Deliverables search pattern and FR-014.
- **Alternatives considered**:
  - Client-side filter on full list (rejected by clarification).

## Decision 2: Default date range

- **Decision**: On screen load and after **Clear all filters**, use **last 30 days** ending today (`defaultLast30DayRange()` shared with Team Deliverables). UI date inputs pre-filled; initial API call includes those dates. Server applies default last-30-day bounds when dates omitted (defensive) but client always sends explicit range after load.
- **Rationale**: Clarification session 2026-06-01; consistent with `010-leader-team-deliverables`.
- **Alternatives considered**:
  - No default / full history on load (rejected by clarification).
  - Hard cap never showing older than 30 days even if user widens range (rejected: user can still change pickers to request wider range).

## Decision 3: Creation date boundary semantics

- **Decision**: Filter `deliverables.created_at` using **UTC inclusive day bounds** via existing `validateDateRange` / `toUtcStartOfDay` / `toUtcEndOfDay` from `teamDeliverablesDate.ts` (same as team deliverables date handling, applied to `created_at` instead of `updated_at`).
- **Rationale**: Single server-side interpretation; testable; avoids client/server timezone drift for filtered API results.
- **Alternatives considered**:
  - Browser-local day boundaries on server (rejected: server cannot know client TZ without extra parameter).

## Decision 4: List refresh trigger

- **Decision**: `useEffect` (or equivalent) calls `listMyDeliverables(accessToken, filters)` when `startDate`, `endDate`, `selectedImpacts`, or `selectedTagIds` change and date range is valid; abort in-flight requests on change.
- **Rationale**: Matches Team Deliverables auto-search pattern; FR-003–FR-010.
- **Alternatives considered**:
  - Manual Search button only (rejected: poorer UX vs auto-refresh on filter change).

## Decision 5: Impact and system tag filter semantics

- **Decision**: Unchanged: OR within impact, OR within tags, AND across dimensions — all enforced in SQL/query builder.
- **Rationale**: Spec FR-007, FR-009, FR-010.

## Decision 6: Contract and API surface

- **Decision**: Extend `GET /deliverables` with optional query params documented in `contracts/deliverables-list-filters-api.yaml`. Return `400` with clear message on invalid date range or invalid tag ids. `DeliverableSummary` includes `createdAt` for table display.
- **Rationale**: Principle IV; clarification requires server filtering.

## Decision 7: Test layout

- **Decision**: Backend filter tests in `packages/backend/tests/deliverables/deliverables-list-filters.*.test.ts`; web page tests mock API with filter query assertions; feature markdown under `tests/012-deliverables-list-filters/`. Remove standalone `deliverablePortfolioFilters.ts` pure client filter module (server owns filter logic; optional small query-string builder util in web only).
