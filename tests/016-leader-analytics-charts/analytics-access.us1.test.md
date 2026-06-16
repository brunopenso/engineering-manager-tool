# US1: Leader opens analytics dashboard

Maps to `spec.md` User Story 1 and `contracts/team-analytics-api.yaml`.

## Automated coverage

- Backend: `packages/backend/tests/leader-analytics/analytics-access.us1.test.ts`
- Web: `packages/web/tests/leader-analytics/analytics-access.us1.test.tsx`

## Scenarios

- Leader menu shows **Team Analytics**
- Non-leader denied route and API
- Default last-60-day range on load
- Initial analytics fetch without team member selection
