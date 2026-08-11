# US2 — Filter by period and repository

Automated coverage: `packages/web/tests/020-user-pr-activity/activity-filters.us2.test.ts`, `filters.us2.test.tsx`.

## Acceptance

1. Changing start/end dates refreshes activity.
2. Repository options derive from period results; select/clear filters client-side.
3. Invalid ranges (end before start) show validation and keep prior valid results.
4. Empty filtered results show empty states without errors.
