# Quickstart: PR Developer Performance

## Preconditions

- Node.js 26 and PostgreSQL configured (see `AGENTS.md` / `doc/getting-started.md`).
- Branch: `022-pr-developer-performance`.
- Existing tables from 018–020: `github_imported_pull_requests`, `github_pull_request_comments`, `github_pull_request_reviews`, `users.github_login`.
- Leader test user with descendant reports who have linked GitHub logins and imported PRs across multiple weeks/classifications (including at least one PR with null effective classification for Unclassified).

## 1. Backend

In `packages/backend`:

- Add `packages/backend/src/types/leaderPrPerformance.ts` (DTOs matching [contracts/team-pr-performance-api.yaml](./contracts/team-pr-performance-api.yaml)).
- Add `packages/backend/src/services/leaderPrPerformanceService.ts`:
  - `getLeaderTeamPrPerformance(actorUserId, { startDate, endDate, userId? })`
  - `getLeaderDeveloperPrDrilldown(actorUserId, developerUserId, { startDate, endDate })`
  - Resolve developers via `fetchLeaderDescendantRows` / `assertUserInLeaderSubtree`
  - `validateDateRange` on `merged_at`
  - Aggregate authored / comments / reviews; weekly authored by effective classification (+ `unclassified`)
  - Build `weekStarts[]` for range
- Register routes in `packages/backend/src/routes/users.ts` with leader role guard:
  - `GET /users/leader/team-pr-performance`
  - `GET /users/leader/team-pr-performance/developers/:userId/pull-requests`
- Tests: `packages/backend/tests/022-pr-developer-performance/` (DAC, date 400, aggregations, Unclassified, empty subtree, optional userId, drill-down).

## 2. Frontend

In `packages/web`:

- Reuse `defaultLast60DayRange()` / date validation from `packages/web/src/utils/dateRange.ts`.
- Add `packages/web/src/services/leaderPrPerformanceApi.ts` → fetch aggregate + drill-down.
- Add `LeaderTeamPrPerformancePage` + components under `components/leader-pr-performance/` (filters, summary cards, comparison chart, weekly classification chart, table, drill-down modal).
- Reuse `TeamMemberHierarchyPicker` + `fetchLeaderHierarchyView` (same as Team Analytics).
- Register route in `App.tsx` under `LeaderRoute`; add menu entry in `shellOptions.ts`.
- i18n: `menu.teamPrPerformance` in `shell.json`; screen keys under `leader.teamPrPerformance.*` in `en-US`/`pt-BR` `leader.json` (classification labels including Unclassified).
- Implement with `frontend-design` skill + Material UI / existing `@mui/x-charts`.

## 3. Feature test docs

Create under `tests/022-pr-developer-performance/`:

- `screen-access.us1.test.md`
- `filters.us2.test.md`
- `summaries-comparison.us3.test.md`
- `detail-table.us4.test.md`
- `chart-prs-by-classification.us5.test.md`

Mirror automated coverage in `packages/web/tests/022-pr-developer-performance/` (including i18n key parity).

## 4. Run / validate

```bash
npm install
npm run db:migration:run --workspace @em-tool/backend   # no new migrations expected
npm run dev
```

Manual checks:

1. Leader opens **Team PR Performance** — default last 60 days, subtree totals + weekly classification chart.
2. Select a team member — all widgets scope to that person; clear — return to team-wide.
3. Confirm Unclassified segment appears when a PR has no effective classification; week segment sum equals authored count.
4. Open a table row — drill-down lists that developer’s contributing PRs only.
5. Non-leader — menu hidden; direct URL denied; API 403.
6. Switch locale `en-US` / `pt-BR` — no hard-coded strings; key parity.

Automated:

```bash
npm run test --workspace @em-tool/backend -- tests/022-pr-developer-performance
npm run test --workspace @em-tool/web -- tests/022-pr-developer-performance
npm run lint
```

## 5. Contract reference

See [data-model.md](./data-model.md) and [contracts/team-pr-performance-api.yaml](./contracts/team-pr-performance-api.yaml) for response shapes and DAC rules.
