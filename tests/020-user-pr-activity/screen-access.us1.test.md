# US1 — Open My Pull Requests screen

Automated coverage: `packages/web/tests/020-user-pr-activity/screen-access.us1.test.tsx`, `i18n-parity.us1.test.ts`.

## Acceptance

1. Authenticated users see **My Pull Requests** in the shell menu.
2. Default period is last 60 days when `githubLogin` is present.
3. Users without GitHub login see guidance empty state (no fabricated rows).
4. Unauthenticated users cannot access `/app/my-pull-requests`.
