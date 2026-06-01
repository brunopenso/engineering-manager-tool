# US2: Administrator filters users by email

**API**: `GET /users?email={text}`

## Scenarios

1. Partial email match returns matching users.
2. `name` and `email` combine with AND on the server.
