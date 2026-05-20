# Implementation Plan: Authenticated Application Shell

**Branch**: `004-pre-spec-setup` | **Date**: 2026-05-20 | **Spec**: /specs/003-authenticated-app-shell/spec.md
**Input**: Feature specification from `/specs/003-authenticated-app-shell/spec.md`

## Summary

Evolve the existing authenticated web experience into a reusable application shell with `/` and `/login` as the same public login entry, `/app` as the fixed post-login default route, no `/app/welcome` route, a fixed top banner, default-collapsed left navigation, route-driven menu options, inline two-step logout confirmation from the user identity area, and strict redirect behavior for invalid session identity data.

## Technical Context

**Language/Version**: TypeScript (Node.js >=24 backend, React 19 frontend)  
**Primary Dependencies**: React, React Router, Vite, Fastify auth endpoints already in place  
**Storage**: Existing PostgreSQL-backed user/session identity source via backend auth APIs (no new persistence required for shell behavior)  
**Testing**: Vitest + React Testing Library for web route and interaction tests, plus backend integration tests for auth/session edge responses  
**Target Platform**: Browser-based SPA served from Linux-hosted Node backend APIs  
**Project Type**: Monorepo web application (Lerna workspaces for backend and web)  
**Performance Goals**: Removed from this feature scope per clarification decision (A1).  
**Constraints**: Login remains required for all shell routes, menu starts collapsed and auto-collapses after option selection, logout uses inline two-step confirmation, missing email in authenticated identity forces login redirect  
**Scale/Scope**: One web client shell experience with initial finite menu routes and future growth to additional menu options/views

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Principle I (Type-Safe Monorepo Ownership): PASS. Scope remains in existing `packages/web` and aligned backend auth/session boundaries.
- Principle II (Security-First Authentication, Authorization, and Data Handling): PASS. Protected routes remain authenticated; missing identity data redirects to login; logout and session behaviors avoid exposing sensitive internals.
- Principle III (Migration-Backed Data Integrity): PASS. No schema change required; existing migration-backed auth data model remains authoritative.
- Principle IV (API and UX Contract Fidelity): PASS. Plan artifacts define route, shell layout, and interaction contract behavior aligned with clarified spec.
- Principle V (Incremental Delivery with Verifiable Outcomes): PASS. User stories are independently testable with explicit automated coverage expectations.
- Principle VI (Mandatory Automated Testing): PASS. Plan includes route guards, menu interactions, and logout flow tests.
- Principle VII (Hierarchical Data Access Control): PASS (Not in scope). Feature only surfaces self identity email; no collaborator hierarchy exposure.

Post-Phase-1 Re-check: PASS. No constitutional violations remain after design artifacts.

## Project Structure

### Documentation (this feature)

```text
specs/003-authenticated-app-shell/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── app-shell-routes.yaml
└── tasks.md
```

### Source Code (repository root)

```text
packages/
├── web/
│   └── src/
│       ├── App.tsx
│       ├── auth/
│       │   ├── AuthProvider.tsx
│       │   └── ProtectedRoute.tsx
│       ├── components/
│       │   └── shell/                # new shell layout and menu components
│       ├── pages/
│       │   └── LoginPage.tsx
│       └── routes/                   # new route map for shell options
└── backend/
    └── src/
        └── routes/
            └── auth.ts               # existing auth/me response contract source
```

**Structure Decision**: Keep implementation within existing monorepo workspaces, introducing web-only shell UI modules and route mapping while reusing current backend authentication endpoints and session payload contracts. Public login routes are `/` and `/login`; protected shell routes begin at `/app`.

## Complexity Tracking

No constitutional violations requiring justification.
