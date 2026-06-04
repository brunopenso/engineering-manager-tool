# Implementation Plan: Administrator GitHub Organization Configuration

**Branch**: `015-admin-github-orgs` | **Date**: 2026-06-04 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/015-admin-github-orgs/spec.md`

## Summary

Introduce a persisted **enabled GitHub organization** allowlist in table **`github_integrations`** (stable identifier + organization login slug) via TypeORM migration, administrator-only REST API (`GET` / `POST` / `DELETE` on **`/github-integrations`**), and a dedicated web screen at `/app/admin/github` with a new **GitHub integration** Administration menu entry. Reuse `AdminRoute`, `assertAdministrator`, and validation patterns from tags administration. OAuth, GitHub API verification, and user profile linking remain out of scope.

## Technical Context

**Language/Version**: TypeScript (Node.js >=24 backend, React 19 frontend)  
**Primary Dependencies**: Fastify 5, TypeORM, PostgreSQL, React Router 7, Vite 8, Material UI 6 (`frontend-design` skill)  
**Storage**: PostgreSQL — **`github_integrations`** table via migration under `packages/backend/database/migrations`  
**Testing**: Vitest; `tests/015-admin-github-orgs/`; `packages/backend/tests/admin-github-orgs/`; `packages/web/tests/admin-github-orgs/`  
**Target Platform**: Linux-hosted backend + browser SPA  
**Project Type**: Monorepo web application (`packages/backend`, `packages/web`)  
**Performance Goals**: Full list loads within 3 seconds for hundreds of entries  
**Constraints**: Administrator-only; unique login (case-insensitive via lowercase storage); disable = hard delete; no GitHub API in v1  
**Scale/Scope**: One table, three API operations, one admin route + menu entry; mirrors `005-admin-tags`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Principle I (Type-Safe Monorepo Ownership): **PASS**.
- Principle II (Security-First): **PASS**.
- Principle III (Migration-Backed Data Integrity): **PASS**. **`github_integrations`** migration + `GithubIntegration` entity.
- Principle IV (API and UX Contract Fidelity): **PASS**. `contracts/github-integrations-api.yaml` aligned with spec FR-015.
- Principle V (Incremental Delivery): **PASS**.
- Principle VI (Mandatory Automated Testing): **PASS**.
- Principle VII (Hierarchical DAC): **N/A — PASS by scope**.
- Principle VIII (Frontend Design Standards): **PASS**.

**Post-Phase-1 Re-check**: **PASS** (updated 2026-06-04 for `github_integrations` / `/github-integrations` naming).

## Project Structure

### Documentation (this feature)

```text
specs/015-admin-github-orgs/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── github-integrations-api.yaml
└── tasks.md
```

### Source Code (repository root)

```text
packages/
├── backend/
│   ├── database/migrations/
│   │   └── *-AddGithubIntegrations.ts
│   └── src/
│       ├── auth/types.ts                       # DUPLICATE_GITHUB_INTEGRATION_LOGIN
│       ├── database/entities/
│       │   └── GithubIntegration.ts
│       ├── routes/
│       │   └── githubIntegrations.ts
│       ├── services/
│       │   ├── githubIntegrationValidation.ts
│       │   └── githubIntegrationService.ts
│       └── index.ts
├── web/
│   └── src/
│       ├── pages/
│       │   └── AdminGithubIntegrationsPage.tsx
│       ├── routes/
│       │   └── shellOptions.ts
│       ├── services/
│       │   └── githubIntegrationsApi.ts
│       └── App.tsx
```

**Structure Decision**: Table **`github_integrations`** holds enabled orgs only; API resource **`/github-integrations`**; response keys `integrations` / `integration`.

## Complexity Tracking

No constitutional violations.

## Phase 0 & Phase 1 Outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/github-integrations-api.yaml](./contracts/github-integrations-api.yaml)
- [quickstart.md](./quickstart.md)

## End-to-End Regression Notes

- `GET /github-integrations` returns `{ integrations: [...] }` for administrator.
- Rows stored in **`github_integrations`**; disable removes row.
- Duplicate login → 409 `DUPLICATE_GITHUB_INTEGRATION_LOGIN`.
