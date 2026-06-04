# Feature Specification: Administrator GitHub Organization Configuration

**Feature Branch**: `015-admin-github-orgs`  
**Created**: 2026-06-04  
**Status**: Draft  
**Input**: User description: "create a new menu for administration purposes that will handle github integration configurations. Lets start by creating a screen, entity, migrations to save a list of github organizations that are enabled."

## Clarifications

### Session 2026-06-04

- Q: What are the canonical persistence and administration API names for enabled GitHub organizations? → A: Use the **github_integrations** table (persistence) and the **github-integrations** administration API resource (list, enable, disable).

## User Scenarios & Testing *(mandatory, with required automated tests)*

### User Story 1 - Administrator opens GitHub integration configuration (Priority: P1)

An administrator opens a new item under the **Administration** area of the application menu and lands on a **GitHub integration** configuration screen where they can see which GitHub organizations are currently enabled for the product.

**Why this priority**: Without a dedicated admin entry point and screen, organization configuration cannot be managed or discovered.

**Automated Test Requirement**: Add tests under `tests/015-admin-github-orgs/` covering: administrator sees the new menu item and can open the configuration screen; non-administrators do not see the menu item and cannot access the screen; empty state when no organizations are enabled yet.

**Frontend Design**: The GitHub integration configuration screen and Administration menu entry MUST use the `frontend-design` skill with Material UI best practices—consistent with existing Administration screens (for example user roles and tags).

**Access Control Validation**: Only users with the **administrator** role may see the menu entry and open the configuration screen; collaborators and leaders without administrator are denied.

**Acceptance Scenarios**:

1. **Given** a signed-in administrator, **When** they open the Administration menu, **Then** they see a **GitHub integration** (or equivalent clear label) option alongside existing administration items.
2. **Given** an administrator selects that menu option, **When** the screen loads, **Then** they see a GitHub integration configuration view with a list area for enabled organizations.
3. **Given** no organizations are enabled yet, **When** an administrator opens the screen, **Then** they see an empty state explaining that they can add the first enabled organization.
4. **Given** a signed-in user without the administrator role, **When** they view the shell menu or navigate directly to the configuration route, **Then** access is denied and no configuration data is shown.

---

### User Story 2 - Administrator enables a GitHub organization (Priority: P1)

An administrator adds a GitHub organization to the enabled list by providing its organization identifier (login/slug) so the product can treat that organization as part of the integration scope.

**Why this priority**: Persisting the enabled organization list is the core data outcome requested for this phase of GitHub integration configuration.

**Automated Test Requirement**: Add tests under `tests/015-admin-github-orgs/` covering: valid organization is saved and appears in the list; duplicate organization cannot be added twice; invalid format is rejected with clear feedback; whitespace is trimmed; non-administrator enable attempts are denied.

**Frontend Design**: The add/enable control on the configuration screen MUST use the `frontend-design` skill with Material UI best practices—labeled input for organization login, helper text clarifying it is the GitHub organization slug (not a URL), and inline validation errors.

**Access Control Validation**: Only administrators may add organizations to the enabled list.

**Acceptance Scenarios**:

1. **Given** an administrator on the GitHub integration screen, **When** they enter a valid organization login and confirm add/enable, **Then** the organization appears in the enabled list.
2. **Given** an organization is already enabled, **When** an administrator attempts to add the same organization again, **Then** the system does not create a duplicate and shows an appropriate message.
3. **Given** an administrator enters an invalid organization login format, **When** they submit, **Then** the organization is not saved and the user sees which input is invalid.
4. **Given** a non-administrator, **When** they attempt to enable an organization, **Then** the operation is denied.

---

### User Story 3 - Administrator views and maintains the enabled organization list (Priority: P2)

An administrator can review all enabled GitHub organizations on the configuration screen and disable an organization that should no longer be part of the integration scope.

**Why this priority**: Ongoing maintenance of the allowlist is required after initial setup; disabling is the minimum lifecycle action beyond add for a configuration list.

**Automated Test Requirement**: Add tests under `tests/015-admin-github-orgs/` covering: list returns all enabled organizations with stable identifiers; disable removes organization from enabled list (or marks disabled per product rules); reload shows updated list; non-administrator list and disable denied.

**Frontend Design**: The enabled-organization list MUST use the `frontend-design` skill with Material UI best practices—readable table or list with organization login and a clear disable/remove action with confirmation when appropriate.

**Access Control Validation**: List and disable actions are administrator-only.

**Acceptance Scenarios**:

1. **Given** multiple organizations are enabled, **When** an administrator opens the GitHub integration screen, **Then** all enabled organizations are listed with their organization login visible.
2. **Given** an administrator disables an enabled organization, **When** the action completes, **Then** that organization no longer appears as enabled on the next load of the screen.
3. **Given** a non-administrator, **When** they request the enabled organization list or attempt to disable an entry, **Then** the operation is denied.

---

### Edge Cases

- Organization login differs only by letter case: system treats organization logins in a consistent normalized form for uniqueness while displaying a clear canonical value.
- Administrator adds organization with leading/trailing spaces: system trims before validation and storage.
- Last enabled organization is disabled: empty state appears; product does not assume at least one organization must remain (unless later policy requires it).
- Concurrent administrators add the same organization: only one enabled record exists; second attempt receives duplicate feedback.
- Configuration screen accessed while session expires: user is redirected to sign-in without exposing organization data.
- Very long but valid organization login at maximum allowed length: accepted if format rules pass.

## Requirements *(mandatory, with required test coverage)*

### Functional Requirements

*All functional requirements MUST be covered by automated tests. This feature establishes the **enabled GitHub organization allowlist** only; it does not include OAuth credentials, repository sync, webhooks, or end-user GitHub profile linking.*

- **FR-001**: The system MUST provide an **Administration** menu entry for **GitHub integration configuration** visible only to users with the **administrator** role.
- **FR-002**: The system MUST provide a dedicated **GitHub integration configuration screen** reachable from that menu entry.
- **FR-003**: The system MUST persist each **enabled GitHub organization** as a distinct record in the **github_integrations** catalog, with a stable identifier and organization login (slug).
- **FR-004**: The system MUST store organization login using rules appropriate to GitHub organization slugs (alphanumeric ASCII and hyphens, reasonable length limit, no spaces or full URLs).
- **FR-005**: The system MUST trim leading and trailing whitespace from organization login before validation and storage.
- **FR-006**: The system MUST enforce **unique** organization login among enabled records (no duplicates).
- **FR-007**: The system MUST allow an administrator to **add** an organization to the enabled list from the configuration screen.
- **FR-008**: The system MUST allow an administrator to **view** the full list of enabled organizations on the configuration screen.
- **FR-009**: The system MUST allow an administrator to **disable** (remove from enabled list) an organization from the configuration screen.
- **FR-010**: The system MUST reject invalid organization login values with clear validation feedback and must not persist invalid entries.
- **FR-011**: The system MUST deny non-administrators from viewing, adding, or disabling enabled organizations through menu, screen, or data access paths.
- **FR-012**: The system MUST deliver schema changes through **migrations** that create the **github_integrations** storage without manual ad-hoc steps.
- **FR-015**: The system MUST expose administrator list, enable, and disable operations through a **github-integrations** administration API resource (stable resource name across list, create, and remove operations).
- **FR-013**: The configuration screen MUST show an appropriate **empty state** when no organizations are enabled.
- **FR-014**: The system MUST retain enabled organization data across application restarts (durable persistence).

### Access Control Matrix *(required when data visibility is in scope)*

| Actor | Allowed | Explicitly denied | Validation notes |
|-------|---------|-------------------|------------------|
| Administrator | View configuration screen; list, add, and disable enabled GitHub organizations | N/A for this feature’s admin scope | Tests for menu visibility, screen access, and CRUD allow |
| Collaborator | None | GitHub integration menu, screen, and organization configuration data | Deny navigation and data operations |
| Leader (without administrator) | None | Same as collaborator | Deny navigation and data operations |
| Unauthenticated | None | All configuration access | Redirect or block without data leak |

*This feature manages **global integration configuration**, not per-user or hierarchical organizational data; hierarchical DAC rules for collaborator records do not apply.*

### Key Entities

- **GitHub integration** (persisted): One enabled GitHub organization stored in **github_integrations**—stable identifier plus organization login (slug).
- **GitHub integration configuration (logical)**: The administrator-managed allowlist (backed by **github_integrations**) and the screen used to maintain it; accessed via the **github-integrations** administration API.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An administrator can add a valid GitHub organization to the enabled list and see it on the configuration screen in under 1 minute without support.
- **SC-002**: 100% of duplicate or invalid organization submissions are blocked in automated tests with user-visible feedback.
- **SC-003**: 100% of non-administrator attempts to access the configuration screen or modify the enabled list are denied in security regression tests.
- **SC-004**: After disabling an organization, 100% of automated reload tests show it no longer in the enabled list.
- **SC-005**: Administrators can locate GitHub integration configuration from the Administration menu in a single navigation step in usability acceptance checks.

## Assumptions

- **Organization login** means the public GitHub organization slug (for example `acme-corp`), not a full `https://github.com/...` URL.
- This phase is **configuration only**: storing which organizations are enabled; live verification against the GitHub API, tokens, and repository access are out of scope for this feature.
- At least **one** administrator exists in the product (existing role model from user role profiles).
- The enabled list applies to the **whole product instance** (single tenant configuration), not per-team overrides.
- **Disable** means the organization is no longer enabled for integration; hard-delete vs soft-disable is an implementation choice as long as disabled organizations do not appear as enabled in the UI.
- No requirement that at least one organization remain enabled at all times in this release.
- Future GitHub integration features (user linking, sync jobs) will consume this allowlist; this feature does not implement those consumers yet.
- Menu label **GitHub integration** (or close variant) is acceptable unless product naming standards dictate otherwise.
- Canonical names are fixed for this feature: persistence table **github_integrations**; administration API resource **github-integrations** (each row represents one enabled organization login).
