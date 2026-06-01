# Deliverable Review Notes — Save (US1)

Maps to spec User Story 1 and `contracts/deliverable-review-notes-api.yaml`.

## Scenarios

- Leader saves non-empty notes; notes persist and reviewed=true for saving leader.
- Leader receives success feedback in UI; table reviewed column updates.
- Notes over 8000 characters rejected with validation error.
- Empty save clears note text without changing reviewed state.

## Automated coverage

- `packages/backend/tests/deliverable-review-notes/deliverable-review-notes-save.us1.test.ts`
- `packages/web/tests/deliverable-review-notes/deliverable-review-notes-save.us1.test.tsx`
