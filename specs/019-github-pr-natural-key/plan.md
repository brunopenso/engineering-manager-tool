# Implementation Plan: GitHub Pull Request Natural Key

**Branch**: `019-github-pr-natural-key` | **Date**: 2026-08-10 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/019-github-pr-natural-key/spec.md`

## Summary

Change the GitHub PR import identity model so imported pull requests and collection-control records are uniquely keyed by `(repositoryId, githubPullRequestId)` instead of collaborator/user ownership or collaborator+org+date-range control. Tables are empty: deliver a schema migration and service updates only (no data reconciliation). Import always refreshes PR + nested comments/reviews on every hit; collection-control is audit/history only (no skip). Retrieve continues to filter by author GitHub login + merged date under hierarchical DAC, querying by author login rather than `collaborator_id`.

## Technical Context

**Language/Version**: TypeScript (Node.js 26 backend; React/web unchanged)  
**Primary Dependencies**: Fastify 5, TypeORM, PostgreSQL, Vitest, existing `@octokit/rest` / `@octokit/auth-app` GitHub client (no new runtime deps expected)  
**Storage**: PostgreSQL — alter `github_imported_pull_requests` and `github_pr_collection_controls` uniqueness/columns via migration under `packages/backend/database/migrations`  
**Testing**: Vitest; new/updated feature tests under `packages/backend/tests/019-github-pr-natural-key/`  
**Target Platform**: Linux-hosted backend + existing operator CLI (`github:import-prs`)  
**Project Type**: Monorepo web application — **backend-only** change set for 019  
**Performance Goals**: Same order of magnitude as 018 import/retrieve; natural-key upsert must remain O(1) lookup per PR hit  
**Constraints**: Empty tables (schema-only); no skip on prior successful control; refuse persist without both repository id and pull request id; DAC unchanged in policy; no new web UI / i18n  
**Scale/Scope**: Migration + entity/service updates to existing 018 import/query/control path; contract delta; feature tests for natural key, always-refresh, and DAC

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Principle I (Type-Safe Monorepo Ownership): **PASS** — backend owns migration, entities, import/query/control services, and tests.
- Principle II (Security-First): **PASS** — retrieve remains authenticated; DAC + admin rules unchanged; errors must not leak secrets.
- Principle III (Migration-Backed Data Integrity): **PASS** — schema change via migration; composite unique natural keys at DB level.
- Principle IV (API and UX Contract Fidelity): **PASS** — contracts document identity/behavior delta; retrieve request shape retained; response still exposes `repositoryId` + `githubPullRequestId`.
- Principle V (Incremental Delivery): **PASS** — stories map to natural-key persist → non-user identity/query → PR-keyed audit control → nested stability.
- Principle VI (Mandatory Automated Testing): **PASS** — tests under `tests/019-github-pr-natural-key/` covering FRs and DAC.
- Principle VII (Hierarchical DAC): **PASS** — retrieve still self + recursive subordinates; peers/superiors denied; admin allow; tests required.
- Principle VIII (Frontend Design Standards): **N/A — PASS by scope** — no new screens.
- Principle IX (i18n): **N/A — PASS by scope** — no user-visible web UI strings.
- Dependency currency: **PASS** — reuse existing stack; no unjustified new dependencies.

**Post-Phase-1 Re-check**: **PASS** — data-model, contracts, and quickstart align with gates; empty-table schema-only cutover; DAC preserved via author-login filtering.

## Project Structure

### Documentation (this feature)

```text
specs/019-github-pr-natural-key/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── github-pr-natural-key-api.yaml
│   └── github-pr-natural-key-import.md
└── tasks.md                    # /speckit-tasks (not created by /speckit-plan)
```

### Source Code (repository root)

```text
packages/backend/
├── database/migrations/
│   └── *-GithubPrNaturalKey.ts          # composite unique keys; drop collaborator-owned identity
├── src/
│   ├── database/entities/
│   │   ├── GithubImportedPullRequest.ts # natural key; remove collaboratorId
│   │   └── GithubPrCollectionControl.ts # key by repositoryId + githubPullRequestId
│   └── services/
│       ├── githubApiClient.ts           # ensure repositoryId + githubPullRequestId populated correctly
│       ├── githubPrImportService.ts     # upsert by natural key; always refresh; per-PR control audit
│       ├── githubPrCollectionControlService.ts
│       └── githubPrQueryService.ts      # filter by authorGithubLogin (not collaborator_id)
└── tests/
    └── 019-github-pr-natural-key/
        ├── natural-key-persist.us1.test.ts
        ├── author-not-identity.us2.test.ts
        ├── collection-control-audit.us3.test.ts
        ├── nested-attach.us4.test.ts
        └── query-dac.us2.test.ts          # or shared DAC coverage file
```

**Structure Decision**: Backend-only evolution of `018-github-pr-import`. No web package changes. Prefer a new additive migration (tables empty) rather than editing the historical 018 migration in place, so environments that already ran 018 stay reproducible.

## Complexity Tracking

> No constitution violations requiring justification.
