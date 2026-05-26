# Feature Specification: User Role Profiles

**Feature Branch**: `006-user-role-profiles`  
**Created**: 2026-05-25  
**Status**: Draft  
**Input**: User description: "lets create profiles. The current system have an entitu called user and now we need to implement that this user have 3 roles: 1. All users by default are collaborators 2. An user can be a leader 3. An user can be a administrator. All 3 roles can coexists at the same time."

## User Scenarios & Testing *(mandatory, with required automated tests)*

### User Story 1 - Default collaborator profile on sign-in (Priority: P1)

Every authenticated user has a profile that always includes the collaborator role, including on first sign-in and on every subsequent session.

**Why this priority**: Collaborator is the baseline identity for all product access and must exist before leader or administrator capabilities can be layered on.

**Automated Test Requirement**: Integration tests verify new and returning users receive collaborator in profile responses after authentication; unit tests verify collaborator cannot be removed from any user record.

**Access Control Validation**: A user with only the collaborator role can view their own profile and identity fields; organizational data visibility for collaborators follows the self-only rule defined in the access control matrix.

**Acceptance Scenarios**:

1. **Given** a user signs in for the first time, **When** authentication succeeds, **Then** their profile includes the collaborator role.
2. **Given** an existing user signs in again, **When** authentication succeeds, **Then** their profile still includes the collaborator role.
3. **Given** a user profile is retrieved, **When** no additional roles have been granted, **Then** the profile lists collaborator as the only role.

---

### User Story 2 - View own role profile (Priority: P1)

An authenticated user can see which roles apply to their account so they understand their level of access in the product.

**Why this priority**: Users need transparent visibility into their own permissions to avoid confusion and support support requests.

**Automated Test Requirement**: API and UI tests confirm the signed-in user's profile displays all active roles (collaborator, leader, administrator as applicable) without exposing other users' role assignments.

**Frontend Design**: Profile or account summary surface MUST use the `frontend-design` skill with Material UI best practices when presenting role information to the signed-in user.

**Access Control Validation**: Users see only their own roles; attempts to read another user's role profile without appropriate authority are denied.

**Acceptance Scenarios**:

1. **Given** a signed-in user with collaborator and leader roles, **When** they open their profile, **Then** both roles are shown.
2. **Given** a signed-in user with only collaborator, **When** they open their profile, **Then** collaborator is shown and leader and administrator are not shown as active.
3. **Given** a signed-in user, **When** they request another user's role details without management authority, **Then** access is denied.

---

### User Story 3 - Administrator assigns and revokes elevated roles (Priority: P2)

An administrator can grant or remove leader and administrator roles for other users while collaborator remains on every account.

**Why this priority**: Elevated access must be controlled centrally so the organization can delegate leadership and administration safely.

**Automated Test Requirement**: Integration tests cover grant leader, grant administrator, revoke leader, revoke administrator, and verify collaborator persists; negative tests confirm non-administrators cannot change roles.

**Frontend Design**: Administrative role management UI MUST use the `frontend-design` skill with Material UI best practices, including clear labeling of which roles are active per user.

**Access Control Validation**: Only users with the administrator role may change leader or administrator assignments for others; collaborators and leaders without administrator cannot modify role assignments.

**Acceptance Scenarios**:

1. **Given** an administrator views another user's profile, **When** they grant the leader role, **Then** that user's profile includes collaborator and leader.
2. **Given** an administrator views a user who is a leader, **When** they revoke the leader role, **Then** that user's profile includes collaborator only (unless administrator is also assigned).
3. **Given** an administrator grants administrator role to another user, **When** the change is saved, **Then** that user holds collaborator and administrator simultaneously.
4. **Given** a user without the administrator role, **When** they attempt to grant or revoke leader or administrator on any account, **Then** the operation is denied.
5. **Given** any user account, **When** an administrator or the system applies role changes, **Then** the collaborator role is never removed.

---

### User Story 4 - Coexisting roles drive authorization behavior (Priority: P2)

Product behavior respects the combination of roles on a user so that having multiple roles expands capability without replacing baseline collaborator access.

**Why this priority**: The feature exists to model concurrent roles; authorization must honor combinations (for example leader plus administrator) consistently across the product.

**Automated Test Requirement**: Authorization tests for representative protected actions validate allow/deny outcomes for single-role and multi-role users per the access control matrix.

**Access Control Validation**: Each protected capability checks the user's active role set; hierarchical data rules apply when leader is present; administrative capabilities apply when administrator is present.

**Acceptance Scenarios**:

1. **Given** a user with collaborator and leader roles, **When** they access hierarchical organizational data scoped to their subtree, **Then** access follows leader visibility rules.
2. **Given** a user with collaborator, leader, and administrator roles, **When** they perform an administrative action and a leader-scoped data action, **Then** both capabilities are available in the same session.
3. **Given** a user with collaborator only, **When** they attempt leader-only or administrator-only actions, **Then** access is denied.

---

### Edge Cases

- A newly created user record must always persist collaborator even if role assignment logic fails for optional roles.
- Granting leader or administrator to a user who already holds that role is idempotent (no duplicate role state).
- Revoking a role the user does not have returns a clear, non-destructive outcome without altering other roles.
- An administrator attempts to revoke their own administrator role while they are the only administrator in the organization.
- An administrator attempts to remove collaborator from any user (must always be rejected).
- Concurrent role updates from two administrators on the same user resolve predictably (last successful change wins with auditability).
- Existing users created before this feature receive collaborator automatically with no manual onboarding step.
- Session and profile responses stay consistent immediately after a role change (no stale role display for the affected user on next profile load).

## Requirements *(mandatory, with required test coverage)*

### Functional Requirements

- **FR-001**: The system MUST attach a role profile to every user record in the product.
- **FR-002**: The system MUST assign the collaborator role to every user by default at account creation and MUST keep collaborator active for the lifetime of the account.
- **FR-003**: The system MUST allow a user to hold the leader role in addition to collaborator.
- **FR-004**: The system MUST allow a user to hold the administrator role in addition to collaborator.
- **FR-005**: The system MUST allow collaborator, leader, and administrator to be active on the same user at the same time.
- **FR-006**: The system MUST expose the active role set on the authenticated user's own profile and session context.
- **FR-007**: The system MUST allow only users with the administrator role to grant or revoke leader and administrator roles for other users.
- **FR-008**: The system MUST prevent any user or process from removing the collaborator role from any account.
- **FR-009**: The system MUST deny role-management actions from users who lack the administrator role.
- **FR-010**: The system MUST apply authorization decisions using the user's full active role set, not a single exclusive role.
- **FR-011**: The system MUST backfill the collaborator role for all pre-existing users without requiring those users to sign in again for the default to take effect.
- **FR-012**: The system MUST record who changed another user's leader or administrator assignment and when, for accountability.
- **FR-013**: Users with the leader role MUST receive hierarchical organizational data visibility per the access control matrix (self and descendants only).
- **FR-014**: Users with only the collaborator role MUST NOT receive leader or administrator data visibility or management capabilities.
- **FR-015**: Users with the administrator role MUST be able to view and manage role assignments for other users.

### Access Control Matrix *(required when data visibility is in scope)*

| Actor | Allowed Data Visibility | Explicitly Denied Visibility | Validation Notes |
|-------|--------------------------|-------------------------------|------------------|
| Collaborator only | Own identity and profile; self-scoped product data | Peer, superior, and other-branch organizational data; role management for others | Automated tests for self-only reads and denied lateral/superior access |
| Collaborator + Leader | Own identity and profile; self plus direct and indirect subordinates in assigned hierarchy | Peer, superior, and users outside descendant subtree; role management for others | Recursive descendant allow tests; peer/superior deny tests |
| Collaborator + Administrator | Own identity and profile; user directory and role assignments needed for administration | N/A for role-management scope; non-administrative hierarchical rules apply only when leader is also present | Tests for grant/revoke and denied actions without administrator |
| Collaborator + Leader + Administrator | Union of leader visibility rules for hierarchical data and administrator visibility for user/role administration | Peer/superior organizational data outside leader subtree rules | Combined-role authorization tests |

### Key Entities

- **User**: Existing identity record (email, name, login timestamps); each user has exactly one role profile.
- **Role profile**: The set of active roles for a user; always includes collaborator; may additionally include leader and/or administrator.
- **Role assignment event**: Historical record of a grant or revoke of leader or administrator, including actor, target user, role affected, action type, and timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of active user accounts include the collaborator role within one business day of feature activation, including all pre-existing accounts.
- **SC-002**: An administrator can assign or revoke leader or administrator for another user in under 1 minute, with the updated role set visible on the target user's next profile load.
- **SC-003**: 100% of unauthorized role-change attempts by non-administrators are blocked in automated regression tests.
- **SC-004**: Signed-in users can identify all of their active roles from their profile without contacting support, validated by acceptance tests covering all role combinations.
- **SC-005**: Authorization checks for leader and administrator capabilities pass automated allow/deny suites with no contradictory outcomes when multiple roles are active.

## Assumptions

- "Profile" in this feature means the user's role-bearing identity exposed after authentication, not a separate social or HR profile module.
- Leader and administrator roles are organizational grants, not self-selected by the end user.
- Only administrators manage leader and administrator assignments; there is no self-service promotion.
- Collaborator is mandatory and non-revocable; leader and administrator are optional overlays.
- Hierarchical reporting relationships required for leader visibility may be defined or extended in related features; this feature defines leader as the role that enables hierarchical visibility once relationships exist.
- Pre-existing users receive collaborator via backfill; no migration downtime is required beyond standard deployment.
- Role changes take effect for authorization on the next authenticated request or session refresh after the change is saved.
- The product continues to use Google-only sign-in; this feature does not change authentication method.
