# Quickstart: Deliverables Portfolio Filters

## Preconditions

- Node.js 24+ and PostgreSQL configured.
- Branch: `012-deliverables-list-filters`.
- Clarifications applied: **backend filtering**, **default last 30 days** on load and after clear.

## 1. Backend

In `packages/backend`:

- Add `DeliverableListFilters` type (`startDate`, `endDate`, `businessImpacts?`, `systemTagIds?`).
- Extend `listDeliverablesForOwner(ownerUserId, filters)`:
  - Default dates to last 30 days when omitted.
  - `created_at` between UTC start/end of range (`validateDateRange` from `teamDeliverablesDate.ts`).
  - Optional `business_impact IN (...)`.
  - Optional tag join / `IN` for `systemTagIds` (OR).
- Update `GET /deliverables` in `routes/deliverables.ts` to parse query params and return `400` on invalid range/tags.
- Add `createdAt` to `DeliverableSummaryDto` / `mapDeliverableSummary`.
- Tests: `packages/backend/tests/deliverables/deliverables-list-filters.*.test.ts` (default 30d, date bounds, impact, tags, AND combination, 400 cases).

## 2. Frontend

In `packages/web`:

- Extend `listMyDeliverables(accessToken, filters)` to append query string.
- Update `DeliverablesPage.tsx`:
  - Initialize dates with `defaultLast30DayRange()`.
  - Filter bar: dates, impact multi-select, tag multi-select (`fetchTagCatalog`).
  - `useEffect` refetch when filters change (valid date range).
  - **Clear all filters** → reset to last 30 days + clear impact/tags → refetch.
  - Distinct empty states (no matches vs no deliverables yet).
- Share `defaultLast30DayRange` / `isValidDateRange` via `utils/dateRange.ts` (import from `teamDeliverablesApi` re-exports).

## 3. Contract

- `specs/012-deliverables-list-filters/contracts/deliverables-list-filters-api.yaml` (v0.2).
- Merge query params into `specs/006-collaborator-deliverables/contracts/deliverables-api.yaml` during implementation.

## 4. Verify

```bash
npm run test
npm run lint
```

Manual: load `/app/deliverables` (30-day default), change filters, clear all, confirm network requests include query params and server returns filtered rows only.

## 5. Out of scope

- Client-side filtering of full portfolio download.
- Team Deliverables screen changes.
