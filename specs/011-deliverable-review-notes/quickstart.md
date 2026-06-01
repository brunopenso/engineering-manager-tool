# Quickstart: Deliverable Review Notes

## Preconditions

- Node.js 24+ and PostgreSQL configured.
- Authentication flow operational.
- Migrations applied including `deliverable_reviews` from feature 010.
- Branch: `011-deliverable-review-notes`.
- Team Deliverables page and Review modal (Details tab) already implemented.

## 1. Install dependencies

From repository root:

```bash
npm install
```

No new npm packages required.

## 2. Run migration

```bash
npm run db:migration:run --workspace @em-tool/backend
```

Verify `deliverable_reviews.notes` column exists (nullable `text`).

## 3. Backend checklist

In `packages/backend`:

- Add migration `*-AddDeliverableReviewNotes.ts` — `ALTER TABLE deliverable_reviews ADD COLUMN notes text NULL`.
- Extend `DeliverableReview.ts` entity with `notes?: string | null`.
- Extend `deliverableReviewService.ts`:
  - `getReviewNotes(deliverableId, reviewerUserId)`
  - `saveReviewNotes(deliverableId, reviewerUserId, notes)` — trim, validate ≤8000, upsert, auto-reviewed on non-empty
  - **Update** `setDeliverableReviewed(false)` — set `reviewed = false` when notes present; delete row only when notes empty (FR-012)
- Add DTO types in `types/deliverableReviewNotes.ts`.
- Register routes in `routes/deliverables.ts`:
  - `GET /deliverables/:deliverableId/review-notes`
  - `PUT /deliverables/:deliverableId/review-notes`
- Auth on both: bearer + leader role + `assertCanReadDeliverables(actor, owner)`.
- Add tests in `packages/backend/tests/deliverable-review-notes/`:
  - `deliverable-review-notes-save.us1.test.ts`
  - `deliverable-review-notes-load.us2.test.ts`
  - `deliverable-review-notes-isolation.us3.test.ts`
  - `deliverable-review-notes-dac.us4.test.ts`
  - `deliverable-review-notes-reviewed-toggle.test.ts` (reviewed off preserves notes)

## 4. Frontend checklist

In `packages/web`:

- Add `deliverableReviewNotesApi.ts` (`getReviewNotes`, `saveReviewNotes`).
- Create `DeliverableReviewNotesPanel.tsx` using `frontend-design` skill + MUI:
  - Multiline text field (minRows 6, maxLength 8000)
  - Save button with loading/disabled states
  - Success/error alerts
  - Load on mount; empty-state guidance
- Update `TeamDeliverableReviewModal.tsx` — replace Notes tab placeholder with panel; lazy load on tab switch.
- Update `LeaderTeamDeliverablesPage.tsx` — pass `onReviewedChange` to modal to sync table reviewed column after save.
- Add tests under `packages/web/tests/deliverable-review-notes/`.

## 5. Acceptance mapping docs

Create under `tests/011-deliverable-review-notes/`:

- `deliverable-review-notes-save.us1.test.md`
- `deliverable-review-notes-load.us2.test.md`
- `deliverable-review-notes-isolation.us3.test.md`
- `deliverable-review-notes-dac.us4.test.md`

## 6. Run locally

```bash
npm run dev
```

## 7. Manual verification

### Notes save and load

1. Sign in as a leader with team deliverables to review.
2. Open **Team Deliverables**, select a report, click **Review** on a row.
3. Switch to **Notes** tab — confirm empty state with guidance.
4. Enter coaching notes and click **Save** — confirm success message.
5. Close modal, reopen **Review** → **Notes** — confirm notes persisted.
6. Confirm table **reviewed** column shows reviewed for that row without manual toggle.

### Per-leader isolation

1. Sign in as Leader A; save notes on a deliverable.
2. Sign in as Leader B (also authorized); open same deliverable Notes tab — confirm empty notes for B.
3. Leader B saves different notes — confirm A's notes unchanged on re-login.

### Auto-reviewed (any leader)

1. As direct manager, save notes — reviewed auto-updates.
2. As indirect superior (if available in seed data), save notes on same deliverable — reviewed auto-updates for that superior only.

### DAC deny

1. Attempt review-notes API as non-leader — 403.
2. Attempt as peer on another peer's deliverable — 403.

### Edge cases

1. Save empty notes after prior content — notes cleared; reviewed unchanged.
2. Uncheck reviewed in table when notes exist — notes still present on Notes tab reopen.
3. Save notes again after unchecking reviewed — reviewed re-marked.

## 8. Run tests

```bash
npm run test
```

Expected: all deliverable-review-notes tests pass; no regression on team-deliverables or deliverables CRUD tests.

## 9. Contract reference

OpenAPI: [contracts/deliverable-review-notes-api.yaml](./contracts/deliverable-review-notes-api.yaml)

Migration adds `notes` to existing `deliverable_reviews`; unique `(deliverable_id, reviewer_user_id)` unchanged.
