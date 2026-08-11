# Quickstart: User Pull Request Activity

## Preconditions

- Node.js 26+ and PostgreSQL configured (see `AGENTS.md` / getting started).
- Branch: `020-user-pr-activity`.
- Imported PR tables from 018/019 present (`github_imported_pull_requests`, comments, reviews).
- Test user with `githubLogin` set and sample authored + involved (comment/review on another imported PR) data in range.

## 1. Backend

In `packages/backend`:

- Add service method (e.g. `queryMyPullRequestActivity`) in or beside `githubPrQueryService.ts`:
  - Resolve actor `githubLogin` from `users` by `auth.userId`
  - If missing login → `{ pullRequests: [] }`
  - Validate `startDate`/`endDate` like existing query validation
  - Select PRs with `merged_at` in range where actor login matches author **or** comment author **or** review reviewer
  - Map via existing `mapImportedPullRequest` + `involvementRole`
- Register `POST /github-pull-requests/my-activity` in `packages/backend/src/routes/githubPullRequests.ts` (auth required; no multi-login body).
- Contract: `specs/020-user-pr-activity/contracts/user-pr-activity-api.yaml`
- Tests: `packages/backend/tests/020-user-pr-activity/` — authored inclusion, involved-via-comment, involved-via-review, date bounds, empty login, self-only (no other users’ authored-only PRs), invalid dates → 400, unauthenticated → 401.

## 2. Frontend

In `packages/web`:

- Add `packages/web/src/services/myPullRequestsApi.ts` → `fetchMyPullRequestActivity(accessToken, { startDate, endDate })`.
- Add helpers to derive repository options, weekly authored series, comment/review counts, and table rows from the response (reuse `defaultLast60DayRange`, `isValidDateRange`, week label utils).
- Add `packages/web/src/pages/MyPullRequestsPage.tsx` using `frontend-design` + MUI:
  - Filter bar: period + repository select
  - Summary: `@mui/x-charts` `BarChart` + two Cards
  - `Table` + detail `Dialog` modal
- Update `packages/web/src/routes/shellOptions.ts` and `App.tsx` for `/app/my-pull-requests`.
- Add locales `packages/web/src/locales/{en-US,pt-BR}/prActivity.json` and `shell.menu.myPullRequests`; register namespace in i18n config.
- Tests: `packages/web/tests/020-user-pr-activity/` — access, no-github empty state, default 60-day range, filters refresh widgets, summaries math, table role + modal, i18n key parity.

## 3. Feature test docs

Under `tests/020-user-pr-activity/`, add markdown specs referenced in `spec.md` (US1–US4).

## 4. Verify

```bash
npm run test --workspace @em-tool/backend -- --run 020-user-pr-activity
npm run test --workspace @em-tool/web -- --run 020-user-pr-activity
npm run lint
```

Manual:

1. Log in as a user with GitHub login → open **My Pull Requests**.
2. Confirm default last 60 days; chart/cards/table load.
3. Change period and repository → all sections refresh consistently.
4. Confirm owner vs involved labels; open a row → modal shows full PR + comments/reviews; close keeps filters.
5. Log in as a user without GitHub login → guidance empty state, no fabricated rows.
6. Confirm another user’s authored-only PRs (where you are not involved) never appear.

## 5. Out of scope (v1)

- Expanding GitHub import to collect PRs solely because the user reviewed/commented.
- Leader/admin viewing another user’s activity on this screen.
- New chart libraries or resizable analytics widget grid.
- Schema migrations.
