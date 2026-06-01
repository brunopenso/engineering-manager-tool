# US4: Combined filters, reset, and authorization

## Scenarios

1. `name`, `email`, and `roles` combine with AND across dimensions.
2. Filtered empty state when zero matches.
3. Clear all filters restores unfiltered `GET /users`.
4. Grant/revoke role refetches with active filter query params.
5. Non-administrator receives 403 for filtered list.
