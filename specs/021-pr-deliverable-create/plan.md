# Implementation Plan: Create Deliverable from Pull Requests

**Branch**: `021-pr-deliverable-create` | **Date**: 2026-08-11 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/021-pr-deliverable-create/spec.md`

## Summary

Extend **My Pull Requests** so a collaborator can multi-select imported PRs (existing checkboxes), open a **Create deliverable** modal, and receive a **mocked** analysis proposal for those PRs. After review and Confirm, create a normal deliverable via existing `POST /deliverables`, then offer a link to `/app/deliverables/:id/edit` to complement fields. Backend adds only `POST /deliverables/from-pull-requests/analyze` (no live LLM, no schema migration). Frontend reuses selection state, MUI dialog patterns from reclassify, and `en-US`/`pt-BR` `prActivity` i18n.

## Technical Context

**Language/Version**: TypeScript (Node.js 26 backend, React 19 frontend)  
**Primary Dependencies**: Fastify 5, TypeORM, PostgreSQL (`pg`), React Router 7, Vite 8, Material UI 6, `react-i18next`, `frontend-design` skill  
**Storage**: PostgreSQL — existing deliverables (006) + imported PRs (018/019); **no new migration**  
**Testing**: Vitest; feature docs under `tests/021-pr-deliverable-create/`; package tests under `packages/backend/tests/021-pr-deliverable-create/` and `packages/web/tests/021-pr-deliverable-create/`  
**Target Platform**: Linux-hosted backend + browser SPA  
**Project Type**: Monorepo web application (`packages/backend`, `packages/web`)  
**Performance Goals**: Analyze + confirm path completes within interactive expectations for ≤50 selected PRs (SC-001 under 2 minutes including user review)  
**Constraints**: Self-only PR authorization on analyze (FR-010); mock-only analysis (FR-005); no hard-coded UI strings; owner-only create via existing deliverable rules  
**Scale/Scope**: One new analyze endpoint, one modal + toolbar button on existing page, i18n keys, reuse create API — no new entities

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Principle I (Type-Safe Monorepo Ownership): **PASS**. Typed analyze DTO/service/route; web modal + API client; OpenAPI in `contracts/pr-deliverable-create-api.yaml`.
- Principle II (Security-First Authentication, Authorization, and Data Handling): **PASS**. Bearer auth; server-side PR eligibility checks; create ownership from session user id.
- Principle III (Migration-Backed Data Integrity): **PASS**. No schema change; writes go through existing deliverable persistence.
- Principle IV (API and UX Contract Fidelity): **PASS**. Contract + modal lifecycle match FR-001–FR-014 and US1–US4.
- Principle V (Incremental Delivery with Verifiable Outcomes): **PASS**. Stories: select/open → review mock → confirm/navigate → selection edge cases.
- Principle VI (Mandatory Automated Testing): **PASS**. Feature-scoped docs and package tests in quickstart.
- Principle VII (Hierarchical Data Access Control): **PASS**. Analyze input is **self-only** (author or involved on own activity). Create is owner-only for self. Peers/superiors/subordinates cannot feed foreign PRs into this flow.
- Principle VIII (Consistent Frontend Design Standards): **PASS**. Modal and button use `frontend-design` + Material UI on the existing PR page.
- Principle IX (Internationalized User Interface): **PASS**. `prActivity.createDeliverable.*` keys for `en-US` and `pt-BR` with parity tests.

**Post-Phase-1 Re-check**: **PASS**. Analyze is read/proposal-only; persistence reuses 006 create; DAC documented in contract (403 on unauthorized PR IDs); no LLM dependency; no migration.

## Project Structure

### Documentation (this feature)

```text
specs/021-pr-deliverable-create/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── pr-deliverable-create-api.yaml
└── tasks.md                                    # created by /speckit-tasks
```

### Source Code (repository root)

```text
packages/
├── backend/
│   └── src/
│       ├── routes/
│       │   └── deliverables.ts                 # + POST /deliverables/from-pull-requests/analyze
│       └── services/
│           ├── deliverableFromPrsService.ts    # authorize PRs + mock proposal (NEW)
│           └── deliverableService.ts           # existing create reused on confirm
├── web/
│   └── src/
│       ├── pages/
│       │   └── MyPullRequestsPage.tsx          # + Create deliverable button + modal wiring
│       ├── components/
│       │   └── my-pull-requests/
│       │       └── CreateDeliverableFromPrsModal.tsx  # NEW modal lifecycle
│       ├── services/
│       │   ├── myPullRequestsApi.ts            # or sibling: analyzeFromPullRequests
│       │   └── deliverablesApi.ts              # reuse createDeliverable
│       └── locales/
│           ├── en-US/prActivity.json           # + createDeliverable.*
│           └── pt-BR/prActivity.json
tests/
└── 021-pr-deliverable-create/
    ├── select-and-open.us1.test.md
    ├── review-proposal.us2.test.md
    ├── confirm-and-open.us3.test.md
    └── selection-edge.us4.test.md
packages/backend/tests/021-pr-deliverable-create/
packages/web/tests/021-pr-deliverable-create/
```

**Structure Decision**: Keep analyze next to deliverable routes/services because the output is a deliverable proposal; keep UX on the existing My Pull Requests page and reuse checkbox selection already used for reclassify. Confirm persists only through the established deliverable create API.

## Complexity Tracking

| Item                                        | Why Needed                                                   | Simpler Alternative Rejected Because            |
| ------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| Separate analyze endpoint + existing create | Spec requires review-before-persist and server DAC on PR IDs | Client-only mock cannot enforce FR-010          |
| Modal multi-phase UI                        | Loading, review, success/error are distinct user states      | Immediate create without review violates FR-006 |

No constitutional violations requiring justification.
