# Implementation Plan: Administrator Tag Management

**Branch**: `005-admin-tags` | **Date**: 2026-05-25 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/005-admin-tags/spec.md`

## Summary

Introduce a persisted **Tag** catalog (identifier, name, color) with TypeORM migration and administrator-only REST API (`/tags`), plus a dedicated web management screen at `/app/admin/tags` using existing `AdminRoute` and `assertAdministrator` guards. Automated tests cover CRUD, validation, duplicate names, and authorization denials. Tag assignment to users or work items remains out of scope for v1.

## Technical Context

**Language/Version**: TypeScript (Node.js >=24 backend, React 19 frontend)  
**Primary Dependencies**: Fastify, TypeORM, pg, React Router, Vite, Material UI (via `frontend-design` skill for tag management screen)  
**Storage**: PostgreSQL via TypeORM migration under `packages/backend/database/migrations`  
**Testing**: Backend Vitest integration tests (tags routes, service validation, admin guards); Vitest + React Testing Library for admin tags page and route guard  
**Target Platform**: Linux-hosted Node backend and browser SPA  
**Project Type**: Monorepo web application (Lerna workspaces: `packages/backend`, `packages/web`)  
**Performance Goals**: Full catalog list usable for hundreds of tags without perceptible delay on management screen (spec SC-005 / edge case)  
**Constraints**: Administrator-only CRUD; unique case-insensitive names; color `#RRGGBB` only; hard delete; no tag-to-entity assignments in v1  
**Scale/Scope**: One new table, four API operations, one admin web route and menu entry; reuses existing role infrastructure from user role profiles

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Principle I (Type-Safe Monorepo Ownership): **PASS**. Changes confined to existing backend/web packages; OpenAPI contract in feature artifacts.
- Principle II (Security-First Authentication, Authorization, and Data Handling): **PASS**. Bearer auth + `assertAdministrator` on all tag routes; stable error codes; no sensitive leakage.
- Principle III (Migration-Backed Data Integrity): **PASS**. `tags` table via migration with unique name constraint and entity alignment.
- Principle IV (API and UX Contract Fidelity): **PASS**. `contracts/tags-api.yaml` aligned with spec FRs and web route behavior.
- Principle V (Incremental Delivery with Verifiable Outcomes): **PASS**. User stories map to list/create → update → delete slices with independent tests.
- Principle VI (Mandatory Automated Testing): **PASS**. Integration and UI tests planned for all FR-critical paths and negative authorization cases.
- Principle VII (Hierarchical Data Access Control): **N/A — PASS by scope**. Tags are global admin configuration, not collaborator organizational data; no peer/superior subtree visibility. Administrator vs non-administrator matrix only (documented in spec and data-model).
- Principle VIII (Consistent Frontend Design Standards): **PASS**. `AdminTagsPage` requires `frontend-design` skill with Material UI (color swatch, forms, confirmation dialog).

**Post-Phase-1 Re-check**: **PASS**. Research resolves storage, validation, authorization reuse, routing, and DAC N/A without unjustified violations.

## Project Structure

### Documentation (this feature)

```text
specs/005-admin-tags/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── tags-api.yaml
└── tasks.md              # Phase 2 — created by /speckit-tasks
```

### Source Code (repository root)

```text
packages/
├── backend/
│   ├── database/migrations/
│   │   └── *-AddTags.ts
│   └── src/
│       ├── auth/
│       │   └── types.ts                    # DUPLICATE_TAG_NAME error code
│       ├── database/entities/
│       │   └── Tag.ts                      # new
│       ├── routes/
│       │   └── tags.ts                     # new — GET/POST/PATCH/DELETE
│       ├── services/
│       │   └── tagService.ts               # new — validation + CRUD
│       ├── index.ts                        # register tag routes
│       └── __tests__/
│           ├── tags-crud.us1-us2.test.ts
│           ├── tags-validation.us1.test.ts
│           └── tags-forbidden.us2.test.ts
└── web/
    └── src/
        ├── pages/
        │   └── AdminTagsPage.tsx           # new — management screen
        ├── routes/
        │   └── shellOptions.ts             # ADMIN_TAGS_ROUTE + menu
        ├── services/
        │   └── tagsApi.ts                  # new
        ├── App.tsx                         # /app/admin/tags route
        └── __tests__/
            ├── admin-tags.us1-us2.test.tsx
            └── admin-tags-forbidden.us2.test.tsx
```

**Structure Decision**: Implement within the existing Lerna monorepo; no new packages. Backend owns persistence and administrator authorization; web owns the dedicated management UX consuming `contracts/tags-api.yaml`.

## Complexity Tracking

No constitutional violations requiring justification.

## End-to-End Regression Notes

- Verify administrator can complete CRUD in `/app/admin/tags` without page reload issues.
- Verify collaborator-only users are redirected away from `/app/admin/tags` and receive `403` on `/tags` API calls.
- Verify duplicate names (`Platform` vs `platform`) are rejected consistently in create and update flows.
- Verify invalid colors are rejected server-side and surfaced in UI error messaging.
