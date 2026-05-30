# Leader Team Deliverables — Access Control (US4)

Maps to spec User Story 4.

## Scenarios

- Non-leader denied screen and APIs.
- Unauthenticated denied.
- Search for user outside subtree returns 403.
- Team member list excludes out-of-subtree users.

## Automated coverage

- `packages/web/tests/team-deliverables/team-deliverables-access-control.us4.test.tsx`
- `packages/backend/tests/team-deliverables/team-deliverables-access-control.us4.test.ts`
