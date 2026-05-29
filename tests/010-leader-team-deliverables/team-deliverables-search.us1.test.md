# Leader Team Deliverables — Search (US1)

Maps to spec User Story 1.

## Scenarios

- Leader-only route renders filter bar and empty results until team member selected.
- Team member select populated from descendant subtree with display names.
- Selecting member triggers search with default last-30-days range.
- Table shows title, description, reviewed columns only.
- Changing selected member refreshes results.

## Automated coverage

- `packages/web/tests/team-deliverables/team-deliverables-search.us1.test.tsx`
- `packages/backend/tests/team-deliverables/team-deliverables-search.us1.test.ts`
