# Contract Test: GET /users/orphans

- Validates leader-only access.
- Validates `query` supports partial/full matching across name and email.
- Validates response payload shape: `{ users: [{ id, fullName, email }] }`.
