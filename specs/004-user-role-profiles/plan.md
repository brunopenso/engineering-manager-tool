# Implementation Plan: User Role Profiles

**Branch**: `006-user-role-profiles` | **Date**: 2026-05-25 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/004-user-role-profiles/spec.md`

## Summary

Extend the existing `User` identity model with concurrent roles (`COLLABORATOR` default, optional `LEADER` and `ADMINISTRATOR`), expose roles in authentication responses and session context, provide administrator-only APIs and UI to grant/revoke elevated roles with audit history, and add authorization primitives that honor the full role set—including constitution-aligned DAC rules for leaders once organizational hierarchy data exists.

## Technical Context

**Language/Version**: TypeScript (Node.js >=24 backend, React 19 frontend)  
**Primary Dependencies**: Fastify, TypeORM, pg, React Router, Vite, Material UI (via `frontend-design` skill for new screens)  
**Storage**: PostgreSQL via TypeORM migrations under `packages/backend/database/migrations`  
**Testing**: Backend integration tests (auth, roles, admin routes, audit); Vitest + React Testing Library for profile and admin UI  
**Target Platform**: Linux-hosted Node backend and browser SPA  
**Project Type**: Monorepo web application (Lerna workspaces: `packages/backend`, `packages/web`)  
**Performance Goals**: Role resolution adds negligible overhead to authenticated requests; admin role change visible on target user's next profile load (SC-002)  
**Constraints**: Collaborator is mandatory and non-revocable; only administrators manage `LEADER`/`ADMINISTRATOR`; Google-only auth unchanged; hierarchical org data may be deferred but DAC tests and `hasRole('LEADER')` gates are required  
**Scale/Scope**: Extends existing user table and auth flows; two new web routes (`/app/profile`, `/app/admin/users`); three new backend endpoints plus auth payload changes

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Principle I (Type-Safe Monorepo Ownership): **PASS**. Changes stay in existing backend/web packages with shared contract artifact.
- Principle II (Security-First Authentication, Authorization, and Data Handling): **PASS**. Server-side role resolution, explicit `requireAdministrator` on management routes, stable error codes without leaking internals.
- Principle III (Migration-Backed Data Integrity): **PASS**. `user_roles` and `role_assignment_events` delivered via migrations with entity alignment and backfill.
- Principle IV (API and UX Contract Fidelity): **PASS**. `contracts/user-roles-api.yaml` defines auth profile and admin endpoints aligned with spec FRs.
- Principle V (Incremental Delivery with Verifiable Outcomes): **PASS**. User stories map to independently testable slices (default collaborator → profile view → admin management → authorization).
- Principle VI (Mandatory Automated Testing): **PASS**. Plan includes integration and UI tests for all stories and FR-critical paths.
- Principle VII (Hierarchical Data Access Control): **PASS with scoped deferral**. Access matrix and `hasRole('LEADER')` enforcement are designed; recursive descendant data tests use fixtures until org hierarchy ships (documented in research Decision 8).
- Principle VIII (Consistent Frontend Design Standards): **PASS**. Profile and admin screens require `frontend-design` skill.

**Post-Phase-1 Re-check**: **PASS**. Research resolves storage, session freshness, audit, bootstrap admin, and DAC deferral without unjustified violations.

## Project Structure

### Documentation (this feature)

```text
specs/004-user-role-profiles/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── user-roles-api.yaml
└── tasks.md              # Phase 2 — created by /speckit-tasks
```

### Source Code (repository root)

```text
packages/
├── backend/
│   ├── database/migrations/
│   │   └── *-add-user-roles-and-role-assignment-events.ts
│   └── src/
│       ├── auth/
│       │   └── types.ts                    # extend error codes if needed
│       ├── database/entities/
│       │   ├── User.ts                     # relationship to UserRole
│       │   ├── UserRole.ts                 # new
│       │   └── RoleAssignmentEvent.ts      # new
│       ├── middleware/
│       │   └── auth.ts                     # load roles into request context
│       ├── routes/
│       │   ├── auth.ts                     # roles in login/me payloads
│       │   └── users.ts                    # admin directory + role patch
│       └── services/
│           ├── userService.ts              # ensure collaborator on create
│           ├── roleService.ts              # grant/revoke + audit
│           ├── authorizationService.ts   # hasRole / requireAdministrator
│           └── authUserMapper.ts           # roles in AuthUserResponse
└── web/
    └── src/
        ├── auth/
        │   └── AuthProvider.tsx            # roles on AuthUser
        ├── pages/
        │   ├── ProfilePage.tsx             # new — view own roles
        │   └── AdminUsersPage.tsx          # new — manage roles
        ├── routes/
        │   └── shellOptions.ts             # menu entries + guards
        └── services/
            └── usersApi.ts                 # new — admin API client
```

**Structure Decision**: Implement within the existing Lerna monorepo; no new packages. Backend owns persistence and authorization; web owns profile and admin UX consuming the versioned contract.

## Complexity Tracking

No constitutional violations requiring justification.
