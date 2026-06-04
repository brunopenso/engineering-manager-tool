# Quickstart: Leader Analytics Charts

## Preconditions

- Node.js 24+ and PostgreSQL configured.
- Branch: `016-leader-analytics-charts`.
- Existing tables: `deliverables`, `deliverable_reviews`, `users` (from 006, 010).
- Leader test user with descendant reports and sample deliverables across multiple weeks/impacts.

## 1. Dependencies (web)

In `packages/web`:

```bash
npm install @mui/x-charts react-grid-layout --workspace @em-tool/web
npm install -D @types/react-grid-layout --workspace @em-tool/web
```

Verify peer compatibility with `@mui/material` ^6.4 and run `npm run lint --workspace @em-tool/web`.

## 2. Backend

In `packages/backend`:

- Add `packages/backend/src/types/leaderAnalytics.ts` (DTOs matching contract).
- Add `packages/backend/src/services/leaderAnalyticsService.ts`:
  - `getLeaderTeamAnalytics(actorUserId, { startDate, endDate, userId? })`
  - Resolve owner IDs via `fetchLeaderDescendantRows` or single `userId` + `assertUserInLeaderSubtree`
  - `validateDateRange` on `created_at`
  - SQL aggregations: impact by week+impact, engagement by week+user, pending review count
  - Build `weekStarts[]` for range
- Register `GET /users/leader/team-analytics` in `packages/backend/src/routes/users.ts` with leader role guard.
- Tests: `packages/backend/tests/leader-analytics/` (DAC, date 400, aggregations, empty subtree, optional userId).

## 3. Frontend

In `packages/web`:

- Add `defaultLast60DayRange()` to `packages/web/src/utils/dateRange.ts`; re-export from `leaderAnalyticsApi.ts` if needed.
- Add `packages/web/src/services/leaderAnalyticsApi.ts` → `fetchTeamAnalytics(accessToken, { startDate, endDate, userId? })`.
- Add components under `packages/web/src/components/leader-analytics/`:
  - `AnalyticsWidgetGrid.tsx` — `react-grid-layout` + sessionStorage
  - `DeliverablesByImpactChart.tsx` — MUI X stacked `BarChart`
  - `EngagementByUserChart.tsx` — MUI X grouped `BarChart`
  - `PendingReviewWidget.tsx` — prominent count + label
- Add `packages/web/src/pages/LeaderTeamAnalyticsPage.tsx`:
  - Filter bar: `TeamMemberHierarchyPicker`, start/end dates (default 60 days)
  - `useEffect` fetch on valid filter change; abort stale requests
  - `LeaderRoute` access via parent route
- Update `packages/web/src/routes/shellOptions.ts`: `LEADER_TEAM_ANALYTICS_ROUTE`, menu **Team Analytics**
- Update `packages/web/src/App.tsx`: route `leader/team-analytics`
- Tests: `packages/web/tests/leader-analytics/` (menu visibility, default range, chart refresh, layout sessionStorage).

## 4. Feature test docs

Under `tests/016-leader-analytics-charts/`, add markdown test specs referenced in `spec.md` (US1–US6).

## 5. Verify

```bash
npm run test --workspace @em-tool/backend -- --run leader-analytics
npm run test --workspace @em-tool/web -- --run leader-analytics
npm run lint
```

Manual:

1. Log in as leader → Leader → **Team Analytics**.
2. Confirm default last 60 days and three widgets load without selecting a member.
3. Select a report → all widgets refresh.
4. Change dates → refresh; invalid range shows warning, no fetch.
5. Resize a widget, navigate away, return → layout restored (same session).
6. Mark a deliverable reviewed on Team Deliverables → pending count decreases when filters align on `created_at`.

## 6. Out of scope (v1)

- Cross-session layout persistence in DB/profile.
- Export / drill-down to deliverable detail from charts.
- New migrations or changes to Team Deliverables date axis (`updated_at`).
