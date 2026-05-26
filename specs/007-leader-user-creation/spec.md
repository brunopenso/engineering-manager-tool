# Feature Specification: Leader User Creation

**Feature Branch**: `007-leader-user-creation`  
**Created**: 2026-05-26  
**Status**: Draft  
**Input**: User description: "create a screen only available for leaders to create new users. When the leader creates it, make it self the leader of the user."

## User Scenarios & Testing *(mandatory, with required automated tests)*

### User Story 1 - Leader creates a new user from UI (Priority: P1)

A leader opens a dedicated user creation screen, enters the new user information, and submits successfully.

**Why this priority**: This is the core business outcome requested and delivers immediate value by enabling leader-driven onboarding.

**Automated Test Requirement**: End-to-end UI and API tests must verify that a leader can access the screen, submit valid data, and the user record is created with the creator leader automatically assigned as leader.

**Frontend Design**: The implementation MUST use the `frontend-design` skill with Material UI best practices.

**Access Control Validation**: Allow only leaders to access and use this screen; deny non-leaders.

**Acceptance Scenarios**:

1. **Given** an authenticated leader on the user creation screen, **When** they submit valid new-user data, **Then** the system creates the user and sets the new user's leader to the authenticated leader.
2. **Given** a successful creation, **When** the leader checks the created user details, **Then** the assigned leader is the same leader who performed the creation.

---

### User Story 2 - Non-leader access is blocked (Priority: P2)

A non-leader user attempts to open or use the leader-only user creation screen.

**Why this priority**: Role boundaries protect organizational integrity and prevent unauthorized user provisioning.

**Independent Test**: Authorization tests validate route/API deny behavior for non-leaders and confirm no user is created.

**Frontend Design**: If a deny state is shown in UI, it MUST use the `frontend-design` skill with Material UI best practices.

**Access Control Validation**: Non-leaders are explicitly denied screen access and create action.

**Acceptance Scenarios**:

1. **Given** an authenticated non-leader, **When** they navigate to the leader-only user creation route, **Then** access is denied with a clear permission error.
2. **Given** an authenticated non-leader, **When** they attempt to call user-creation directly, **Then** the request is rejected and no new user is persisted.

---

### User Story 3 - Leader assignment is immutable at create time (Priority: P3)

When creating a user, the leader field is not manually selectable and is always derived from the authenticated leader creating the user.

**Why this priority**: This enforces consistent reporting relationships and prevents accidental or unauthorized assignment mismatch during creation.

**Independent Test**: API validation tests verify that leader assignment during create ignores or rejects any conflicting leader input and uses the authenticated leader identity.

**Frontend Design**: The create form must present leader assignment as automatic context, not an editable selector, using `frontend-design` skill patterns.

**Access Control Validation**: Only leaders can trigger assignment; assignment target always resolves to creator leader identity.

**Acceptance Scenarios**:

1. **Given** an authenticated leader creating a user, **When** the request is processed, **Then** the system stores the creator leader as the new user's leader regardless of omitted or conflicting client-side leader value.

---

### Edge Cases

- A leader submits incomplete required user data; creation is rejected with clear validation feedback and no user is created.
- A user who was previously a leader but no longer has leader permissions attempts creation; access is denied.
- A repeated submission from the same form request occurs; the system prevents duplicate unintended user creation.

## Requirements *(mandatory, with required test coverage)*

### Functional Requirements

*All functional requirements MUST be covered by automated tests. Define the test(s) for each requirement below.*

*For features that expose collaborator or organizational data, requirements MUST define a hierarchical DAC matrix that allows only self + descendants (recursive) and denies peer/superior visibility for every API endpoint, report, and visualization in scope.*

- **FR-001**: System MUST provide a dedicated user creation screen that is visible and accessible only to authenticated users with leader role.
- **FR-002**: System MUST allow a leader to create a new user through that screen with required profile fields.
- **FR-003**: System MUST automatically assign the authenticated leader who creates the user as that new user's leader.
- **FR-004**: System MUST prevent manual leader selection or override during user creation and enforce creator-as-leader assignment server-side.
- **FR-005**: System MUST deny non-leader users from accessing the user creation screen and from invoking the user creation action.
- **FR-006**: System MUST return clear success and error feedback for create attempts (success confirmation, validation errors, permission errors).
- **FR-007**: System MUST persist an auditable record that links created user and creator leader identity at creation time.

### Access Control Matrix *(required when data visibility is in scope)*

| Actor | Allowed Data Visibility | Explicitly Denied Visibility | Validation Notes |
|-------|--------------------------|-------------------------------|------------------|
| Leader | Can access leader-only create screen and create new users; can set relationship only by creating user | Cannot create users while assigning another leader during creation | UI and API tests verify creator is always stored as leader |
| Non-leader | No visibility to leader-only create screen | Cannot access route or perform create action | Route guard and API authorization tests must return deny |

### Key Entities *(include if feature involves data)*

- **User**: Represents a person account in the system, including required onboarding attributes and an assigned leader relationship.
- **Leader Assignment**: Represents the relationship binding a user to the leader responsible for that user, created automatically at user creation time.
- **Creation Audit Record**: Represents traceable metadata of who created the user and when.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of users created through this feature have their leader set to the authenticated leader who submitted the creation.
- **SC-002**: 100% of non-leader attempts to access or use this feature are denied.
- **SC-003**: At least 95% of leader create flows complete successfully on first submission when required data is valid.
- **SC-004**: Leaders can complete the new user creation task in under 2 minutes in standard usage.

## Assumptions

- Existing authentication is already in place and reliably identifies whether the actor has leader permissions.
- The platform already stores or can store a user-to-leader relationship.
- This feature covers user creation only; editing/reassigning leader relationships after creation is out of scope.
- Required user profile fields follow existing user management standards already used by the system.
