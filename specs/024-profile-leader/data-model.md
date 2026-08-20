# Data Model: Profile Assigned Leader

## Persistence

No schema change. Existing `users.leader_id` (nullable UUID, FK to `users.id`, ON DELETE SET NULL) remains the source of truth.

## API: LeaderSummary

| Field      | Type   | Notes              |
| ---------- | ------ | ------------------ |
| `id`       | uuid   | Leader user id     |
| `fullName` | string | Leader display name |

## API: UserProfile (extended)

| Field    | Type                    | Required | Notes                                      |
| -------- | ----------------------- | -------- | ------------------------------------------ |
| `leader` | `LeaderSummary` \| null | yes      | `null` when unassigned or leader missing   |

Existing UserProfile fields are unchanged.

## Mapping rules

1. `leaderId` null or undefined → `leader: null`.
2. Leader row found → `{ id, fullName }`.
3. Leader row not found → `leader: null` (same as unassigned).

## UI state (Profile page)

| Field    | Source                         | Notes                                      |
| -------- | ------------------------------ | ------------------------------------------ |
| Leader   | `user.leader` from auth session | Read-only; name or empty-state translation |

## Access control

| Actor          | Read                                      | Update                         |
| -------------- | ----------------------------------------- | ------------------------------ |
| Signed-in user | Own `leader` via session + Profile        | Not allowed on Profile         |
| Unauthenticated | —                                        | Denied (no session)            |
| Administrator  | Directory users include `leader` if mapped | Hierarchy management unchanged |

## Key entities

- **User**: optional `leaderId`.
- **LeaderSummary**: public identity of the assigned leader.
