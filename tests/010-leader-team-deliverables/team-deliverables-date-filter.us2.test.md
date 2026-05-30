# Leader Team Deliverables — Date Filter (US2)

Maps to spec User Story 2.

## Scenarios

- Initial load shows start/end dates preset to last 30 days (rolling).
- Deliverables outside range excluded; inside range included.
- Changing date range with member selected re-runs search.
- Invalid range (end before start) shows error and does not search.
- Boundary-day deliverable included.

## Automated coverage

- `packages/web/tests/team-deliverables/team-deliverables-date-filter.us2.test.tsx`
- `packages/backend/tests/team-deliverables/team-deliverables-date-filter.us2.test.ts`
