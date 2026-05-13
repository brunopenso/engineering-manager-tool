# Implementation Plan: Google-only Authentication

**Branch**: `001-google-authentication` | **Date**: 2026-05-13 | **Spec**: /specs/001-google-authentication/spec.md
**Input**: Feature specification from `/specs/001-google-authentication/spec.md`

## Summary

Add Google-only authentication to the existing Lerna monorepo by refactoring both web and backend workspaces: implement Google token login, redirect successful logins to a welcome page, enforce login-page-only public access, persist users, and record successful login audits.

## Technical Context

**Language/Version**: TypeScript (Node.js >=24 backend, React 19 frontend)  
**Primary Dependencies**: Fastify, TypeORM, pg, dotenv, React, Vite  
**Storage**: PostgreSQL via TypeORM + SQL migrations in `database/migrations`  
**Testing**: Backend integration tests for auth flows and migration outcomes; web route-guard/auth-flow tests (Vitest + React Testing Library introduced for this feature)  
**Target Platform**: Linux-hosted Node backend + browser-based React SPA
**Project Type**: Monorepo web application (frontend + backend workspaces)  
**Performance Goals**: p95 login request processing under 500ms excluding Google network latency; no regression to healthcheck responsiveness  
**Constraints**: Login page is the only public page; non-login pages require authentication; keep existing healthcheck endpoints publicly reachable for ops; preserve Lerna workspace boundaries  
**Scale/Scope**: Initial release scope for one backend service and one web client, expected hundreds of users and daily authentication events

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Constitution file at `.specify/memory/constitution.md` is currently a template with placeholder principles and no enforceable gates.
- Pre-Phase-0 Gate Result: PASS (no active constitutional constraints to violate).
- Post-Phase-1 Re-check: PASS (design remains within existing monorepo architecture and clarified scope).

## Project Structure

### Documentation (this feature)

```text
specs/001-google-authentication/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── auth-api.yaml
└── tasks.md
```

### Source Code (repository root)

```text
database/
└── migrations/

packages/
├── backend/
│   ├── scripts/
│   │   ├── migration-create.ts
│   │   ├── migration-run.ts
│   │   └── migration-rollback.ts
│   └── src/
│       ├── index.ts
│       ├── database/
│       │   ├── connection.ts
│       │   ├── ormconfig.ts
│       │   └── entities/
│       └── routes/
│           └── healthcheck.ts
└── web/
    └── src/
        ├── main.tsx
        └── App.tsx
```

**Structure Decision**: Keep the existing Lerna workspaces and implement auth by adding focused modules/routes/entities inside `packages/backend` and route/view/auth-state logic inside `packages/web`; no new top-level packages are required.

## Complexity Tracking

No constitution violations requiring justification at this stage.
