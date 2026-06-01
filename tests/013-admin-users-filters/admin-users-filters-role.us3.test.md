# US3: Administrator filters users by role

**API**: `GET /users?roles=LEADER&roles=ADMINISTRATOR`

## Scenarios

1. Single role returns users holding that role.
2. Multiple roles use OR semantics.
3. Omitted roles do not filter.
4. Invalid role returns 400 `VALIDATION_ERROR`.
