# Quickstart: Create Deliverable from Pull Requests

## Preconditions

- Node.js 26+ and PostgreSQL configured (see `AGENTS.md` / getting started).
- Branch: `021-pr-deliverable-create`.
- Features 006 (deliverables) and 020 (My Pull Requests + selection/reclassify) available.
- Test user with `githubLogin` and at least one imported PR in their activity set.

## 1. Backend

In `packages/backend`:

- Add mocked analyze service (e.g. `deliverableFromPrsService.ts`):
  - Validate `pullRequestIds` (1–50 UUIDs).
  - Load PRs; authorize each against actor GitHub login (author or involved via comment/review).
  - Build deterministic `DeliverableProposal` (see [research.md](./research.md) Decision 3).
  - Return `{ proposal, sourcePullRequestIds }` — **no LLM**, **no DB write**.
- Register `POST /deliverables/from-pull-requests/analyze` in `packages/backend/src/routes/deliverables.ts` (auth required).
- Reuse existing `POST /deliverables` for confirm (no new create route).
- Contract: [contracts/pr-deliverable-create-api.yaml](./contracts/pr-deliverable-create-api.yaml)
- Tests: `packages/backend/tests/021-pr-deliverable-create/` — happy path mock shape, empty IDs → 400, foreign/unauthorized PR → 403, unauthenticated → 401, no persistence side effects from analyze.

## 2. Frontend

In `packages/web`:

- Extend `myPullRequestsApi.ts` (or small sibling client) with `analyzeDeliverableFromPullRequests(accessToken, { pullRequestIds })`.
- Reuse `createDeliverable` from `deliverablesApi.ts` on Confirm.
- Add `CreateDeliverableFromPrsModal` under `components/my-pull-requests/` (`frontend-design` + MUI Dialog): phases loading → review → creating → success/error.
- On `MyPullRequestsPage`, add **Create deliverable** button enabled when `selectedIds.size > 0` (alongside Change Classification); wire modal; clear selection after successful create; success CTA → `/app/deliverables/:id/edit`.
- Extend `packages/web/src/locales/{en-US,pt-BR}/prActivity.json` with `createDeliverable.*` keys; no hard-coded strings.
- Tests: `packages/web/tests/021-pr-deliverable-create/` — button enablement, modal loading/review/cancel, confirm creates and shows edit link, error paths, i18n key parity.

## 3. Feature test docs

Under `tests/021-pr-deliverable-create/`, add markdown specs referenced in `spec.md` (US1–US4).

## 4. Verify

```bash
npm run test --workspace @em-tool/backend -- --run 021-pr-deliverable-create
npm run test --workspace @em-tool/web -- --run 021-pr-deliverable-create
npm run lint
```

Manual:

1. Log in → **My Pull Requests** → select one or more PRs.
2. Click **Create deliverable** → modal shows loading, then proposal.
3. Cancel → no new deliverable in list.
4. Repeat → Confirm → success link → lands on deliverable edit form with proposed fields.
5. Attempt analyze with another user’s PR id (API/test) → denied.

## 5. Out of scope (v1)

- Real LLM / external AI provider calls.
- Persisting PR↔deliverable associations.
- Creating deliverables for other users / subordinates via this modal.
- New deliverable draft status or schema columns.
