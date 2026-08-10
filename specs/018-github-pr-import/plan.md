# Implementation Plan: GitHub Pull Request Import

**Branch**: `018-github-pr-import` | **Date**: 2026-08-10 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/018-github-pr-import/spec.md`

## Summary

Add an operator-triggered GitHub pull request import that, for every collaborator with a `githubLogin`, queries merged PRs across enabled `github_integrations` organizations for a UTC date range (default: previous day), persists PRs/comments/reviews, and records per-collaborator/org/period collection-control rows to prevent duplicate successful imports. Expose an authenticated retrieve API that accepts GitHub logins + date filter and returns collected data under hierarchical DAC (self + recursive subordinates; administrators may read any collaborator). Backend-only for this feature (no new web UI); root/backend workspace scripts invoke a `tsx` import CLI. Use `@octokit/rest` with `@octokit/auth-app` and per-org `GITHUB_APP_{org}_*` installation credentials for GitHub API access.

## Technical Context

**Language/Version**: TypeScript (Node.js 26 backend; React 19 frontend unchanged for this feature)  
**Primary Dependencies**: Fastify 5, TypeORM, PostgreSQL, Vitest, `tsx` CLI scripts, `@octokit/rest`, `@octokit/auth-app` (latest stable at implementation)  
**Storage**: PostgreSQL — new tables for imported PRs, comments, reviews, and collection control; migrations under `packages/backend/database/migrations`  
**Testing**: Vitest; feature tests under `packages/backend/tests/018-github-pr-import/` (and mirrored path expectations from constitution `tests/018-github-pr-import/`)  
**Target Platform**: Linux-hosted backend + operator CLI; browser SPA consumes retrieve API later (out of scope UI)  
**Project Type**: Monorepo web application (`packages/backend`, `packages/web`) — **backend-only change set** for 018  
**Performance Goals**: Import completes for typical team sizes (tens of collaborators × few orgs × one day) within operator-acceptable runtime; retrieve API returns matching PRs with nested comments/reviews within a few seconds for moderate result sets  
**Constraints**: UTC day boundaries; only enabled orgs; only merged PRs matching author login; no duplicate successful collection for collaborator+org+range; secrets via env (`GITHUB_APP_{org}_*`); hierarchical DAC on retrieve; no new web UI / i18n surface  
**Scale/Scope**: Four new persistence entities, one import CLI + npm scripts, one retrieve API, GitHub client wrapper; reuses `users.github_login` and `github_integrations`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Principle I (Type-Safe Monorepo Ownership): **PASS** — backend package owns import CLI, entities, routes, and tests; no circular workspace deps.
- Principle II (Security-First): **PASS** — retrieve API requires app auth; DAC + admin bypass explicit; GitHub App credentials from env only; errors must not leak secrets.
- Principle III (Migration-Backed Data Integrity): **PASS** — migrations + TypeORM entities for PR/comment/review/control tables with uniqueness constraints.
- Principle IV (API and UX Contract Fidelity): **PASS** — `contracts/github-pr-import-api.yaml` + CLI contract in `contracts/github-pr-import-cli.md`.
- Principle V (Incremental Delivery): **PASS** — stories map to import → control → retrieve.
- Principle VI (Mandatory Automated Testing): **PASS** — tests under `tests/018-github-pr-import/` covering FR/acceptance and DAC matrix.
- Principle VII (Hierarchical DAC): **PASS** — retrieve enforces self + recursive subordinates; peers/superiors denied; administrators allowed any product collaborator; tests required.
- Principle VIII (Frontend Design Standards): **N/A — PASS by scope** — no new screens.
- Principle IX (i18n): **N/A — PASS by scope** — no user-visible web UI strings.
- Dependency currency: **PASS** — plan targets latest stable `@octokit/rest` compatible with Node 26 at implementation time.

**Post-Phase-1 Re-check**: **PASS** — design artifacts align with gates; DAC matrix and migration-backed entities documented; no unjustified complexity.

## Project Structure

### Documentation (this feature)

```text
specs/018-github-pr-import/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── github-pr-import-api.yaml
│   └── github-pr-import-cli.md
└── tasks.md                    # /speckit-tasks (not created by /speckit-plan)
```

### Source Code (repository root)

```text
packages/
├── backend/
│   ├── database/migrations/
│   │   └── *-AddGithubPullRequestImport.ts
│   ├── scripts/
│   │   └── github-import-prs.ts          # operator CLI entry (tsx)
│   ├── src/
│   │   ├── database/entities/
│   │   │   ├── GithubImportedPullRequest.ts
│   │   │   ├── GithubPullRequestComment.ts
│   │   │   ├── GithubPullRequestReview.ts
│   │   │   └── GithubPrCollectionControl.ts
│   │   ├── routes/
│   │   │   └── githubPullRequests.ts     # retrieve/query API
│   │   ├── services/
│   │   │   ├── githubApiClient.ts        # Octokit wrapper
│   │   │   ├── githubPrImportService.ts  # import orchestration + control
│   │   │   ├── githubPrQueryService.ts   # retrieve + DAC filtering
│   │   │   └── authorizationService.ts   # extend/reuse DAC helpers
│   │   └── index.ts                      # register route
│   └── tests/
│       └── 018-github-pr-import/
│           ├── import.*.test.ts
│           ├── collection-control.*.test.ts
│           ├── query.*.test.ts
│           └── dac.*.test.ts
└── (root)
    package.json                          # github:import-prs script → backend
```

**Structure Decision**: Backend-only feature. Persist imported GitHub activity in dedicated tables; drive import via `tsx` script exposed as root/backend npm scripts; expose read API under `/github-pull-requests/query`. No `@em-tool/web` changes in this feature.

## Complexity Tracking

> No constitution violations requiring justification.
