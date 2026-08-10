# Implementation Plan: Leader User Creation

**Branch**: `007-leader-user-creation` | **Date**: 2026-05-26 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/007-leader-user-creation/spec.md`

## Summary

Add a leader-only user creation flow that enforces creator-as-leader assignment at persistence time. Implement one protected backend creation endpoint and one frontend page/route, with explicit role authorization checks, audit metadata capture, and automated tests for allow/deny and assignment integrity.

## Technical Context

**Language/Version**: TypeScript (Node.js >=24 backend, React 19 frontend)  
**Primary Dependencies**: Fastify, TypeORM, PostgreSQL driver (`pg`), React Router, Vite, Material UI (`frontend-design` skill)  
**Storage**: PostgreSQL via existing TypeORM migrations and `users` table  
**Testing**: Vitest integration tests (backend) and Vitest + React Testing Library (web)  
**Target Platform**: Linux-hosted Node backend and browser SPA  
**Project Type**: Monorepo web application (`packages/backend`, `packages/web`)  
**Performance Goals**: Leader can create a user in under 2 minutes (SC-004); create request completes within existing user-management UX expectations  
**Constraints**: Only leaders may create users; leader relationship is auto-assigned to creator; peer/non-leader creation denied; no leader override in request payload  
**Scale/Scope**: One new create flow (API + screen), authorization checks, audit capture, and regression-safe tests around user creation permissions

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Principle I (Type-Safe Monorepo Ownership): **PASS**. Work remains in TypeScript backend/web packages with explicit contract artifact.
- Principle II (Security-First Authentication, Authorization, and Data Handling): **PASS**. Authentication required on create endpoint; authorization enforced server-side for leader-only create.
- Principle III (Migration-Backed Data Integrity): **PASS**. Any schema extension for audit fields will be delivered via migration.
- Principle IV (API and UX Contract Fidelity): **PASS**. Endpoint and route behavior documented in contract + quickstart.
- Principle V (Incremental Delivery with Verifiable Outcomes): **PASS**. Stories split into leader create, non-leader deny, assignment integrity.
- Principle VI (Mandatory Automated Testing): **PASS**. Backend + web automated coverage required for all acceptance scenarios.
- Principle VII (Hierarchical Data Access Control): **PASS (narrow scope)**. Feature only introduces create action; access is role-gated and does not expose cross-user listing/reporting.
- Principle VIII (Consistent Frontend Design Standards): **PASS**. New screen implementation explicitly requires `frontend-design` skill with Material UI best practices.

**Post-Phase-1 Re-check**: **PASS**. Research/design choices preserve all constitutional constraints without exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/007-leader-user-creation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── leader-user-creation-api.yaml
└── tasks.md              # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
packages/
├── backend/
│   ├── database/migrations/
│   │   └── *-LeaderUserCreationAudit.ts
│   └── src/
│       ├── routes/
│       │   └── users.ts                    # + POST /users leader-only create
│       ├── services/
│       │   ├── authorizationService.ts     # leader permission guard
│       │   └── userService.ts              # create logic + creator-as-leader enforcement
│       ├── database/entities/
│       │   └── User.ts                     # ensure leader linkage and audit fields mapping
│       └── __tests__/
│           ├── users-create-leader.test.ts
│           └── users-create-deny.test.ts
└── web/
    └── src/
        ├── pages/
        │   └── LeaderCreateUserPage.tsx
        ├── services/
        │   └── usersApi.ts                 # create payload wrapper
        ├── routes/
        │   └── shellOptions.ts             # menu entry visibility by role
        ├── App.tsx                         # route registration
        └── __tests__/
            └── leader-create-user-page.test.tsx
```

**Structure Decision**: Keep implementation inside existing monorepo boundaries, with backend route/service enforcement as source of truth and frontend as role-aware entrypoint for leaders only.

## Complexity Tracking

No constitutional violations requiring justification.
