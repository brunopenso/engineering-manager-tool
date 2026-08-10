# Implementation Plan: Leader Hierarchy Management

**Branch**: `008-leader-hierarchy-management` | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-leader-hierarchy-management/spec.md`

## Summary

Add a leader-only hierarchy management screen focused on assigning orphan users (users with no leader) to the logged-in leader. Deliver backend search/assignment behavior, access controls, auditability for assignment events, and frontend role-guarded UX with name/email partial-match search.

## Technical Context

**Language/Version**: TypeScript (Node.js >=24 backend, React 19 frontend)  
**Primary Dependencies**: Fastify, TypeORM, PostgreSQL (`pg`), React Router, Vite, Material UI (`frontend-design` skill)  
**Storage**: PostgreSQL via existing TypeORM entities/tables (`users`, existing role tables, audit/event table if extended)  
**Testing**: Vitest integration tests (backend), Vitest + React Testing Library (web), plus feature-level test plan under `tests/008-leader-hierarchy-management/`  
**Target Platform**: Linux-hosted backend + browser SPA  
**Project Type**: Monorepo web application (`packages/backend`, `packages/web`)  
**Performance Goals**: Orphan-user search returns results within existing list-view expectations; assignment action completes in under 90 seconds end-to-end for leader workflow (SC-004)  
**Constraints**: Leader-only access; transfer-leadership out of scope; search supports name/email with full or partial matching; only users without leader can be assigned  
**Scale/Scope**: One management screen, one focused backend workflow (search + assign), authorization and audit guarantees, and regression-safe automated tests

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Principle I (Type-Safe Monorepo Ownership): **PASS**. Changes stay within existing TypeScript backend/web boundaries.
- Principle II (Security-First Authentication, Authorization, and Data Handling): **PASS**. Server-side role checks required for search/assign endpoints; no sensitive auth details exposed.
- Principle III (Migration-Backed Data Integrity): **PASS**. Any persistence changes for audit/event capture use migrations.
- Principle IV (API and UX Contract Fidelity): **PASS**. Contract, quickstart, and spec remain aligned to clarified in-scope behavior.
- Principle V (Incremental Delivery with Verifiable Outcomes): **PASS**. Stories are independently testable (assign flow + leader-only guard).
- Principle VI (Mandatory Automated Testing): **PASS**. Feature-specific automated test plan included and required before merge.
- Principle VII (Hierarchical Data Access Control): **PASS**. Scope enforces downward-only assignment entrypoint (orphan users only) and denies non-leader access.
- Principle VIII (Consistent Frontend Design Standards): **PASS**. New screen explicitly requires `frontend-design` skill with Material UI best practices.

**Post-Phase-1 Re-check**: **PASS**. Design artifacts preserve constitutional constraints with no exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/008-leader-hierarchy-management/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── hierarchy-management-api.yaml
└── tasks.md
```

### Source Code (repository root)

```text
packages/
├── backend/
│   └── src/
│       ├── routes/
│       │   └── users.ts                    # leader-only orphan-user search + assignment action
│       ├── services/
│       │   ├── authorizationService.ts     # enforce leader role checks
│       │   └── userService.ts              # search + assign rules (orphan-only)
│       ├── database/entities/
│       │   └── User.ts                     # leader relationship updates for assignment
│       └── __tests__/
│           ├── hierarchy-assign.test.ts
│           └── hierarchy-access-deny.test.ts
└── web/
    └── src/
        ├── pages/
        │   └── LeaderHierarchyManagementPage.tsx
        ├── services/
        │   └── usersApi.ts                 # orphan search + assignment calls
        ├── routes/
        │   └── shellOptions.ts             # leader-only navigation visibility
        ├── App.tsx                         # route registration + guards
        └── __tests__/
            └── leader-hierarchy-management-page.test.tsx
```

**Structure Decision**: Keep implementation within the current monorepo services, with backend authorization as the source of truth and frontend route/page acting as role-aware orchestration for search and assignment.

## Complexity Tracking

No constitutional violations requiring justification.
