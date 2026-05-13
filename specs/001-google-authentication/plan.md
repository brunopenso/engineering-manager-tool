# Implementation Plan: Google-only Authentication

**Branch**: `001-google-authentication` | **Date**: 2026-05-13 | **Spec**: /specs/001-google-authentication/spec.md
**Input**: Feature specification from `/specs/001-google-authentication/spec.md`

## Summary

Refactor the existing Lerna web and backend workspaces to implement Google-only authentication with welcome-page redirect, authenticated access for all non-login web pages, public operational healthcheck endpoints, persistent user lifecycle tracking, and successful-login auditing.

## Technical Context

**Language/Version**: TypeScript (Node.js >=24 backend, React 19 frontend)  
**Primary Dependencies**: Fastify, TypeORM, pg, dotenv, React, Vite  
**Storage**: PostgreSQL via TypeORM with migrations under `database/migrations`  
**Testing**: Backend integration tests for auth and migration behavior; web route and auth flow verification (Vitest + React Testing Library)  
**Target Platform**: Linux-hosted Node backend and browser-based React SPA  
**Project Type**: Monorepo web application (Lerna workspaces for backend and web)  
**Performance Goals**: No regression to current healthcheck responsiveness; authentication and redirects complete within standard interactive web expectations  
**Constraints**: Google is the only login method; non-login web pages require authentication; healthcheck endpoints remain publicly accessible for operations; user-visible error messages must be detailed by failure cause without leaking sensitive internals  
**Scale/Scope**: Initial rollout for one backend service and one web client with hundreds of users and ongoing login audit growth

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Principle I (Type-Safe Monorepo Ownership): PASS. Design keeps existing package boundaries and TypeScript-first implementation.
- Principle II (Security-First Authentication and Data Handling): PASS with constraint. Detailed user-facing error messages are allowed only as controlled error categories (invalid, expired, issuer/audience mismatch) and must avoid sensitive internals.
- Principle III (Migration-Backed Data Integrity): PASS. User and login-audit persistence changes are migration-backed and entity-aligned.
- Principle IV (API and UX Contract Fidelity): PASS. Contract and quickstart artifacts align with clarified redirect, access, and healthcheck exception behavior.
- Principle V (Incremental Delivery with Verifiable Outcomes): PASS. Story-based breakdown remains independently deliverable and measurable.

Post-Phase-1 Re-check: PASS. No constitutional violations remain.

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

**Structure Decision**: Keep the existing Lerna workspace layout and implement authentication by adding backend auth modules/routes/entities and frontend auth-state/pages/routing, without introducing new top-level services.

## Complexity Tracking

No constitutional violations requiring justification.
