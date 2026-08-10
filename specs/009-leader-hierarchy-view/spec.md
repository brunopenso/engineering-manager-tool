# Feature Specification: Leader Hierarchy View

**Feature Branch**: `009-leader-hierarchy-view`  
**Created**: 2026-05-27  
**Status**: Draft  
**Input**: User description: "create a screen only available for leaders to show the current hierarchy above(limit to 1 level) and bellow(all hierachy). This screen should show with collapsable itens but only the current position should be open to see the next layer. And each item on this list should have the name of the person"

## User Scenarios & Testing _(mandatory, with required automated tests)_

### User Story 1 - View Organizational Tree Around Current Position (Priority: P1)

As a leader, I can open a dedicated hierarchy view screen that shows my direct manager (at most one level above), myself, and my full reporting subtree below, so I understand my place in the organization at a glance.

**Why this priority**: This is the primary value of the feature—read-only visibility of reporting lines without changing hierarchy data.

**Automated Test Requirement**: Add tests at `tests/009-leader-hierarchy-view/hierarchy-tree-display.test.md` (and corresponding UI/API tests under `tests/009-leader-hierarchy-view/`) covering: leader access, one-level-above limit, full subtree below, person names on every node, and initial expand state for the current position.

**Frontend Design**: Implementation MUST use the `frontend-design` skill with Material UI best practices for the hierarchy tree screen.

**Access Control Validation**: The logged-in leader sees only their direct manager (if any), themselves, and users in their descendant subtree. Peers, users in other branches, and leaders more than one level above are not shown.

**Acceptance Scenarios**:

1. **Given** a logged-in leader with a direct manager and multiple levels of reports, **When** they open the hierarchy view, **Then** they see their direct manager (one level up), themselves, and all users reporting to them directly or indirectly, each labeled with the person's name.
2. **Given** a logged-in leader with no assigned manager, **When** they open the hierarchy view, **Then** no "above" nodes are shown and the tree starts at their position with their subtree below.
3. **Given** a logged-in leader on the hierarchy view, **When** the screen first loads, **Then** only the node representing the current user is expanded, revealing the immediate next layer (direct manager above and direct reports below); all other nodes start collapsed.
4. **Given** a collapsed node in the tree, **When** the leader expands it, **Then** only that node's direct children are revealed (one layer at a time); deeper levels remain collapsed until explicitly expanded.

---

### User Story 2 - Navigate and Identify Current Position (Priority: P2)

As a leader, I can clearly recognize which node is "me" in the tree and use collapse/expand controls to explore deeper levels of my subtree without losing context.

**Why this priority**: Usability depends on distinguishing the current position and predictable tree interaction beyond the initial state.

**Independent Test**: Add tests at `tests/009-leader-hierarchy-view/hierarchy-tree-interaction.test.md` validating current-position highlighting, expand/collapse behavior, and that expanding a descendant does not expose users outside the leader's subtree.

**Frontend Design**: The current user's node MUST be visually distinct from other nodes (for example label, badge, or emphasis) while following existing app design standards.

**Access Control Validation**: Expanding any visible node MUST NOT load or display users outside the allowed visibility set (direct manager, self, descendants).

**Acceptance Scenarios**:

1. **Given** the hierarchy view is loaded, **When** the leader scans the tree, **Then** the node for the logged-in user is clearly marked as their current position.
2. **Given** a multi-level subtree, **When** the leader expands a direct report who has their own reports, **Then** that report's direct children appear and no sibling branches outside the leader's subtree are shown.
3. **Given** a leader collapses an expanded node, **When** the collapse completes, **Then** that node's descendants are hidden until expanded again.

---

### User Story 3 - Restrict Hierarchy View to Leaders (Priority: P3)

As the business owner, I need the hierarchy view to be available only to leaders so organizational structure is not exposed to unauthorized roles.

**Why this priority**: Governance ensures the read-only tree respects the same leader-only boundary as other leader capabilities.

**Independent Test**: Add tests at `tests/009-leader-hierarchy-view/hierarchy-view-access-control.test.md` validating allow/deny for leaders, collaborators, and unauthenticated users.

**Frontend Design**: Non-leaders who navigate to this route MUST see an authorization error state consistent with existing leader-only screens.

**Access Control Validation**: Leader role is required to view the tree. Non-leaders and unauthenticated users are denied the screen and underlying data.

**Acceptance Scenarios**:

1. **Given** an authenticated non-leader navigates to the hierarchy view route, **When** the page loads, **Then** access is denied and no organizational tree data is shown.
2. **Given** an unauthenticated request for hierarchy view data, **When** the request is processed, **Then** the request is rejected.

---

### Edge Cases

- Leader has no direct manager (`leaderId` is null): tree shows only self and descendant subtree.
- Leader has no direct reports: current-position node is expanded but shows no children below.
- Leader has a very large subtree: tree remains usable (collapsed by default except current position); performance expectations are covered in success criteria.
- A person in the subtree has a missing or blank display name: show a clear fallback label (for example email) so every node remains identifiable.
- Direct manager exists but their display name is unavailable: apply the same fallback labeling rule as for other nodes.

## Requirements _(mandatory, with required test coverage)_

### Functional Requirements

_All functional requirements MUST be covered by automated tests._

- **FR-001**: The system MUST provide a leader-only hierarchy view screen separate from hierarchy management (assignment) workflows.
- **FR-002**: The system MUST display at most one level above the logged-in leader—their direct manager only—and MUST NOT display higher ancestors, peers, or users in other branches.
- **FR-003**: The system MUST display the full reporting hierarchy below the logged-in leader (all direct and indirect reports).
- **FR-004**: Every node in the tree MUST show the person's display name; if display name is unavailable, the system MUST show an agreed fallback identifier (email) so the node is never unlabeled.
- **FR-005**: The tree MUST use collapsible nodes; on initial load, only the node for the logged-in leader MUST be expanded, revealing exactly one layer adjacent to that node (direct manager above and direct reports below).
- **FR-006**: Expanding any collapsed node MUST reveal only that node's direct children; deeper descendants MUST remain collapsed until their parent node is expanded.
- **FR-007**: The system MUST visually distinguish the logged-in leader's node as the current position in the tree.
- **FR-008**: The system MUST deny access to the hierarchy view screen and its data for non-leader and unauthenticated users.
- **FR-009**: The hierarchy view MUST be read-only on this screen; it MUST NOT expose assignment or hierarchy-editing actions (those remain on the existing hierarchy management feature).

### Access Control Matrix _(required when data visibility is in scope)_

| Actor                     | Allowed Data Visibility                          | Explicitly Denied Visibility                                                | Validation Notes        |
| ------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------- | ----------------------- |
| Leader (logged in)        | Direct manager (max 1 up), self, all descendants | Peers, second-level+ managers, other branches, orphan users outside subtree | Story 1, 2, and 3 tests |
| Collaborator (non-leader) | None for this screen                             | Entire organizational tree                                                  | Story 3 deny tests      |
| Unauthenticated user      | None                                             | Entire organizational tree                                                  | Story 3 deny tests      |

### Key Entities _(include if feature involves data)_

- **Hierarchy Tree Node**: A person shown in the tree with display name (or fallback), relationship to the viewer (manager, self, or report), and expand/collapse state.
- **Current Position**: The tree node representing the authenticated leader; drives initial expand behavior and visual emphasis.
- **Reporting Subtree**: The set of all users who report to the leader directly or indirectly, used to populate nodes below the current position.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of unauthorized access attempts to the hierarchy view by non-leaders are blocked in automated tests.
- **SC-002**: In validation scenarios with a known org shape, 100% of visible nodes show the correct person name (or documented fallback) and no out-of-scope users appear.
- **SC-003**: On first load, 100% of test runs confirm only the current-position node is expanded and adjacent layers match the one-level-up / direct-reports rule.
- **SC-004**: Leaders can locate their direct manager and at least one direct report (when they exist) within 30 seconds in usability validation sessions.
- **SC-005**: For subtrees up to 200 people, the hierarchy view becomes interactive within 3 seconds on a typical office network connection in validation tests.

## Assumptions

- Leader role identification already exists and matches other leader-only features (for example hierarchy management).
- Each user record includes a display name field (for example `fullName`); email is an acceptable fallback when name is missing.
- Reporting relationships are already stored via a single `leaderId` (or equivalent) per user, forming a tree rooted upward.
- This feature is read-only; changing hierarchy remains on the existing leader hierarchy management screen (`008-leader-hierarchy-management`).
- The new screen is reachable from the authenticated app shell navigation for leaders only.
- "Collapsible items" means standard tree expand/collapse controls, not inline editing of hierarchy data.
