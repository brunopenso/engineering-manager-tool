# Research: Leader Analytics Charts

## Decision 1: Single aggregated analytics endpoint

- **Decision**: Add `GET /users/leader/team-analytics?startDate={YYYY-MM-DD}&endDate={YYYY-MM-DD}&userId={uuid?}` returning impact buckets, engagement buckets, `pendingReviewCount`, and `weekStarts[]` for axis zero-fill in one response.
- **Rationale**: Spec FR-006 requires all charts refresh together; SC-002 targets sub-3s refresh—one round-trip minimizes latency and simplifies abort-on-filter-change logic.
- **Alternatives considered**:
  - Three endpoints per chart (rejected: triple fetch, harder to keep filter context consistent).
  - Client aggregation from `team-deliverables` list (rejected: requires per-member searches, wrong date axis, over-fetches).

## Decision 2: Date and week semantics

- **Decision**: Filter deliverables with **`created_at`** using inclusive UTC calendar-day bounds via existing `validateDateRange` / `toUtcStartOfDay` / `toUtcEndOfDay` from `teamDeliverablesDate.ts`. Bucket weeks with PostgreSQL `date_trunc('week', created_at)` (Monday-based week start in UTC, consistent with PG default).
- **Rationale**: Spec Assumptions and FR-009/FR-010/FR-012 mandate creation date; aligns with deliverables list filters (012).
- **Alternatives considered**:
  - `updated_at` for all charts (rejected: contradicts spec; Team Deliverables uses `updated_at` for table only).
  - Client-side week math (rejected: timezone/week boundary bugs).

## Decision 3: Owner scope and DAC

- **Decision**: When `userId` omitted, aggregate over all `fetchLeaderDescendantRows(actor)` IDs (actor already excluded from descendants). When `userId` present, `assertUserInLeaderSubtree(actor, userId)` then scope to that owner only. Never include actor's own deliverables in subtree-wide engagement (descendant list excludes self).
- **Rationale**: Matches spec FR-008, FR-016 and existing `getLeaderTeamMembers` / CTE patterns (010).
- **Alternatives considered**:
  - Include leader's own deliverables in team totals (rejected: inconsistent with team picker scope).

## Decision 4: Pending review count query

- **Decision**: `pendingReviewCount` = count of in-scope deliverables (`created_at` in range, owner in scope) where no `deliverable_reviews` row exists for `(reviewer_user_id = actor, deliverable_id)` OR row has `reviewed = false` (if delete-on-false pattern: count absent row only).
- **Rationale**: FR-011/FR-012; reuses `deliverable_reviews` from 010 without migration.
- **Alternatives considered**:
  - Use `updated_at` to match Team Deliverables table (rejected for primary implementation: contradicts FR-012; document delta for SC-004 manual validation).

**SC-004 note**: Team Deliverables filters by `updated_at`; analytics pending review uses `created_at`. Acceptance tests for SC-004 should compare analytics count to an independent query on `created_at` + reviewed join, not raw Team Deliverables row count unless product later aligns date axes.

## Decision 5: Charting library

- **Decision**: Add **`@mui/x-charts`** (latest stable compatible with `@mui/material` ^6.4) for `BarChart` / `LineChart` and theme integration via existing MUI theme provider.
- **Rationale**: User-requested library; fits constitution VIII MUI stack; accessible legends and responsive sizing on resize.
- **Alternatives considered**:
  - Recharts / Chart.js (rejected: new design system divergence from MUI).
  - Raw SVG (rejected: high effort for stacked weekly series).

## Decision 6: Resizable widget layout

- **Decision**: Add **`react-grid-layout`** wrapping each chart in a `Paper` panel; persist layout JSON in `sessionStorage` under key `em-tool:leader-analytics-layout:v1` on layout change; restore on mount.
- **Rationale**: FR-013/FR-014; spec excludes cross-session DB persistence for v1.
- **Alternatives considered**:
  - `@mui/x-data-grid` layout (rejected: not designed for dashboard tiles).
  - CSS-only responsive grid without resize (rejected: fails FR-013).

## Decision 7: Team member picker and hierarchy data

- **Decision**: Reuse `TeamMemberHierarchyPicker` + `fetchLeaderHierarchyView` (same as `LeaderTeamDeliverablesPage`); optional empty `selectedUserId` means no query param.
- **Rationale**: Spec FR-003 requires same UX/scope as Team Deliverables; avoids second team-members API shape on this page.
- **Alternatives considered**:
  - `fetchTeamMembers` flat list only (rejected: spec calls for same hierarchical picker component).

## Decision 8: Default date range helper

- **Decision**: Add `defaultLast60DayRange()` in `packages/web/src/utils/dateRange.ts` (`today - 59 days` through `today`, UTC), mirroring `defaultLast30DayRange`.
- **Rationale**: FR-004; shared utility keeps Team Deliverables on 30 days unchanged.
- **Alternatives considered**:
  - Reuse 30-day default (rejected: spec says 60).

## Decision 9: Engagement chart visualization

- **Decision**: Subtree-wide view: MUI X **grouped `BarChart`** with one bar group per week and one series per team member (cap legend: show top N active users by total adds if >12 members—document in tasks if needed). Single-member filter: single-series weekly bars.
- **Rationale**: Spec FR-010 requires distinguishable per-person weekly counts; grouped bars compare members within a week.
- **Alternatives considered**:
  - Multi-line chart only (acceptable fallback in implementation if bar clutter too high for large teams).

## Decision 10: Route and navigation

- **Decision**: Route `/app/leader/team-analytics`; shell label **Team Analytics**; `LeaderRoute` guard; menu entry appended to `LEADER_SHELL_MENU_OPTIONS`.
- **Rationale**: Consistent with `/app/leader/team-deliverables`.

## Decision 11: Impact chart visualization

- **Decision**: Stacked vertical `BarChart`: x-axis = week labels from `weekStarts`, series = four impact levels (LOW, MEDIUM, HIGH, TRANSFORMATIONAL), zero-filled server-side or client-side from sparse aggregation rows.
- **Rationale**: Spec US3: separate counts per impact per week; stacked bars show total volume and composition.
