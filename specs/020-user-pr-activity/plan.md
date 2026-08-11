# Implementation Plan: User Pull Request Activity

**Branch**: `020-user-pr-activity` | **Date**: 2026-08-11 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/020-user-pr-activity/spec.md`

## Summary

Deliver a personal **My Pull Requests** screen at `/app/my-pull-requests` where an authenticated user views imported GitHub PR activity they authored or were involved in (comment/review). The page provides period and repository filters, a weekly authored-PR chart, comment and review count cards, a data table (repository, PR date, owner vs involved), and a detail modal. Backend adds a **self-only** `POST /github-pull-requests/my-activity` endpoint (existing authored-only `/query` is insufficient for involvement). Frontend reuses `@mui/x-charts`, shared 60-day date helpers, MUI table/dialog patterns, and `en-US`/`pt-BR` i18n. No schema migration.

## Technical Context

**Language/Version**: TypeScript (Node.js 26 backend, React 19 frontend)  
**Primary Dependencies**: Fastify 5, TypeORM, PostgreSQL (`pg`), React Router 7, Vite 8, Material UI 6, existing `@mui/x-charts`, `react-i18next`, `frontend-design` skill  
**Storage**: PostgreSQL — existing imported PR / comment / review tables from 018/019; **no new migration**  
**Testing**: Vitest; feature docs under `tests/020-user-pr-activity/`; package tests under `packages/backend/tests/020-user-pr-activity/` and `packages/web/tests/020-user-pr-activity/`  
**Target Platform**: Linux-hosted backend + browser SPA  
**Project Type**: Monorepo web application (`packages/backend`, `packages/web`)  
**Performance Goals**: Initial load and filter refresh within ~5 seconds for typical personal PR volumes (SC-001); one activity fetch per period change; repository filter client-side  
**Constraints**: Self-only DAC on this screen (FR-014); default last 60 days; PR date = `mergedAt`; involved PRs only exist if imported via author-based import of a collaborator; no hard-coded UI strings  
**Scale/Scope**: One new API operation, one page (+ chart/cards/table/modal components), one nav entry, one i18n namespace, no schema change

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Principle I (Type-Safe Monorepo Ownership): **PASS**. Backend route/service/DTO types; web page, API client, components; OpenAPI in `contracts/user-pr-activity-api.yaml`.
- Principle II (Security-First Authentication, Authorization, and Data Handling): **PASS**. Bearer auth required; login resolved server-side from session user id; no client-supplied target login on my-activity.
- Principle III (Migration-Backed Data Integrity): **PASS**. Read-only over existing imported PR entities; no schema change.
- Principle IV (API and UX Contract Fidelity): **PASS**. Contract matches FR-001–FR-014; screen behavior aligned with spec acceptance scenarios.
- Principle V (Incremental Delivery with Verifiable Outcomes): **PASS**. Stories: access → filters → summaries → table/modal.
- Principle VI (Mandatory Automated Testing): **PASS**. Feature-scoped test docs and package tests listed in quickstart.
- Principle VII (Hierarchical Data Access Control): **PASS**. This screen is **self-only** (stricter than self+descendants). Peers, superiors, and subordinates’ activity are denied on this surface. Existing hierarchical `/query` remains unchanged for other consumers.
- Principle VIII (Consistent Frontend Design Standards): **PASS**. `MyPullRequestsPage` uses `frontend-design` skill with Material UI filter bar, chart, cards, table, and modal.
- Principle IX (Internationalized User Interface): **PASS**. `prActivity` + shell menu keys for `en-US` and `pt-BR`; tests for key parity.

**Post-Phase-1 Re-check**: **PASS**. Self-bound my-activity endpoint prevents cross-user login probing on this screen; client aggregates only over authorized self payload; no migration required.

## Project Structure

### Documentation (this feature)

```text
specs/020-user-pr-activity/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── user-pr-activity-api.yaml
└── tasks.md                                    # created by /speckit-tasks
```

### Source Code (repository root)

```text
packages/
├── backend/
│   └── src/
│       ├── routes/
│       │   └── githubPullRequests.ts           # + POST /github-pull-requests/my-activity
│       └── services/
│           └── githubPrQueryService.ts         # + queryMyPullRequestActivity (+ role mapping)
├── web/
│   └── src/
│       ├── pages/
│       │   └── MyPullRequestsPage.tsx
│       ├── components/
│       │   └── my-pull-requests/
│       │       ├── MyPullRequestsFilters.tsx
│       │       ├── AuthoredPrsChart.tsx
│       │       ├── ActivitySummaryCards.tsx
│       │       ├── MyPullRequestsTable.tsx
│       │       └── PullRequestDetailModal.tsx
│       ├── services/
│       │   └── myPullRequestsApi.ts
│       ├── utils/
│       │   └── myPullRequestActivity.ts        # repo options, week series, counts, role helpers
│       ├── routes/
│       │   └── shellOptions.ts                 # MY_PULL_REQUESTS_ROUTE + menu
│       ├── App.tsx                             # route registration
│       ├── i18n/
│       │   └── config.ts                       # register prActivity namespace
│       └── locales/
│           ├── en-US/
│           │   ├── shell.json                  # menu.myPullRequests
│           │   └── prActivity.json
│           └── pt-BR/
│               ├── shell.json
│               └── prActivity.json
tests/
└── 020-user-pr-activity/
    ├── screen-access.us1.test.md
    ├── filters.us2.test.md
    ├── summaries.us3.test.md
    └── table-detail.us4.test.md
packages/backend/tests/020-user-pr-activity/
packages/web/tests/020-user-pr-activity/
```

**Structure Decision**: Extend the existing GitHub PR routes/service rather than inventing a parallel module. Keep aggregation on the web for repository filter and widgets. Place the page under the authenticated app shell (base menu), not leader/admin sections.

## Complexity Tracking

| Item                                    | Why Needed                                                                | Simpler Alternative Rejected Because                                      |
| --------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| New `my-activity` endpoint              | Involvement requires author OR comment OR review match; self-only binding | Reusing `/query` only returns authored PRs and accepts arbitrary logins   |
| Client-side repo filter + chart rollups | Spec allows thin aggregation; keeps API period-scoped and simple          | Server pre-aggregation adds contract complexity without multi-tenant need |

No constitutional violations requiring justification.
