# Implementation Plan: Hierarchy Subtree and Itself Selection

**Branch**: `023-subtree-itself-select` | **Date**: 2026-08-12 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/023-subtree-itself-select/spec.md`

## Summary

Change the shared hierarchy team-member picker so selecting a person with reports scopes data to that person **plus their full descendant subtree**, and add an **"Itself"** option for person-only scope. Backend accepts a new optional `scope` query parameter (`subtree` | `itself`) alongside `userId` on Team Deliverables, Team Analytics, and Team PR Performance endpoints; a shared resolver expands subtree to authorized owner IDs. Frontend picker and all three leader screens adopt the same selection model with i18n labels and clear scope feedback. **No schema migration.**

## Technical Context

**Language/Version**: TypeScript (Node.js 26 backend, React 19 frontend)  
**Primary Dependencies**: Fastify 5, TypeORM, PostgreSQL (`pg`), React Router 7, Vite 8, Material UI 6, `react-i18next`, `frontend-design` skill  
**Storage**: PostgreSQL — existing `users` hierarchy (`leader_id`); existing deliverables / analytics / PR tables; **no new migration**  
**Testing**: Vitest; feature docs under `tests/023-subtree-itself-select/`; package tests under `packages/backend/tests/023-subtree-itself-select/` and `packages/web/tests/023-subtree-itself-select/`  
**Target Platform**: Linux-hosted backend + browser SPA  
**Project Type**: Monorepo web application (`packages/backend`, `packages/web`)  
**Performance Goals**: Scope resolution and filter refresh within interactive budget for teams up to ~50 descendants (reuse recursive CTE patterns already used for hierarchy)  
**Constraints**: Leader-only; `userId` must pass `assertUserInLeaderSubtree`; subtree expansion MUST stay inside actor’s authorized descendants; i18n `en-US`/`pt-BR`; no hard-coded UI strings; default select = subtree when person has reports  
**Scale/Scope**: Shared picker + 3 leader consumers; shared backend owner-ID resolver; contract updates for 3 GET endpoints; no new screens/routes

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Principle I (Type-Safe Monorepo Ownership): **PASS**. Shared resolver types in backend; picker selection type and API clients in web; OpenAPI contract for `scope`.
- Principle II (Security-First Authentication, Authorization, and Data Handling): **PASS**. Existing bearer + leader guards retained; every `userId` still asserted in actor subtree before expansion.
- Principle III (Migration-Backed Data Integrity): **PASS**. No schema change; hierarchy already persisted via `users.leader_id`.
- Principle IV (API and UX Contract Fidelity): **PASS**. Contract documents `userId` + `scope` semantics aligned with FR-001–FR-009.
- Principle V (Incremental Delivery with Verifiable Outcomes): **PASS**. Stories: subtree select → Itself → scope feedback/empty states.
- Principle VI (Mandatory Automated Testing): **PASS**. Feature-scoped tests for resolver, each endpoint, picker UI, i18n parity, DAC.
- Principle VII (Hierarchical Data Access Control): **PASS**. Subtree of selected person ∩ actor descendants only; peers/superiors/other branches denied; Itself never widens access.
- Principle VIII (Consistent Frontend Design Standards): **PASS**. Shared `TeamMemberHierarchyPicker` updated with Material UI via `frontend-design` skill (no new page; filter control enhancement).
- Principle IX (Internationalized User Interface): **PASS**. New `picker.itself`, scope labels, hints in `en-US`/`pt-BR` `leader` catalogs; key-parity tests.

**Post-Phase-1 Re-check**: **PASS**. Server-side scope expansion prevents client-only multi-ID filtering; Team Deliverables multi-owner query remains DAC-gated; cleared selection preserves existing “full team” behavior without stale scope.

## Project Structure

### Documentation (this feature)

```text
specs/023-subtree-itself-select/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── hierarchy-selection-scope-api.yaml
└── tasks.md                                    # created by /speckit-tasks
```

### Source Code (repository root)

```text
packages/
├── backend/
│   └── src/
│       ├── routes/
│       │   └── users.ts                        # accept scope on team-deliverables / team-analytics / team-pr-performance
│       ├── services/
│       │   ├── userService.ts                  # + resolveScopedOwnerUserIds (or dedicated helper module)
│       │   ├── deliverableService.ts           # listTeamDeliverablesForReview: multi-owner support
│       │   ├── leaderAnalyticsService.ts       # resolveOwnerUserIds honors scope
│       │   └── leaderPrPerformanceService.ts   # resolveOwnerUserIds honors scope
│       └── types/
│           └── hierarchySelectionScope.ts      # ScopeMode + filter DTOs (optional shared types)
├── web/
│   └── src/
│       ├── components/
│       │   └── team-deliverables/
│       │       └── TeamMemberHierarchyPicker.tsx  # Itself option + scope in onChange
│       ├── pages/
│       │   ├── LeaderTeamDeliverablesPage.tsx     # pass scope; multi-owner results
│       │   ├── LeaderTeamAnalyticsPage.tsx
│       │   └── LeaderTeamPrPerformancePage.tsx
│       ├── components/
│       │   └── leader-pr-performance/
│       │       └── TeamPrPerformanceFilters.tsx
│       ├── services/
│       │   ├── teamDeliverablesApi.ts
│       │   ├── leaderAnalyticsApi.ts            # or equivalent client
│       │   └── leaderPrPerformanceApi.ts
│       └── locales/
│           ├── en-US/leader.json                  # picker.itself, scope labels
│           └── pt-BR/leader.json
tests/
└── 023-subtree-itself-select/
    ├── subtree-select.us1.test.md
    ├── itself-option.us2.test.md
    └── scope-feedback.us3.test.md
packages/backend/tests/023-subtree-itself-select/
packages/web/tests/023-subtree-itself-select/
```

**Structure Decision**: Extend the existing shared `TeamMemberHierarchyPicker` and the three leader endpoints rather than inventing a new picker or screen. Centralize owner-ID resolution in `userService` (or a thin shared helper used by analytics/PR/deliverables) so subtree vs Itself semantics cannot drift per screen. Reuse recursive descendant patterns already present for hierarchy view.

## Complexity Tracking

| Item                                      | Why Needed                                                                  | Simpler Alternative Rejected Because                                       |
| ----------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Explicit `scope` query param              | Distinguishes subtree vs Itself for the same `userId` without ambiguous IDs | Overloading “no param = itself” breaks analytics’ existing clear-selection |
| Multi-owner Team Deliverables query       | Subtree selection must return combined deliverables for the scoped set      | Client merging N single-user calls is slow and can leak partial failures   |
| Shared `resolveScopedOwnerUserIds` helper | One DAC-safe expansion path for all three consumers                         | Duplicating CTE/filter logic per service risks inconsistent deny behavior  |

No constitutional violations requiring justification.
