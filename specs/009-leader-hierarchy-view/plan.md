# Implementation Plan: Leader Hierarchy View

**Branch**: `009-leader-hierarchy-view` | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/009-leader-hierarchy-view/spec.md`

## Summary

Deliver a leader-only, read-only organizational hierarchy screen that shows the logged-in leader’s direct manager (at most one level up), their position, and their full reporting subtree. Backend exposes a scoped hierarchy payload with server-side filtering; frontend renders a collapsible tree with names (email fallback), current-position emphasis, and initial expand state limited to the leader’s node. This is separate from feature `008` hierarchy management (orphan assignment).

## Technical Context

**Language/Version**: TypeScript (Node.js >=24 backend, React 19 frontend)  
**Primary Dependencies**: Fastify 5, TypeORM, PostgreSQL (`pg`), React Router 7, Vite 8, Material UI 6 (`frontend-design` skill), `@mui/x-tree-view` (new, aligned with MUI 6.4)  
**Storage**: PostgreSQL via existing `users` table (`leader_id`, `full_name`, `email`); no new tables required  
**Testing**: Vitest (backend + web), feature tests under `tests/009-leader-hierarchy-view/` and package-scoped tests in `packages/backend/tests/hierarchy-view/` and `packages/web/tests/hierarchy-view/`  
**Target Platform**: Linux-hosted backend + browser SPA  
**Project Type**: Monorepo web application (`packages/backend`, `packages/web`)  
**Performance Goals**: Hierarchy view interactive within 3 seconds for subtrees up to 200 people (SC-005); single API round-trip for tree load  
**Constraints**: Leader-only; read-only (no assignment actions); max one superior visible; full descendant subtree; name display with email fallback  
**Scale/Scope**: One new route/page, one GET API, shared types, navigation entry, automated DAC and UI interaction tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Principle I (Type-Safe Monorepo Ownership): **PASS**. Changes stay in existing backend/web packages with shared DTO types.
- Principle II (Security-First Authentication, Authorization, and Data Handling): **PASS**. Server-side leader guard on hierarchy-view endpoint; scoped query never returns out-of-subtree users.
- Principle III (Migration-Backed Data Integrity): **PASS**. No schema changes; uses existing `leader_id` relationships.
- Principle IV (API and UX Contract Fidelity): **PASS**. OpenAPI contract and quickstart align with spec FR-001–FR-009.
- Principle V (Incremental Delivery with Verifiable Outcomes): **PASS**. Stories map to independent tests (tree display, interaction, access deny).
- Principle VI (Mandatory Automated Testing): **PASS**. Feature test directory and package tests defined in quickstart.
- Principle VII (Hierarchical Data Access Control): **PASS WITH DOCUMENTED EXCEPTION** (see Complexity Tracking). Product spec requires direct-manager visibility (one level up); all other superior/peer/branch access remains denied.
- Principle VIII (Consistent Frontend Design Standards): **PASS**. New page requires `frontend-design` skill and Material UI patterns.

**Post-Phase-1 Re-check**: **PASS**. Contract and data model enforce scoped visibility at API boundary; UI does not expose edit actions.

## Project Structure

### Documentation (this feature)

```text
specs/009-leader-hierarchy-view/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── hierarchy-view-api.yaml
└── tasks.md                                    # created by /speckit-tasks
```

### Source Code (repository root)

```text
packages/
├── backend/
│   └── src/
│       ├── routes/
│       │   └── users.ts                        # GET /users/leader/hierarchy-view
│       ├── services/
│       │   ├── authorizationService.ts         # reuse assertLeaderForHierarchyManagement
│       │   └── userService.ts                  # getLeaderHierarchyView(actorUserId)
│       ├── types/
│       │   └── hierarchyView.ts                # DTOs for tree response
│       └── __tests__/
│           └── hierarchy-view.test.ts
├── web/
│   └── src/
│       ├── pages/
│       │   └── LeaderHierarchyViewPage.tsx     # read-only tree UI
│       ├── components/hierarchy/
│       │   └── HierarchyTree.tsx               # collapsible tree + current-position styling
│       ├── services/
│       │   └── usersApi.ts                     # fetchLeaderHierarchyView()
│       ├── routes/
│       │   └── shellOptions.ts                 # LEADER_HIERARCHY_VIEW_ROUTE + nav label
│       └── App.tsx                             # route + LeaderRoute guard
tests/
└── 009-leader-hierarchy-view/
    ├── hierarchy-tree-display.test.md
    ├── hierarchy-tree-interaction.test.md
    └── hierarchy-view-access-control.test.md
packages/backend/tests/hierarchy-view/
packages/web/tests/hierarchy-view/
```

**Structure Decision**: Extend existing `users` routes and `userService` rather than a new module; keep management (`/app/leader/hierarchy`) and view (`/app/leader/hierarchy/view`) as separate routes and API operations.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Principle VII: limited superior visibility (direct manager only) | Explicit product requirement in spec FR-002 and stakeholder input for “1 level above” context | Strict downward-only model would hide the leader’s direct manager and fail acceptance scenarios for leaders who report to someone else |
| New dependency `@mui/x-tree-view` | Accessible tree expand/collapse semantics (keyboard, ARIA) for nested subtree | Hand-rolled nested lists are harder to make accessible and to keep expand-one-layer behavior consistent |

**Exception bounds**: API returns at most one `manager` object; never walks `manager.leaderId`. Descendants loaded only where `leader_id` chain originates from actor. Tests must prove second-level managers and peer branches are absent from payload and UI.
