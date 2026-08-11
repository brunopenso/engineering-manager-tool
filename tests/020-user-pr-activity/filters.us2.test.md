# US2 — Filter by period and repository

Automated coverage: `packages/web/tests/020-user-pr-activity/activity-filters.us2.test.ts`, `filters.us2.test.tsx`.

## Acceptance

1. Changing start/end dates and clicking **Search** refreshes activity.
2. Repository options derive from period results; select/clear takes effect on **Search**.
3. Invalid ranges (end before start) show validation on Search and keep prior valid results.
4. Empty filtered results show empty states without errors.
5. Filter edits do not apply until Search is clicked (initial page load still runs a default search).
