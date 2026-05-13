# Data Model: Google-only Authentication

## Entity: User
- Purpose: Stores the canonical authenticated person profile for application access.
- Fields:
  - id: UUID, primary key.
  - email: string, required, unique, normalized lowercase.
  - fullName: string, required.
  - firstLoginAt: timestamp with timezone, required.
  - lastLoginAt: timestamp with timezone, required.
  - createdAt: timestamp with timezone, required.
  - updatedAt: timestamp with timezone, required.
- Validation rules:
  - email must be present and syntactically valid.
  - fullName must be non-empty after trim.
  - firstLoginAt must not change after initial insert.
  - lastLoginAt must be greater than or equal to firstLoginAt.
- Relationships:
  - One-to-many with LoginAuditEvent.

## Entity: LoginAuditEvent
- Purpose: Records each successful authentication event for traceability.
- Fields:
  - id: UUID, primary key.
  - userId: UUID, required, foreign key to User.id.
  - loggedInAt: timestamp with timezone, required.
  - provider: enum/string, required, value fixed to GOOGLE for this feature.
  - createdAt: timestamp with timezone, required.
- Validation rules:
  - one row per successful authentication completion.
  - userId must reference an existing user.
- Relationships:
  - Many-to-one with User.

## Value Object: AuthenticatedSession (non-persistent)
- Purpose: Represents the authenticated context returned by backend after successful login.
- Fields:
  - userId: UUID.
  - email: string.
  - fullName: string.
  - issuedAt: timestamp.
  - expiresAt: timestamp.
- Validation rules:
  - expiresAt must be after issuedAt.
  - session payload must map to an existing User at issuance time.

## State Transitions
- New Google user authenticates successfully:
  - User does not exist by email -> create User with firstLoginAt = now and lastLoginAt = now.
  - Create LoginAuditEvent.
  - Return AuthenticatedSession and redirect target for welcome page.
- Returning user authenticates successfully:
  - User exists by email -> keep firstLoginAt unchanged, update lastLoginAt = now.
  - Create LoginAuditEvent.
  - Return AuthenticatedSession and redirect target for welcome page.
- Authentication fails:
  - Do not create/update User.
  - Do not create LoginAuditEvent for success category.
  - Return unauthorized result and keep user on login flow.
