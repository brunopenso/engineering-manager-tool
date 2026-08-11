# US3 — Authored chart and comment/review cards

Automated coverage: `packages/web/tests/020-user-pr-activity/summaries.us3.test.ts`, `summaries-ui.us3.test.tsx`.

## Acceptance

1. Chart counts only authored PRs in weekly buckets.
2. Cards count only the user’s comments and reviews in the filtered set.
3. Filters update chart and cards together.
4. Empty authored with non-zero comments/reviews still shows card values.
