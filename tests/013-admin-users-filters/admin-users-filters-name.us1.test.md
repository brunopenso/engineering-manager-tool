# US1: Administrator filters users by name

**API**: `GET /users?name={text}`

## Scenarios

1. Full name match returns only matching user(s).
2. Partial name match returns all users whose display name contains the text (case-insensitive).
3. Whitespace-only `name` is ignored (no name dimension in filter).
4. Web debounces name input (300ms) before calling `GET /users`.
