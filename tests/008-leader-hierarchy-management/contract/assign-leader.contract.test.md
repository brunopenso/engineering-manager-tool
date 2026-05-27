# Contract Test: POST /users/{userId}/assign-leader

- Validates leader-only access.
- Validates success payload shape: `{ userId, leaderId, updatedAt }`.
- Validates error behavior for not-found user and no-longer-orphan user.
