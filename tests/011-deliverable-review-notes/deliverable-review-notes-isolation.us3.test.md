# Deliverable Review Notes — Isolation (US3)

Maps to spec User Story 3.

## Scenarios

- Leader A and Leader B save distinct notes on same deliverable.
- Each leader reads only their own notes.
- Leader A save does not change Leader B reviewed indicator.

## Automated coverage

- `packages/backend/tests/deliverable-review-notes/deliverable-review-notes-isolation.us3.test.ts`
- `packages/web/tests/deliverable-review-notes/deliverable-review-notes-isolation.us3.test.tsx`
