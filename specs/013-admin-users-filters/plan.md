# Implementation Plan: Admin Users List Filters

**Branch**: `013-admin-users-filters` | **Date**: 2026-06-01 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/013-admin-users-filters/spec.md`

## Summary

Add filter controls to the administrator **Admin Users** screen (`/app/admin/users`): free-text **name** and **email** (full or partial, case-insensitive) and a **role** multi-select (Collaborator, Leader, Administrator). **All filtering runs on the backend** via query parameters on `GET /users`. Filters combine with **AND** across dimensions; roles use **OR** within the selected set. On load, **no filters are active** (full list). **Clear all filters** restores the unfiltered directory. Role grant/revoke continues to refresh with current filter state.

## Technical Context

**Language/Version**: TypeScript (Node.js >=24 backend, React 19 frontend)  
**Primary Dependencies**: Fastify 5, TypeORM, PostgreSQL, React Router 7, Vite 8, Material UI 6 (`frontend-design` skill)  
**Storage**: PostgreSQL — existing `users`, `user_roles` (no migration)  
**Testing**: Vitest; `tests/013-admin-users-filters/`; `packages/backend/tests/admin-users-filters/`; `packages/web/tests/admin-users-filters/`  
**Target Platform**: Linux-hosted backend + browser SPA  
**Project Type**: Monorepo web application (`packages/backend`, `packages/web`)  
**Performance Goals**: Filtered list response within 5 seconds under normal conditions (SC-001)  
**Constraints**: Administrator-only `GET /users`; trim whitespace on text filters; `ILIKE`-style match via `LOWER(...) LIKE`; invalid role values → 400; debounced refetch for name/email text (300ms); immediate refetch on role change  
**Scale/Scope**: Extend `GET /users` + new `findUsersForAdmin(filters)` query; update `AdminUsersPage` + `listUsers` API client; contract delta; no migration

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Principle I (Type-Safe Monorepo Ownership): **PASS**. Backend query parser + service + route; web API client + page filters.
- Principle II (Security-First): **PASS**. Bearer auth; `assertAdministrator` unchanged; validate role query values against `USER_ROLE_TYPES`.
- Principle III (Migration-Backed Data Integrity): **PASS**. No schema change.
- Principle IV (API and UX Contract Fidelity): **PASS**. OpenAPI delta with query params; UI matches spec FR-001–FR-013.
- Principle V (Incremental Delivery): **PASS**. Stories: name → email → role → combined reset + role-change refresh.
- Principle VI (Mandatory Automated Testing): **PASS**. Backend filter integration tests + web filter/refetch tests.
- Principle VII (Hierarchical DAC): **PASS** (N/A extension). Admin directory is org-wide by design (004); feature does not widen hierarchical read paths.
- Principle VIII (Frontend Design): **PASS**. `AdminUsersPage` filter bar uses `frontend-design` + MUI.

**Post-Phase-1 Re-check**: **PASS**. Server-side AND/OR semantics, administrator gate, and distinct empty states documented in contract and data model.

## Project Structure

### Documentation (this feature)

```text
specs/013-admin-users-filters/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── admin-users-filters-api.yaml
└── tasks.md                                    # created by /speckit-tasks
```

### Source Code (repository root)

```text
packages/
├── backend/
│   └── src/
│       ├── routes/users.ts                     # parse query on GET /users
│       ├── services/userService.ts             # findUsersForAdmin(filters)
│       ├── services/adminUserListQuery.ts      # parseAdminUserListFilters (new)
│       └── types/adminUserListFilters.ts       # AdminUserListFilters (new)
├── web/
│   └── src/
│       ├── pages/AdminUsersPage.tsx            # filter bar, debounced refetch, empty states
│       └── services/usersApi.ts                # listUsers(accessToken, filters?)
tests/013-admin-users-filters/
packages/backend/tests/admin-users-filters/
    └── admin-users-list-filters.*.test.ts
packages/web/tests/admin-users-filters/
    └── admin-users-page-filters.*.test.tsx
```

**Structure Decision**: Server-side filter query on existing `GET /users`; reuse orphan-search `LOWER + LIKE` pattern for name/email separately; role filter via `user_roles` join/`EXISTS` with OR semantics; web sends query params only (no client-side-only filtering).

## Complexity Tracking

| Item | Why Needed | Simpler Alternative Rejected Because |
|------|------------|-------------------------------------|
| Query params on `GET /users` | Spec FR-012 requires backend filtering | Client-side filter on full download violates spec |
| Debounced name/email refetch | Avoid API storm on every keystroke | Immediate per-keystroke refetch rejected for UX/perf |

No constitutional violations.

## Phase 0 & Phase 1 Outputs

- [research.md](./research.md) — server-side filtering, SQL patterns, debounce, test layout
- [data-model.md](./data-model.md) — query parameters and UI filter state
- [contracts/admin-users-filters-api.yaml](./contracts/admin-users-filters-api.yaml) — v0.1 delta
- [quickstart.md](./quickstart.md) — implementation steps

## End-to-End Regression Notes

- Open `/app/admin/users` as administrator — full list, empty filter fields.
- Type partial name/email — debounced request with `name` / `email` query params.
- Select roles — immediate refetch with `roles` param (repeatable).
- Combined filters — AND across name, email, roles.
- Zero matches — filtered empty message (not loading/error).
- **Clear all filters** — full list restored.
- Grant/revoke role — list refreshes with same filter params.
- Non-admin `GET /users` with filters — 403 unchanged.
