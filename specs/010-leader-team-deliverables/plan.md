# Implementation Plan: Leader Team Deliverables

**Branch**: `010-leader-team-deliverables` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/010-leader-team-deliverables/spec.md`

## Summary

Deliver a leader-only **Team Deliverables** screen where leaders pick a direct or indirect report, filter by a changeable date range (default last 30 days), and view a read-only table of matching deliverables (title, description, reviewed). Backend adds a flat team-member list endpoint, a filtered search endpoint with date bounds on `updated_at`, per-leader reviewed persistence (`deliverable_reviews` migration), and a reviewed toggle API. Frontend adds filter bar, results table with checkbox toggle, route, and shell navigation under the Leader section.

## Technical Context

**Language/Version**: TypeScript (Node.js >=24 backend, React 19 frontend)  
**Primary Dependencies**: Fastify 5, TypeORM, PostgreSQL (`pg`), React Router 7, Vite 8, Material UI 6 (`frontend-design` skill)  
**Storage**: PostgreSQL — existing `deliverables` + `users.leader_id`; new `deliverable_reviews` table via migration  
**Testing**: Vitest (backend + web); feature docs under `tests/010-leader-team-deliverables/`; package tests under `packages/backend/tests/team-deliverables/` and `packages/web/tests/team-deliverables/`  
**Target Platform**: Linux-hosted backend + browser SPA  
**Project Type**: Monorepo web application (`packages/backend`, `packages/web`)  
**Performance Goals**: Search results within 5 seconds for typical team/date ranges (SC-005); single API round-trip per search; reviewed toggle feels immediate with optimistic UI + server confirm  
**Constraints**: Leader-only screen and APIs; subtree-only team member list (exclude self); read-only deliverable content; reviewed state per reviewer–deliverable pair; date filter on `updated_at` inclusive boundaries  
**Scale/Scope**: One migration, three new API operations, one page, one nav entry, shared DTO types, automated DAC/date/reviewed tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Principle I (Type-Safe Monorepo Ownership): **PASS**. Changes stay in backend/web packages; OpenAPI contract in `contracts/team-deliverables-api.yaml`.
- Principle II (Security-First Authentication, Authorization, and Data Handling): **PASS**. Bearer auth on all routes; leader role guard; subtree membership validated server-side via DB CTE before returning deliverables or accepting reviewed updates.
- Principle III (Migration-Backed Data Integrity): **PASS**. `deliverable_reviews` migration with FKs to `users` and `deliverables`, unique `(deliverable_id, reviewer_user_id)`.
- Principle IV (API and UX Contract Fidelity): **PASS**. Contract aligns with spec FR-001–FR-020 and clarifications (changeable date default 30 days, reviewed toggle).
- Principle V (Incremental Delivery with Verifiable Outcomes): **PASS**. User stories map to search → date filter → reviewed toggle → access control slices with independent tests.
- Principle VI (Mandatory Automated Testing): **PASS**. Feature test directory and package tests defined in quickstart for all FR-critical paths.
- Principle VII (Hierarchical Data Access Control): **PASS**. Team member list and search limited to actor's descendant subtree; peers/superiors/other branches denied; reviewed writable only for authorized deliverables.
- Principle VIII (Consistent Frontend Design Standards): **PASS**. `LeaderTeamDeliverablesPage` requires `frontend-design` skill and Material UI.

**Post-Phase-1 Re-check**: **PASS**. Data model, contract, and subtree validation at API boundary enforce DAC; UI exposes only leader workflow fields.

## Project Structure

### Documentation (this feature)

```text
specs/010-leader-team-deliverables/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── team-deliverables-api.yaml
└── tasks.md                                    # created by /speckit-tasks
```

### Source Code (repository root)

```text
packages/
├── backend/
│   ├── database/migrations/
│   │   └── *-AddDeliverableReviews.ts
│   └── src/
│       ├── database/entities/
│       │   └── DeliverableReview.ts
│       ├── routes/
│       │   ├── deliverables.ts                 # + PUT /deliverables/:id/reviewed
│       │   └── users.ts                        # + GET team-members, GET team-deliverables
│       ├── services/
│       │   ├── deliverableService.ts           # date-filtered list + reviewed join
│       │   ├── deliverableReviewService.ts     # upsert reviewed state
│       │   └── userService.ts                  # getLeaderTeamMembers, assertUserInSubtree
│       ├── types/
│       │   └── teamDeliverables.ts             # DTOs
│       └── __tests__/
│           └── team-deliverables/
├── web/
│   └── src/
│       ├── pages/
│       │   └── LeaderTeamDeliverablesPage.tsx
│       ├── services/
│       │   └── teamDeliverablesApi.ts
│       ├── routes/
│       │   └── shellOptions.ts                 # LEADER_TEAM_DELIVERABLES_ROUTE + nav
│       └── App.tsx                             # route + LeaderRoute guard
tests/
└── 010-leader-team-deliverables/
    ├── team-deliverables-search.us1.test.md
    ├── team-deliverables-date-filter.us2.test.md
    ├── team-deliverables-reviewed.us3.test.md
    └── team-deliverables-access-control.us4.test.md
packages/backend/tests/team-deliverables/
packages/web/tests/team-deliverables/
```

**Structure Decision**: Extend existing `users` and `deliverables` routes rather than a new module; dedicated team-deliverables search endpoint keeps date/reviewed concerns out of the generic owner list API. Subtree checks use the same recursive CTE pattern as `getLeaderHierarchyView`, not the test-only injectable resolver.

## Complexity Tracking

| Item | Why Needed | Simpler Alternative Rejected Because |
|------|------------|--------------------------------------|
| New `deliverable_reviews` table | Per-leader reviewed state must persist independently (FR-013, FR-014) | Client-only or session storage fails cross-session requirement and multi-leader isolation |
| Dedicated `GET /users/leader/team-deliverables` | Combines date filter + reviewed join in one authorized query | Extending `GET /users/:userId/deliverables` with many query params leaks leader-workflow semantics into collaborator API |
| DB subtree validation on team endpoints | Production `organizationalHierarchy` resolver is test-only today | Reusing fixture resolver would deny all superior reads in production despite persisted `leader_id` |

No constitutional violations requiring justification.

## End-to-End Regression Notes

- Verify leader opens Team Deliverables, sees team members (not self), default date range last 30 days, no results until person selected.
- Verify selecting team member loads title/description/reviewed rows; changing person or date range refreshes results.
- Verify invalid date range (end before start) blocked client-side and/or server-side with clear message.
- Verify reviewed toggle persists after reload; second leader sees independent state.
- Verify non-leader denied route and APIs (403).
- Verify out-of-subtree `userId` on search returns 403.
- Verify existing deliverables CRUD and `DeliverablesViewPage` unchanged.
