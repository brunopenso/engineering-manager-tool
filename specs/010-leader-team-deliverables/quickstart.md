# Quickstart: Leader Team Deliverables

## Preconditions

- Node.js 24+ and PostgreSQL configured.
- Authentication flow operational.
- Migrations applied including `deliverables`, `users.leader_id`, and new `deliverable_reviews`.
- Test data: at least one leader with direct/indirect reports who have deliverables with varied `updated_at` timestamps.
- Branch: `010-leader-team-deliverables`.

## 1. Install dependencies

From repository root:

```bash
npm install
```

No new frontend date-picker packages required (native `type="date"` inputs).

## 2. Run migration

```bash
npm run db:migration:run --workspace @em-tool/backend
```

Verify `deliverable_reviews` table exists with unique `(deliverable_id, reviewer_user_id)`.

## 3. Backend checklist

In `packages/backend`:

- Add entity `DeliverableReview.ts` and migration `*-AddDeliverableReviews.ts`.
- Add `getLeaderTeamMembers(actorUserId)` and `assertUserInLeaderSubtree(actorUserId, targetUserId)` in `userService.ts` (recursive CTE on `leader_id`).
- Add `listTeamDeliverablesForReview(ownerUserId, reviewerUserId, startDate, endDate)` in `deliverableService.ts` (date filter + reviewed join).
- Add `setDeliverableReviewed(deliverableId, reviewerUserId, reviewed)` in `deliverableReviewService.ts`.
- Register routes in `routes/users.ts`:
  - `GET /users/leader/team-members`
  - `GET /users/leader/team-deliverables`
- Register in `routes/deliverables.ts`:
  - `PUT /deliverables/:deliverableId/reviewed`
- Add DTO types in `types/teamDeliverables.ts`.
- Add tests in `packages/backend/tests/team-deliverables/`:
  - `team-deliverables-search.us1.test.ts`
  - `team-deliverables-date-filter.us2.test.ts`
  - `team-deliverables-reviewed.us3.test.ts`
  - `team-deliverables-access-control.us4.test.ts`

## 4. Frontend checklist

In `packages/web`:

- Add `teamDeliverablesApi.ts` (`fetchTeamMembers`, `searchTeamDeliverables`, `setDeliverableReviewed`).
- Create `LeaderTeamDeliverablesPage.tsx` using `frontend-design` skill + MUI:
  - Person `<Select>` at top
  - Start/end date inputs defaulting to last 30 days
  - Table columns: title, description, reviewed (checkbox)
  - Auto-search on valid filter change; empty state until person selected
- Register route `/app/leader/team-deliverables` behind `LeaderRoute` in `App.tsx`.
- Add shell nav entry **Team Deliverables** in `shellOptions.ts` (Leader section).
- Add tests under `packages/web/tests/team-deliverables/`.

## 5. Run locally

```bash
npm run dev
```

## 6. Manual verification

### Leader browse flow

1. Sign in as a leader with reports who have recent deliverables.
2. Open **Team Deliverables** from the Leader section.
3. Confirm date range defaults to last 30 days.
4. Confirm no table rows until a team member is selected.
5. Select a report; confirm title, description, and reviewed columns load.
6. Change date range to include older deliverables; confirm table refreshes.
7. Mark a row reviewed; reload page and repeat search — confirm reviewed persists.

### Reviewed isolation

1. Sign in as a second leader in the same chain (if available).
2. View the same deliverable; confirm reviewed shows unreviewed unless that leader marked it.

### Unauthorized

1. Sign in as non-leader collaborator.
2. Navigate to `/app/leader/team-deliverables` — confirm redirect/deny.
3. Call team APIs without leader role → 403.

### DAC

1. Attempt search with `userId` outside subtree (API direct call) → 403.
2. Confirm team member list excludes peers and superiors.

## 7. Automated tests

```bash
npm test --workspace @em-tool/backend -- tests/team-deliverables
npm test --workspace @em-tool/web -- tests/team-deliverables
npm run test
```

Feature-level test docs (acceptance mapping):

```text
tests/010-leader-team-deliverables/
├── team-deliverables-search.us1.test.md
├── team-deliverables-date-filter.us2.test.md
├── team-deliverables-reviewed.us3.test.md
└── team-deliverables-access-control.us4.test.md
```

## 8. Contract reference

OpenAPI: [contracts/team-deliverables-api.yaml](./contracts/team-deliverables-api.yaml)
