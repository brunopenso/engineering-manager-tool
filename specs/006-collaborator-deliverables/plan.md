# Implementation Plan: Collaborator Deliverables

**Branch**: `006-collaborator-deliverables` | **Date**: 2026-05-26 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/006-collaborator-deliverables/spec.md`

## Summary

Introduce a persisted **Deliverable** portfolio per user (required metadata, optional user tags/links, system tag references to the existing `tags` catalog) with TypeORM migration, owner-scoped REST API (`/deliverables`, `/users/{userId}/deliverables`), authenticated read-only `GET /tags/catalog` for the system tag picker, and web management UI at `/app/deliverables` plus read-only superior view at `/app/deliverables/view/:userId`. Authorization enforces owner-only mutations and hierarchical read access (peers and upward reads denied; full superior chain read-only) via an injectable org hierarchy resolver with fixture-backed tests until reporting persistence ships.

## Technical Context

**Language/Version**: TypeScript (Node.js >=24 backend, React 19 frontend)  
**Primary Dependencies**: Fastify, TypeORM, pg, React Router, Vite, Material UI (via `frontend-design` skill for deliverables screens)  
**Storage**: PostgreSQL via TypeORM migrations under `packages/backend/database/migrations`  
**Testing**: Backend Vitest integration tests (deliverable CRUD, validation, DAC allow/deny with hierarchy fixtures); Vitest + React Testing Library for deliverables pages  
**Target Platform**: Linux-hosted Node backend and browser SPA  
**Project Type**: Monorepo web application (Lerna workspaces: `packages/backend`, `packages/web`)  
**Performance Goals**: Owner list usable for 50+ deliverables without unacceptable delay (spec SC-004); summary list sorted by `updated_at` DESC  
**Constraints**: Owner-only create/update/delete; hierarchical read per clarified spec; system tags must reference existing catalog tags; business impact enum fixed; hierarchy resolver deferred with test fixtures  
**Scale/Scope**: Four tables + junction, six API path groups (including tag catalog read), two web routes, one shell menu entry; extends `authorizationService` and existing `Tag` entity

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Principle I (Type-Safe Monorepo Ownership): **PASS**. Changes confined to backend/web packages; OpenAPI contract in `contracts/deliverables-api.yaml`.
- Principle II (Security-First Authentication, Authorization, and Data Handling): **PASS**. Bearer auth on all routes; explicit owner checks for mutations; DAC helper for reads; stable error codes; no cross-user leakage on deny.
- Principle III (Migration-Backed Data Integrity): **PASS**. `deliverables` + child/junction tables via migration with FKs to `users` and `tags`.
- Principle IV (API and UX Contract Fidelity): **PASS**. Contract aligned with spec FRs, clarified hierarchy rules, and web routes.
- Principle V (Incremental Delivery with Verifiable Outcomes): **PASS**. User stories map to create/list → update → delete → superior read slices with independent tests.
- Principle VI (Mandatory Automated Testing): **PASS**. Integration and UI tests planned for all FR-critical paths, validation, and DAC matrix.
- Principle VII (Hierarchical Data Access Control): **PASS with scoped deferral**. Read access = self + descendants from actor's perspective (equivalent to owner's superior chain reading down). Peer and upward reads denied. Recursive cases covered by fixtures until org hierarchy persistence ships (documented in research Decision 8).
- Principle VIII (Consistent Frontend Design Standards): **PASS**. `DeliverablesPage` and superior read view require `frontend-design` skill with Material UI.

**Post-Phase-1 Re-check**: **PASS**. Research resolves schema, API surface, tag catalog read for collaborators, DAC extension point, and UI routes without unjustified violations.

## Project Structure

### Documentation (this feature)

```text
specs/006-collaborator-deliverables/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── deliverables-api.yaml
└── tasks.md              # Phase 2 — created by /speckit-tasks
```

### Source Code (repository root)

```text
packages/
├── backend/
│   ├── database/migrations/
│   │   └── *-AddDeliverables.ts
│   └── src/
│       ├── auth/
│       │   └── types.ts                         # error codes (e.g. INVALID_SYSTEM_TAG)
│       ├── database/entities/
│       │   ├── Deliverable.ts
│       │   ├── DeliverableSystemTag.ts
│       │   ├── DeliverableUserTag.ts
│       │   └── DeliverableLink.ts
│       ├── routes/
│       │   ├── deliverables.ts                  # CRUD + user list
│       │   └── tags.ts                          # + GET /tags/catalog
│       ├── services/
│       │   ├── authorizationService.ts          # canReadDeliverablesForOwner + resolver
│       │   ├── deliverableService.ts
│       │   ├── deliverableValidation.ts
│       │   └── organizationalHierarchy.ts       # resolver interface + test hook
│       ├── index.ts
│       └── __tests__/
│           ├── deliverables-create.us1.test.ts
│           ├── deliverables-list.us2.test.ts
│           ├── deliverables-update.us3.test.ts
│           ├── deliverables-delete.us4.test.ts
│           ├── deliverables-dac.us5.test.ts
│           └── deliverables-validation.test.ts
└── web/
    └── src/
        ├── pages/
        │   ├── DeliverablesPage.tsx
        │   └── DeliverablesViewPage.tsx         # read-only superior portfolio
        ├── routes/
        │   └── shellOptions.ts                  # DELIVERABLES_ROUTE + menu
        ├── services/
        │   ├── deliverablesApi.ts
        │   └── tagsApi.ts                       # fetchCatalog()
        ├── App.tsx
        └── __tests__/
            ├── deliverables.us1-us2.test.tsx
            ├── deliverables-mutations.us3-us4.test.tsx
            └── deliverables-dac.us5.test.tsx
```

**Structure Decision**: Implement within the existing Lerna monorepo. Backend owns persistence, validation, and DAC; web owns owner management UX and read-only superior portfolio view consuming `contracts/deliverables-api.yaml`.

## Complexity Tracking

| Item                        | Why Needed                                     | Simpler Alternative Rejected Because                                             |
| --------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------- |
| Hierarchy resolver deferral | Org reporting table not shipped yet            | Hard-coding leader role only violates clarified spec (position-based visibility) |
| `GET /tags/catalog`         | Collaborators need catalog IDs for system tags | Opening admin `GET /tags` would break administrator-only management contract     |

No other constitutional violations requiring justification.

## End-to-End Regression Notes

- Verify collaborator completes create → list → edit → delete on `/app/deliverables`.
- Verify `GET /tags/catalog` works for collaborator; `POST /tags` still forbidden for non-admin.
- Verify peer cannot access `/users/{peerId}/deliverables` (403).
- Verify superior fixture allows read on subordinate portfolio; subordinate cannot read superior.
- Verify superior cannot PATCH/DELETE subordinate deliverable (403).
- Verify invalid/removed system tag IDs rejected on save with clear message.
- Verify deliverable list remains responsive with seeded 50+ rows (SC-004 smoke).
