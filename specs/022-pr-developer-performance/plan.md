# Implementation Plan: PR Developer Performance

**Branch**: `022-pr-developer-performance` | **Date**: 2026-08-12 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/022-pr-developer-performance/spec.md`

## Summary

Deliver a leader-only **Team PR Performance** screen at `/app/leader/team-pr-performance` so managers can understand developer contribution from imported GitHub pull request data. The page reuses the Team Deliverables / Team Analytics filter bar (default last **60** days, optional hierarchical team member picker) and shows: summary cards (authored PRs, comments, reviews), a per-developer comparison + detail table, a weekly authored-PRs-by-classification stacked chart (team-wide or selected member; includes **Unclassified**), and row drill-down to contributing PRs. Backend adds a leader-scoped aggregated `GET /users/leader/team-pr-performance` plus a drill-down list endpoint; server-side DAC and SQL aggregations over existing PR/comment/review tables—**no schema migration**.

## Technical Context

**Language/Version**: TypeScript (Node.js 26 backend, React 19 frontend)  
**Primary Dependencies**: Fastify 5, TypeORM, PostgreSQL (`pg`), React Router 7, Vite 8, Material UI 6, existing `@mui/x-charts`, `react-i18next`, `frontend-design` skill  
**Storage**: PostgreSQL — existing `github_imported_pull_requests`, `github_pull_request_comments`, `github_pull_request_reviews`, `users`; **no new migration**  
**Testing**: Vitest; feature docs under `tests/022-pr-developer-performance/`; package tests under `packages/backend/tests/022-pr-developer-performance/` and `packages/web/tests/022-pr-developer-performance/`  
**Target Platform**: Linux-hosted backend + browser SPA  
**Project Type**: Monorepo web application (`packages/backend`, `packages/web`)  
**Performance Goals**: Initial load and filter refresh within ~5 seconds for teams up to ~50 reports with typical imported PR volumes (SC-001); one aggregate fetch per filter change; drill-down on demand  
**Constraints**: Leader-only route/API; descendant subtree only (exclude actor); optional `userId` via `assertUserInLeaderSubtree`; PR date axis = `merged_at` (inclusive UTC day bounds via `validateDateRange`); effective classification = `user_reclassification` else `classification_type` else Unclassified; i18n `en-US`/`pt-BR`; no hard-coded UI strings  
**Scale/Scope**: Two new API operations, one leader page (+ filter/summary/chart/table/modal components), one nav entry, i18n keys under `shell` + `leader`, no schema change

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Principle I (Type-Safe Monorepo Ownership): **PASS**. Backend service + routes + DTO types; web page, API client, components; OpenAPI in `contracts/team-pr-performance-api.yaml`.
- Principle II (Security-First Authentication, Authorization, and Data Handling): **PASS**. Bearer auth; leader role guard; optional `userId` validated with `assertUserInLeaderSubtree`; aggregates scoped to descendant GitHub logins only.
- Principle III (Migration-Backed Data Integrity): **PASS**. Read-only over existing imported PR tables; no schema change.
- Principle IV (API and UX Contract Fidelity): **PASS**. Contract matches FR-001–FR-018 and clarify session (team vs member chart; Unclassified).
- Principle V (Incremental Delivery with Verifiable Outcomes): **PASS**. Stories: access → filters → summaries/comparison → detail table → weekly classification chart.
- Principle VI (Mandatory Automated Testing): **PASS**. Feature-scoped test docs and package tests defined in quickstart (DAC, aggregations, UI, i18n parity).
- Principle VII (Hierarchical Data Access Control): **PASS**. Subtree-only developers; peers/superiors/other branches denied; leader excluded from aggregates (descendant set excludes self).
- Principle VIII (Consistent Frontend Design Standards): **PASS**. `LeaderTeamPrPerformancePage` uses `frontend-design` skill with Material UI filter bar, cards, charts, table, modal.
- Principle IX (Internationalized User Interface): **PASS**. `shell` menu key + `leader.teamPrPerformance.*` (or equivalent) for `en-US`/`pt-BR`; key-parity tests.

**Post-Phase-1 Re-check**: **PASS**. Server-side aggregation prevents client-side leakage of out-of-subtree PR metrics; drill-down endpoint re-checks subtree membership; no migration required.

## Project Structure

### Documentation (this feature)

```text
specs/022-pr-developer-performance/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── team-pr-performance-api.yaml
└── tasks.md                                    # created by /speckit-tasks
```

### Source Code (repository root)

```text
packages/
├── backend/
│   └── src/
│       ├── routes/
│       │   └── users.ts                        # + GET team-pr-performance (+ drill-down)
│       ├── services/
│       │   ├── leaderPrPerformanceService.ts   # aggregations + week/classification buckets
│       │   ├── teamDeliverablesDate.ts         # reuse validateDateRange
│       │   └── userService.ts                  # reuse fetchLeaderDescendantRows, assertUserInLeaderSubtree
│       └── types/
│           └── leaderPrPerformance.ts          # response DTOs
├── web/
│   └── src/
│       ├── pages/
│       │   └── LeaderTeamPrPerformancePage.tsx
│       ├── components/
│       │   └── leader-pr-performance/
│       │       ├── TeamPrPerformanceFilters.tsx
│       │       ├── TeamPrPerformanceSummaryCards.tsx
│       │       ├── DeveloperPrComparisonChart.tsx
│       │       ├── WeeklyAuthoredByClassificationChart.tsx
│       │       ├── DeveloperPrPerformanceTable.tsx
│       │       └── DeveloperPrDrilldownModal.tsx
│       ├── services/
│       │   └── leaderPrPerformanceApi.ts
│       ├── routes/
│       │   └── shellOptions.ts                 # LEADER_TEAM_PR_PERFORMANCE_ROUTE + menu
│       ├── App.tsx                             # LeaderRoute registration
│       └── locales/
│           ├── en-US/
│           │   ├── shell.json                  # menu.teamPrPerformance
│           │   └── leader.json                 # teamPrPerformance.*
│           └── pt-BR/
│               ├── shell.json
│               └── leader.json
tests/
└── 022-pr-developer-performance/
    ├── screen-access.us1.test.md
    ├── filters.us2.test.md
    ├── summaries-comparison.us3.test.md
    ├── detail-table.us4.test.md
    └── chart-prs-by-classification.us5.test.md
packages/backend/tests/022-pr-developer-performance/
packages/web/tests/022-pr-developer-performance/
```

**Structure Decision**: Mirror Team Analytics (016) for leader route/DAC/date helpers and My Pull Requests (020) for PR date (`merged_at`), classification effectiveness, and chart UX. Put aggregations in a dedicated `leaderPrPerformanceService.ts` rather than overloading `githubPrQueryService` (self-only my-activity) or `leaderAnalyticsService` (deliverables). Reuse `TeamMemberHierarchyPicker` + `fetchLeaderHierarchyView` and `defaultLast60DayRange()`.

## Complexity Tracking

| Item                                         | Why Needed                                                                 | Simpler Alternative Rejected Because                                                         |
| -------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Dedicated aggregated leader PR performance API | Team-scale metrics + weekly classification need DAC-safe server rollups   | Client aggregation of raw my-activity-like payloads over-fetches and risks leakage           |
| Separate drill-down endpoint                 | Keeps primary payload small; loads contributing PRs only when leader drills | Embedding all PR bodies in the aggregate response is heavy for 60-day subtree views          |
| Unclassified series                          | Clarify session: week totals must equal authored volume                    | Dropping null classifications understates volume; inventing a typed class lies to managers |

No constitutional violations requiring justification.

## End-to-End Regression Notes

- Leader sees **Team PR Performance** in Leader menu; non-leader denied route and API.
- Page loads with last **60** days, no member selected; cards, comparison/table, and weekly classification chart populate for full subtree.
- Selecting/clearing team member and changing dates refreshes all widgets together; invalid range blocked.
- Weekly chart: authored-only stacks by classification including Unclassified; team-wide vs single-member per clarify A.
- Table default order: authored count desc, then display name; drill-down shows that developer’s contributing PRs only.
- Existing Team Analytics, Team Deliverables, My Pull Requests, and PR import/reclassify unchanged.
