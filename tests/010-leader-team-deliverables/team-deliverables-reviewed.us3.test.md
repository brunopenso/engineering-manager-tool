# Leader Team Deliverables — Reviewed Toggle (US3)

Maps to spec User Story 3.

## Scenarios

- Unreviewed deliverable shows reviewed=false by default.
- Leader toggles reviewed=true; persists after reload.
- Leader toggles reviewed=false; state clears.
- Second leader sees independent reviewed state.
- Unauthorized user cannot toggle reviewed.

## Automated coverage

- `packages/web/tests/team-deliverables/team-deliverables-reviewed.us3.test.tsx`
- `packages/backend/tests/team-deliverables/team-deliverables-reviewed.us3.test.ts`
