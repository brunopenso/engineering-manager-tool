# Feature Specification: Admin Users List Filters

**Feature Branch**: `013-admin-users-filters`  
**Created**: 2026-06-01  
**Status**: Draft  
**Input**: User description: "in the route /app/admin/users I need to filter the users, lets create the option to filter by name(full or parcial), email (full or parcial) and role."

## User Scenarios & Testing *(mandatory, with required automated tests)*

### User Story 1 - Administrator filters users by name (Priority: P1)

A signed-in administrator on the Admin Users screen (`/app/admin/users`) can type a full or partial name so the system returns only users whose display name matches, making it easier to find a specific person in a growing user directory.

**Why this priority**: Name search is the most common way to locate an individual when granting or revoking roles.

**Automated Test Requirement**: Add tests under `tests/013-admin-users-filters/` covering: full name match; partial substring match; case-insensitive match; leading/trailing spaces trimmed; empty name field does not exclude users by name; non-administrators cannot access filtered results.

**Frontend Design**: The Admin Users screen filter area MUST use the `frontend-design` skill with Material UI best practices—a labeled name search field above the users table with clear placeholder text indicating partial search is supported.

**Access Control Validation**: Only users with the administrator role may view or filter the organization user list; collaborators and leaders without administrator cannot access the screen or filtered data.

**Acceptance Scenarios**:

1. **Given** an administrator on the Admin Users screen with multiple users listed, **When** they enter a full name that matches exactly one user and apply the filter, **Then** only that user appears in the table.
2. **Given** an administrator enters a partial name that matches several users, **When** the filter is applied, **Then** all users whose display name contains that text (ignoring letter case) are shown.
3. **Given** an administrator leaves the name field empty, **When** other filters are applied or the list reloads, **Then** the name criterion does not exclude any users.

---

### User Story 2 - Administrator filters users by email (Priority: P1)

An administrator can type a full or partial email address so the system returns only users whose email matches, supporting lookup when the display name is unknown or ambiguous.

**Why this priority**: Email is a stable unique identifier and is often used for support and access-management workflows.

**Automated Test Requirement**: Add tests under `tests/013-admin-users-filters/` covering: full email match; partial substring match; case-insensitive match; empty email field does not exclude by email; combined with name filter (AND across filter types).

**Frontend Design**: The email filter MUST use the `frontend-design` skill with Material UI best practices—labeled text field consistent with the name filter, placed in the same filter group above the table.

**Access Control Validation**: Email filtering applies only within the administrator-visible user list; no other role may obtain filtered user records.

**Acceptance Scenarios**:

1. **Given** an administrator enters a complete email that matches one user, **When** the filter is applied, **Then** only that user is shown.
2. **Given** an administrator enters a partial email (e.g., domain or local part), **When** the filter is applied, **Then** all users whose email contains that text (ignoring letter case) are shown.
3. **Given** the administrator leaves the email field empty, **When** the list reloads, **Then** email does not exclude users.

---

### User Story 3 - Administrator filters users by role (Priority: P1)

An administrator can narrow the list to users who hold one or more selected roles (Collaborator, Leader, Administrator) so they can focus on accounts that need elevated access review or baseline collaborator-only accounts.

**Why this priority**: Role-based filtering directly supports the screen’s purpose of managing leader and administrator assignments.

**Automated Test Requirement**: Add tests under `tests/013-admin-users-filters/` covering: filter by Collaborator only; filter by Leader; filter by Administrator; multi-role selection (union); users with multiple roles appear when any selected role matches; no role selected means role does not exclude; collaborator is implicit on every account but still filterable when explicitly selected.

**Frontend Design**: The role filter MUST use the `frontend-design` skill with Material UI best practices—multi-select or equivalent control showing the three role labels consistently with role badges in the table.

**Access Control Validation**: Role filter results remain limited to the full user directory visible only to administrators; filtering does not expose users outside the admin list scope.

**Acceptance Scenarios**:

1. **Given** an administrator selects only "Leader", **When** the list reloads, **Then** only users who currently have the leader role are shown.
2. **Given** an administrator selects "Leader" and "Administrator", **When** the list reloads, **Then** users who have either role (or both) are shown.
3. **Given** no role is selected, **When** the list reloads, **Then** role does not exclude users.
4. **Given** every user has the collaborator role by default, **When** the administrator filters by "Collaborator" only, **Then** users without leader or administrator (collaborator-only) and users who also hold elevated roles are included if they have the collaborator role active.

---

### User Story 4 - Administrator combines filters and resets (Priority: P2)

An administrator applies name, email, and role filters together, receives the intersection from the system, and can clear all filters to return to the full user list.

**Why this priority**: Combined filtering matches real admin workflows; reset avoids dead-ends when filters narrow to zero rows.

**Automated Test Requirement**: Add tests under `tests/013-admin-users-filters/` covering: AND logic across name, email, and role on the server; filtered empty state; clear all filters restores unfiltered list; existing grant/revoke actions still work on visible rows after filtering.

**Frontend Design**: Filters MUST be grouped at the top of the Admin Users screen (above the table) with a single "Clear all filters" action when any filter is active, following Material UI layout patterns from the `frontend-design` skill.

**Access Control Validation**: Combined filtering never changes who may access the screen—only administrators—and never reveals data beyond the standard admin user list.

**Acceptance Scenarios**:

1. **Given** an administrator sets a partial name, partial email, and one or more roles, **When** the list reloads, **Then** only users satisfying **all active** filter types are shown.
2. **Given** active filters match no users, **When** the table updates, **Then** the administrator sees an empty filtered state message distinct from a loading or error state.
3. **Given** multiple filters are active, **When** the administrator chooses "Clear all filters", **Then** name and email fields clear, role selection clears, and the full user list is shown again.
4. **Given** a filtered list shows a user, **When** the administrator grants or revokes a role, **Then** the action succeeds and the list refreshes using the current filter criteria.

---

### Edge Cases

- Name or email with only whitespace: treat as empty (no exclusion by that field).
- Partial match with special characters in email (e.g., `+`, `.`): match literally on the stored email string after normalization (trim, case-insensitive compare).
- User with multiple roles: appears when any selected role in a multi-role filter matches (OR within roles).
- All filters active but zero matches: show filtered empty state with guidance to clear filters.
- Very short partial search (e.g., one character): allowed; may return many rows.
- Non-administrator navigates to `/app/admin/users`: access denied as today; filter controls are not usable.
- Filter active while list is loading: show loading state without flashing unfiltered data as the final result.

## Requirements *(mandatory, with required test coverage)*

### Functional Requirements

*All functional requirements MUST be covered by automated tests. This feature extends the existing administrator-only Admin Users screen; it does not change who may grant or revoke roles.*

- **FR-001**: The system MUST expose filter controls on the **Admin Users screen** (`/app/admin/users`) above the users table, without removing existing role grant/revoke actions.
- **FR-002**: The system MUST provide a **name filter** as a free-text field supporting **full or partial** match against each user’s display name.
- **FR-003**: When the name field has non-empty content after trimming, the **backend** MUST return only users whose display name contains the entered text, using **case-insensitive** comparison.
- **FR-004**: The system MUST provide an **email filter** as a free-text field supporting **full or partial** match against each user’s email address.
- **FR-005**: When the email field has non-empty content after trimming, the **backend** MUST return only users whose email contains the entered text, using **case-insensitive** comparison.
- **FR-006**: The system MUST provide a **role filter** allowing selection of zero or more of: **Collaborator**, **Leader**, **Administrator**.
- **FR-007**: When one or more roles are selected, the **backend** MUST return only users who **currently hold at least one** of the selected roles (OR within roles); when none are selected, role MUST NOT exclude users.
- **FR-008**: Active filters across name, email, and role MUST combine with **logical AND** on the **backend** (a user must satisfy every active filter type to be returned).
- **FR-009**: The system MUST provide a **clear all filters** action that clears name, email, and role selections and reloads the **full** user list from the backend.
- **FR-010**: The system MUST distinguish **no users in the organization** from **no users match current filters** with appropriate messaging when the filtered result is empty.
- **FR-011**: Only users with the **administrator** role MAY request filtered user lists; other roles MUST be denied as for the existing user list.
- **FR-012**: The administrator user list MUST accept filter parameters (optional name text, optional email text, optional role selections) and return only matching rows; the screen MUST NOT download the full user list for client-side filtering only.
- **FR-013**: After grant or revoke role actions, the list MUST refresh using the **current** filter parameters.

### Access Control Matrix *(required when data visibility is in scope)*

| Actor | Allowed Data Visibility | Explicitly Denied Visibility | Validation Notes |
|-------|--------------------------|-------------------------------|------------------|
| Administrator | Full organization user list on `/app/admin/users`, filtered by backend query | N/A within admin scope | API and UI tests with administrator session |
| Leader (non-admin) | Unchanged—no access to admin user list | All users on admin screen | Regression: forbidden on list and filtered list |
| Collaborator (non-admin) | Unchanged—no access to admin user list | All users on admin screen | Regression: forbidden on list and filtered list |

### Key Entities

- **User (admin list row)**: Organization member shown on the Admin Users screen; attributes relevant to filtering include **display name**, **email**, and **active roles** (Collaborator, Leader, Administrator).
- **Filter criteria**: Optional name text, optional email text, optional set of role selections; sent to the backend on each list request.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Administrators see an updated user list within 5 seconds after changing any filter under normal conditions.
- **SC-002**: In task-based testing, 90% of administrators can find a target user using only a partial name or partial email on the first attempt without documentation.
- **SC-003**: Filtered empty state and “no users in organization” (if applicable) are visually and textually distinct so administrators do not confuse “no matches” with system errors.
- **SC-004**: After using "Clear all filters," automated tests confirm the visible list matches the unfiltered backend user list.
- **SC-005**: Zero list responses are returned to non-administrator sessions across authorization test fixtures (100% deny rate).

## Assumptions

- The **Admin Users screen** (`/app/admin/users`) is the sole in-scope surface; profile and hierarchy screens are unchanged.
- **Backend filtering** is mandatory for name, email, and role; the client sends filter parameters and renders the returned list.
- **Partial match** means substring containment after trim, compared case-insensitively for name and email.
- **Role filter** uses **union (OR)** within selected roles; **AND** applies across name, email, and role filter types on the server.
- On initial screen load, **no filters are active** and the full user list is shown (no default narrowing).
- Filter values are **session-local** to the screen visit unless a future feature adds persistence.
- Role labels and semantics match the existing product model: every user has Collaborator; Leader and Administrator are optional elevated roles.
- Existing administrator-only access rules for the user list and role changes remain in force.
