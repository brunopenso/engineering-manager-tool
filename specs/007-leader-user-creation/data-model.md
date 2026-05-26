# Data Model: Leader User Creation

## Entity: User (existing, extended behavior)

- **Purpose**: Represents an application user and reporting relationship.
- **Primary fields in scope**:
  - `id`: UUID, primary key
  - `name`: string, required
  - `email`: string, required unique
  - `role`: enum/string, required (must support leader identification)
  - `leaderId`: UUID, nullable/required per existing model; for this feature set to creator leader id on create
  - `createdAt`: timestamp
  - `updatedAt`: timestamp
- **Feature-specific rules**:
  - On leader-driven create, `leaderId` MUST be set to authenticated creator id.
  - Any `leaderId` sent by client MUST be ignored or rejected.
  - Non-leaders cannot create new users.

## Entity: UserCreationAudit (new or mapped to existing audit mechanism)

- **Purpose**: Capture who created a user and when (FR-007).
- **Table**: `user_creation_audits` (if dedicated table is needed)
- **Fields**:
  - `id`: UUID, primary key
  - `createdUserId`: UUID, FK -> `users.id`
  - `creatorLeaderUserId`: UUID, FK -> `users.id`
  - `createdAt`: timestamp
- **Constraints**:
  - One audit row per successful creation event
  - FK integrity must prevent orphan creator or created-user references

## Value Objects (API)

### LeaderCreateUserRequest

- Required user profile fields for onboarding (name, email, role, and any existing required profile fields).
- Must not allow editable leader assignment input in contract.

### LeaderCreateUserResponse

- Returns created user summary including resolved `leaderId`.
- May include audit metadata reference (`createdByUserId`) if exposed by API contract.

## Authorization Rules

- **Allow create**: authenticated actor with leader permission.
- **Deny create**: authenticated actor without leader permission.
- **Assignment enforcement**: creator id is the source of truth for `leaderId`.

## State Transitions

### Create user by leader

1. Authenticate actor.
2. Verify actor is leader.
3. Validate required new-user fields.
4. Persist new user with `leaderId = actorUserId`.
5. Persist audit record linking created user and creator leader.
6. Return created user payload.

### Non-leader create attempt

1. Authenticate actor.
2. Verify actor is not leader.
3. Return authorization deny; do not persist user/audit data.
