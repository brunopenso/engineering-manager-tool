# Implementation Plan: Leader Analytics Charts

**Branch**: `016-leader-analytics-charts` | **Date**: 2026-06-04 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/016-leader-analytics-charts/spec.md`

## Summary

Deliver a leader-only **Team Analytics** dashboard at `/app/leader/team-analytics` with optional hierarchical team member picker (same as Team Deliverables), a changeable date range defaulting to **last 60 days**, and three resizable chart widgets: deliverables added per week by business impact, engagement (adds per week per person), and pending review count. Backend adds one aggregated `GET /users/leader/team-analytics` endpoint (leader role + subtree DAC, `created_at` bounds, optional `userId`) returning week buckets and counts in a single round-trip. Frontend adds `@mui/x-charts` for visualization, `react-grid-layout` for resizable widgets, session-persisted layout state, shell navigation, and `LeaderTeamAnalyticsPage`.

## Technical Context

**Language/Version**: TypeScript (Node.js >=24 backend, React 19 frontend)  
**Primary Dependencies**: Fastify 5, TypeORM, PostgreSQL (`pg`), React Router 7, Vite 8, Material UI 6, **`@mui/x-charts`** (charts), **`react-grid-layout`** (resizable widget grid), `frontend-design` skill  
**Storage**: PostgreSQL — existing `deliverables`, `users`, `deliverable_reviews`; **no new migration**  
**Testing**: Vitest; feature docs under `tests/016-leader-analytics-charts/`; package tests under `packages/backend/tests/leader-analytics/` and `packages/web/tests/leader-analytics/`  
**Target Platform**: Linux-hosted backend + browser SPA  
**Project Type**: Monorepo web application (`packages/backend`, `packages/web`)  
**Performance Goals**: Initial load and filter refresh within 3–5 seconds for teams up to ~50 reports (SC-001, SC-002); one API call per filter change  
**Constraints**: Leader-only route and API; subtree-only data (`fetchLeaderDescendantRows` / `assertUserInLeaderSubtree`); exclude actor from owner aggregates; filter on **`created_at`** inclusive UTC day bounds (`validateDateRange`); optional `userId`; reviewed state per logged-in leader; widget layout in **sessionStorage** only (v1)  
**Scale/Scope**: One new API operation, one page, three chart components + layout wrapper, one nav entry, shared DTO types, no schema change

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Principle I (Type-Safe Monorepo Ownership): **PASS**. Backend service + route + types; web page, API client, chart components; OpenAPI contract in `contracts/team-analytics-api.yaml`.
- Principle II (Security-First Authentication, Authorization, and Data Handling): **PASS**. Bearer auth; leader role guard; optional `userId` validated with `assertUserInLeaderSubtree`; aggregates scoped to descendant owner IDs only.
- Principle III (Migration-Backed Data Integrity): **PASS**. Read-only analytics over existing tables; reviewed semantics unchanged.
- Principle IV (API and UX Contract Fidelity): **PASS**. Contract matches spec FR-001–FR-016; menu label **Team Analytics**; default 60-day range.
- Principle V (Incremental Delivery with Verifiable Outcomes): **PASS**. User stories map to access → filters → impact chart → engagement → pending review → layout.
- Principle VI (Mandatory Automated Testing): **PASS**. Feature test directory and package tests defined in quickstart for DAC, date bounds, aggregations, and UI refresh.
- Principle VII (Hierarchical Data Access Control): **PASS**. Subtree-only owners; peers/superiors/other branches denied; leader excluded from engagement owner set.
- Principle VIII (Consistent Frontend Design Standards): **PASS**. `LeaderTeamAnalyticsPage` uses `frontend-design` skill with Material UI filter bar and MUI X chart theming.

**Post-Phase-1 Re-check**: **PASS**. Single authorized analytics endpoint; server-side aggregation prevents client-side leakage; chart data limited to authorized subtree.

## Project Structure

### Documentation (this feature)

```text
specs/016-leader-analytics-charts/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── team-analytics-api.yaml
└── tasks.md                                    # created by /speckit-tasks
```

### Source Code (repository root)

```text
packages/
├── backend/
│   └── src/
│       ├── routes/
│       │   └── users.ts                        # + GET /users/leader/team-analytics
│       ├── services/
│       │   ├── leaderAnalyticsService.ts       # aggregations + week buckets
│       │   ├── teamDeliverablesDate.ts         # reuse validateDateRange
│       │   └── userService.ts                  # reuse fetchLeaderDescendantRows, assertUserInLeaderSubtree
│       ├── types/
│       │   └── leaderAnalytics.ts              # response DTOs
│       └── tests/ or tests/leader-analytics/   # vitest integration tests
├── web/
│   └── src/
│       ├── pages/
│       │   └── LeaderTeamAnalyticsPage.tsx
│       ├── components/
│       │   └── leader-analytics/
│       │       ├── AnalyticsWidgetGrid.tsx     # react-grid-layout + sessionStorage
│       │       ├── DeliverablesByImpactChart.tsx
│       │       ├── EngagementByUserChart.tsx
│       │       └── PendingReviewWidget.tsx
│       ├── services/
│       │   └── leaderAnalyticsApi.ts
│       ├── utils/
│       │   └── dateRange.ts                    # + defaultLast60DayRange()
│       └── routes/
│           └── shellOptions.ts                 # LEADER_TEAM_ANALYTICS_ROUTE + menu
tests/
└── 016-leader-analytics-charts/
    ├── analytics-access.us1.test.md
    ├── analytics-filters.us2.test.md
    ├── chart-deliverables-by-impact.us3.test.md
    ├── chart-engagement-by-user.us4.test.md
    ├── chart-pending-review.us5.test.md
    └── widget-layout.us6.test.md
packages/backend/tests/leader-analytics/
packages/web/tests/leader-analytics/
```

**Structure Decision**: Extend `users.ts` leader routes (alongside `team-members` and `team-deliverables`). Centralize SQL aggregations in `leaderAnalyticsService.ts` to keep route thin. Reuse hierarchy picker and `fetchLeaderHierarchyView` on the page (same as `LeaderTeamDeliverablesPage`) rather than duplicating picker data loading.

## Complexity Tracking

| Item | Why Needed | Simpler Alternative Rejected Because |
|------|------------|-------------------------------------|
| New npm deps `@mui/x-charts`, `react-grid-layout` | Spec requires chart library and resizable widgets (user request + FR-013) | Hand-rolled SVG/canvas lacks maintainability; fixed grid fails resize/session layout requirements |
| Dedicated analytics endpoint | Three charts share filters; SC-002 needs one refresh round-trip | Three separate endpoints triple latency and complicate in-flight abort logic |
| Server-side weekly aggregation | Correct UTC week buckets and DAC at source | Client-side roll-up of raw deliverables over-fetches and risks leaking out-of-subtree rows |

No constitutional violations requiring justification.

## End-to-End Regression Notes

- Leader sees **Team Analytics** in Leader menu; non-leader denied route and API.
- Page loads with last **60** days, no member selected; all three widgets populated for full subtree.
- Selecting/clearing team member and changing dates refreshes all widgets together.
- Invalid date range blocked before fetch.
- Impact chart: weekly stacks/series by four impact levels; zero weeks visible.
- Engagement chart: per-user weekly series when unfiltered; single user when filtered.
- Pending review count matches server count for `created_at` in range + subtree/member filter (see research note on Team Deliverables `updated_at` delta).
- Widget resize persists after in-app navigation (sessionStorage).
- Existing Team Deliverables, hierarchy, and deliverables CRUD unchanged.
