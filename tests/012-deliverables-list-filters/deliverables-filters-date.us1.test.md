# US1: Creation date portfolio filter (backend)

**Automated coverage**: `packages/backend/tests/deliverables/deliverables-list-filters.*.test.ts`, `packages/web/tests/deliverables-portfolio-filters/`

## Scenarios

- Initial load uses last-30-day `startDate`/`endDate` query params; only in-range deliverables returned
- Valid date change triggers new GET with updated bounds
- Invalid range returns 400 / client blocks request with message
- Clear all filters resets to last-30-day default query
