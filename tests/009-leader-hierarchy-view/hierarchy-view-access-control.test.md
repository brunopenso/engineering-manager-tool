# Test Plan: Hierarchy View Access Control

## Assertions

- Non-leader web route access is denied (redirect away from hierarchy view).
- Unauthenticated web route access redirects to login.
- `GET /users/leader/hierarchy-view` returns 403 for non-leader.
- `GET /users/leader/hierarchy-view` returns 401 without auth.
