# US2: Optional filters refine all charts

## Automated coverage

- Backend: `packages/backend/tests/leader-analytics/analytics-filters.us2.test.ts`
- Web: `packages/web/tests/leader-analytics/analytics-filters.us2.test.tsx`

## Scenarios

- Optional `userId` query param after subtree check
- Filter change triggers refetch
- Invalid date range blocked client-side
