# Implementation Plan: Deliverable Review Notes

**Branch**: `011-deliverable-review-notes` | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/011-deliverable-review-notes/spec.md`

## Summary

Implement the **Notes** tab in the existing Team Deliverables **Review deliverable** modal so authorized leaders can load, compose, and save private coaching notes per deliverable. Extend the existing `deliverable_reviews` table with a nullable `notes` text column and add GET/PUT review-notes API endpoints. On successful save with non-empty trimmed notes, upsert the review row and set `reviewed = true` for the saving leader (uniform for any leader in the chain). Frontend replaces the Notes tab placeholder with a multiline editor, Save action, and loading/error/success states; the table reviewed column updates after save without a full page reload.

## Technical Context

**Language/Version**: TypeScript (Node.js >=24 backend, React 19 frontend)  
**Primary Dependencies**: Fastify 5, TypeORM, PostgreSQL (`pg`), React Router 7, Vite 8, Material UI 6 (`frontend-design` skill)  
**Storage**: PostgreSQL — extend existing `deliverable_reviews` table with `notes` column via migration  
**Testing**: Vitest (backend + web); acceptance mapping under `tests/011-deliverable-review-notes/`; package tests under `packages/backend/tests/deliverable-review-notes/` and `packages/web/tests/deliverable-review-notes/`  
**Target Platform**: Linux-hosted backend + browser SPA  
**Project Type**: Monorepo web application (`packages/backend`, `packages/web`)  
**Performance Goals**: Notes load within 3 seconds on typical network (SC-005); single GET on tab open; single PUT on save  
**Constraints**: Leader-only notes read/write; per-leader note privacy; DAC via `assertCanReadDeliverables` + leader role; notes max 8000 chars trimmed; auto-reviewed on non-empty save only; clearing notes does not clear reviewed  
**Scale/Scope**: One migration, two new API operations, one modal tab panel, extended review service, API client methods, DAC/isolation/auto-reviewed tests

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Principle I (Type-Safe Monorepo Ownership): **PASS**. Changes confined to backend/web packages; OpenAPI contract in `contracts/deliverable-review-notes-api.yaml`; shared DTO types in backend `types/` and web API client.
- Principle II (Security-First Authentication, Authorization, and Data Handling): **PASS**. Bearer auth on all routes; leader role guard; deliverable read authorization via `assertCanReadDeliverables`; notes returned only for `(actor, deliverable)` pair; stable error codes without note content leakage on deny.
- Principle III (Migration-Backed Data Integrity): **PASS**. Migration adds nullable `notes` column to `deliverable_reviews` with entity update; existing FKs and unique constraint preserved.
- Principle IV (API and UX Contract Fidelity): **PASS**. Contract aligns with spec FR-001–FR-018 and clarifications (uniform auto-reviewed for any leader on non-empty notes save).
- Principle V (Incremental Delivery with Verifiable Outcomes): **PASS**. User stories map to save → load → isolation → DAC slices with independent tests.
- Principle VI (Mandatory Automated Testing): **PASS**. Feature test directory and package tests defined in quickstart for all FR-critical paths.
- Principle VII (Hierarchical Data Access Control): **PASS**. Notes endpoints reuse deliverable read authorization; peer/upward/out-of-chain denied; per-leader note isolation enforced at query layer (`reviewer_user_id = actor`).
- Principle VIII (Consistent Frontend Design Standards): **PASS**. Notes tab uses `frontend-design` skill and Material UI inside existing modal.

**Post-Phase-1 Re-check**: **PASS**. Data model, contract, and authorization at API boundary enforce DAC and per-leader privacy; UI scoped to Notes tab only.

## Project Structure

### Documentation (this feature)

```text
specs/011-deliverable-review-notes/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── deliverable-review-notes-api.yaml
└── tasks.md                                    # created by /speckit-tasks
```

### Source Code (repository root)

```text
packages/
├── backend/
│   ├── database/migrations/
│   │   └── *-AddDeliverableReviewNotes.ts
│   └── src/
│       ├── database/entities/
│       │   └── DeliverableReview.ts            # + notes column
│       ├── routes/
│       │   └── deliverables.ts                 # + GET/PUT review-notes
│       ├── services/
│       │   └── deliverableReviewService.ts     # get/save notes + reviewed upsert
│       ├── types/
│       │   └── deliverableReviewNotes.ts       # DTOs
│       └── tests/
│           └── deliverable-review-notes/
├── web/
│   └── src/
│       ├── components/team-deliverables/
│       │   ├── TeamDeliverableReviewModal.tsx  # wire Notes tab
│       │   └── DeliverableReviewNotesPanel.tsx # new panel
│       ├── pages/
│       │   └── LeaderTeamDeliverablesPage.tsx  # onReviewedChange callback
│       └── services/
│           └── deliverableReviewNotesApi.ts    # GET/PUT client
tests/
└── 011-deliverable-review-notes/
    ├── deliverable-review-notes-save.us1.test.md
    ├── deliverable-review-notes-load.us2.test.md
    ├── deliverable-review-notes-isolation.us3.test.md
    └── deliverable-review-notes-dac.us4.test.md
packages/backend/tests/deliverable-review-notes/
packages/web/tests/deliverable-review-notes/
```

**Structure Decision**: Extend existing `deliverableReviewService` and `deliverables` routes rather than a new module; notes live on the same `(reviewer, deliverable)` row as reviewed state from feature 010. Separate API client file keeps team-deliverables search API unchanged.

## Complexity Tracking

| Item                                        | Why Needed                                                                                           | Simpler Alternative Rejected Because                                                                    |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `notes` column on `deliverable_reviews`     | Persist private per-leader note text with reviewed state (FR-003, FR-010)                            | Separate `deliverable_review_notes` table adds join complexity without business benefit                 |
| Dedicated GET/PUT `/review-notes` endpoints | Load/save notes with leader-only scoping and validation (FR-004, FR-005)                             | Embedding notes in `GET /deliverables/:id` leaks notes into deliverable detail responses used elsewhere |
| `onReviewedChange` callback on modal        | Table reviewed column reflects auto-reviewed after save without full search refresh (FR-010, SC-004) | Full table re-search works but slower and loses scroll/filter context                                   |
| Non-empty trim gate for auto-reviewed       | Distinguish “clear notes” from “write review” (edge case)                                            | Auto-marking on empty save would contradict “clearing notes does not clear reviewed” UX                 |

No constitutional violations requiring justification.

## End-to-End Regression Notes

- Verify leader opens Review modal → Notes tab shows empty state with guidance when no notes exist.
- Verify leader types notes, saves, sees success feedback; reopen modal → notes persisted.
- Verify after save, Team Deliverables table shows reviewed for that leader without manual toggle.
- Verify second leader on same deliverable sees empty notes and independent reviewed state.
- Verify indirect superior saving notes auto-marks reviewed for themselves only (same as direct manager).
- Verify peer/non-leader/unauthorized deliverable → 403 on GET/PUT review-notes.
- Verify notes over 8000 chars rejected with validation message.
- Verify clearing notes to empty saves successfully; reviewed indicator unchanged.
- Verify manual reviewed toggle in table still works; subsequent non-empty note save re-marks reviewed.
- Verify existing Team Deliverables search, Details tab, and deliverable CRUD unchanged.
