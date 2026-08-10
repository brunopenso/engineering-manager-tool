# Implementation Plan: Deliverables Portfolio Filters

**Branch**: `012-deliverables-list-filters` | **Date**: 2026-06-01 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/012-deliverables-list-filters/spec.md`

## Summary

Add filter controls to the collaborator **Deliverables** management screen (`/app/deliverables`): creation date range (start/end date pickers), business impact multi-select, and system tag multi-select. **All filtering runs on the backend** via query parameters on `GET /deliverables`. The screen **defaults to the last 30 days** on load and after **Clear all filters** (rolling window ending today). Filters combine with AND across dimensions; impact and tags use OR within each dimension.

## Technical Context

**Language/Version**: TypeScript (Node.js >=24 backend, React 19 frontend)  
**Primary Dependencies**: Fastify 5, TypeORM, PostgreSQL, React Router 7, Vite 8, Material UI 6 (`frontend-design` skill)  
**Storage**: PostgreSQL — existing `deliverables`, `deliverable_system_tags`, `tags`  
**Testing**: Vitest; `tests/012-deliverables-list-filters/`; `packages/backend/tests/deliverables/`; `packages/web/tests/deliverables-portfolio-filters/`  
**Target Platform**: Linux-hosted backend + browser SPA  
**Project Type**: Monorepo web application (`packages/backend`, `packages/web`)  
**Performance Goals**: Filtered list response within 5 seconds under normal conditions (SC-001)  
**Constraints**: Owner-only; `created_at` UTC inclusive day bounds via `teamDeliverablesDate.ts`; default last 30 days; auto-refetch on valid filter change  
**Scale/Scope**: Extend `GET /deliverables` + `listDeliverablesForOwner` query; update `DeliverablesPage`; contract delta; no migration

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Principle I (Type-Safe Monorepo Ownership): **PASS**. Backend service + route + web API client + page.
- Principle II (Security-First): **PASS**. Bearer auth; owner-only query; validate tag ids server-side.
- Principle III (Migration-Backed Data Integrity): **PASS**. No schema change.
- Principle IV (API and UX Contract Fidelity): **PASS**. OpenAPI delta with query params; UI matches clarifications.
- Principle V (Incremental Delivery): **PASS**. Stories: default load → impact → tags → combined reset.
- Principle VI (Mandatory Automated Testing): **PASS**. Backend filter unit/integration tests + web tests.
- Principle VII (Hierarchical DAC): **PASS**. No cross-user list leakage.
- Principle VIII (Frontend Design): **PASS**. `DeliverablesPage` uses `frontend-design` + MUI.

**Post-clarification re-check**: **PASS**. Backend filtering and last-30-day default documented in spec, research, contract, and data model.

## Project Structure

### Documentation (this feature)

```text
specs/012-deliverables-list-filters/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── deliverables-list-filters-api.yaml
└── tasks.md
```

### Source Code (repository root)

```text
packages/
├── backend/
│   └── src/
│       ├── routes/deliverables.ts              # parse query params on GET /deliverables
│       ├── services/deliverableService.ts      # listDeliverablesForOwner(ownerId, filters)
│       └── services/teamDeliverablesDate.ts    # reuse for created_at bounds
├── web/
│   └── src/
│       ├── pages/DeliverablesPage.tsx          # filter bar, default 30d, auto-refetch
│       ├── services/deliverablesApi.ts         # listMyDeliverables(accessToken, filters)
│       └── utils/dateRange.ts                  # defaultLast30DayRange, isValidDateRange (shared)
tests/012-deliverables-list-filters/
packages/backend/tests/deliverables/
    └── deliverables-list-filters.*.test.ts
packages/web/tests/deliverables-portfolio-filters/
```

**Structure Decision**: Server-side filter query on existing list endpoint; reuse Team Deliverables date utilities and default range helper; web sends query params and renders API results only.

## Complexity Tracking

| Item                                | Why Needed                                        | Simpler Alternative Rejected Because |
| ----------------------------------- | ------------------------------------------------- | ------------------------------------ |
| Query params on `GET /deliverables` | Clarification requires backend filtering (FR-014) | Client-side filter rejected by user  |
| Default last 30 days                | Clarification; consistent with Team Deliverables  | Full-history default rejected        |

No constitutional violations.

## Phase 0 & Phase 1 Outputs

- [research.md](./research.md) — updated for server-side filtering and 30-day default
- [data-model.md](./data-model.md) — query parameters and UI defaults
- [contracts/deliverables-list-filters-api.yaml](./contracts/deliverables-list-filters-api.yaml) — v0.2 with query params
- [quickstart.md](./quickstart.md) — updated implementation steps

## End-to-End Regression Notes

- Open `/app/deliverables` — dates show last 30 days; list matches backend filtered response.
- Change dates / impact / tags — new API request each time (valid dates only).
- Invalid date range — error, no misleading list.
- **Clear all filters** — last 30 days + cleared impact/tags.
- Team Deliverables unchanged.
- Existing deliverable CRUD unchanged.
