# US4 — PR table and detail modal

Automated coverage: `packages/web/tests/020-user-pr-activity/table.us4.test.tsx`, `table-detail.us4.test.tsx`.

## Acceptance

1. Table shows repository, PR date, owner vs involved.
2. Row click opens modal with full PR detail including comments/reviews.
3. Closing modal preserves filters.
4. Empty set shows empty table; default sort newest `mergedAt` first.
