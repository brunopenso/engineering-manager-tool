# Feature Specification: Leader Hierarchy Management

**Feature Branch**: `008-leader-hierarchy-management`  
**Created**: 2026-05-27  
**Status**: Draft  
**Input**: User description: "create a screen only available for leaders so the leader can change the hierachy below him. This screen should have 2 features: 1. Search for users that do not have an leader associated and add the hability to add the leader that is logged as his leader 2. Transfer the leadership to other leader informing the leader email"

## Clarifications

### Session 2026-05-27

- Q: How should orphan-user search matching work? -> A: Search by name or email, with partial or full match.
- Q: Should transfer-leadership remain in scope? -> A: No, remove transfer-leadership from requirements.
- Q: Are contracts/plan aligned with clarified scope? -> A: Yes, contracts and plan include only orphan search and assignment.

## User Scenarios & Testing *(mandatory, with required automated tests)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Assign Orphan Users to Logged-In Leader (Priority: P1)

As a leader, I can search users who currently have no leader assigned and claim them under my hierarchy from a dedicated management screen.

**Why this priority**: This is the core value of the request and enables immediate hierarchy cleanup without depending on another leader.

**Automated Test Requirement**: Add tests at `tests/008-leader-hierarchy-management/assign-orphan-users.test.md` covering role-based access, orphan-user search behavior, successful assignment, and duplicate-assignment prevention.

**Frontend Design**: Implementation MUST use the `frontend-design` skill with Material UI best practices for the new management screen.

**Access Control Validation**: Leaders can view and claim only users with no leader. Non-leaders are denied access to the screen and assignment action.

**Acceptance Scenarios**:

1. **Given** a logged-in leader opens hierarchy management, **When** they search with an empty query, **Then** only users without a leader are listed.
2. **Given** a logged-in leader searches by full or partial name/email, **When** matching orphan users exist, **Then** matching users are returned and can be assigned to the logged-in leader.
3. **Given** a user already has a leader, **When** assignment is attempted from this workflow, **Then** the system rejects the assignment and explains the user is no longer eligible.

---

### User Story 2 - Restrict Hierarchy Management to Leaders (Priority: P2)

As the business owner, I need hierarchy changes to be limited to authorized leaders so organizational data remains secure.

**Why this priority**: This guarantees governance for both requested actions and prevents privilege abuse.

**Independent Test**: Add access restriction tests at `tests/008-leader-hierarchy-management/hierarchy-access-control.test.md` validating allow/deny outcomes for leaders, collaborators, and unauthenticated users.

**Frontend Design**: If a non-leader navigates to this route, the UI must show an authorization error state consistent with existing design standards.

**Access Control Validation**: Leader role is required for viewing, searching, and assigning. Non-leaders and unauthenticated users are denied all actions.

**Acceptance Scenarios**:

1. **Given** an authenticated non-leader accesses the hierarchy management route, **When** the page loads, **Then** access is denied and no hierarchy data is shown.
2. **Given** an unauthenticated user calls hierarchy management actions, **When** the request is processed, **Then** the request is rejected.

---

### Edge Cases

- Two leaders attempt to assign the same orphan user at nearly the same time.
- Search query returns no orphan users.
- Query has only partial text and still needs to match correctly.

## Requirements *(mandatory, with required test coverage)*

### Functional Requirements

*All functional requirements MUST be covered by automated tests. Define the test(s) for each requirement below.*

*For features that expose collaborator or organizational data, requirements MUST define a hierarchical DAC matrix that allows only self + descendants (recursive) and denies peer/superior visibility for every API endpoint, report, and visualization in scope.*

- **FR-001**: The system MUST provide a hierarchy management screen that is accessible only to authenticated users with leader role.
- **FR-002**: The system MUST allow a leader to search users who currently do not have a leader assigned using name or email, with both partial and full matching.
- **FR-003**: The system MUST allow a leader to assign themselves as leader of an eligible user with no current leader.
- **FR-004**: The system MUST prevent assignment when the selected user already has a leader at the moment of confirmation.
- **FR-005**: The system MUST show a clear success or error message for assignment actions.
- **FR-006**: The system MUST record an auditable event for each successful assignment, including actor, affected user, previous leader state, new leader state, and timestamp.

### Access Control Matrix *(required when data visibility is in scope)*

| Actor | Allowed Data Visibility | Explicitly Denied Visibility | Validation Notes |
|-------|--------------------------|-------------------------------|------------------|
| Leader (logged in) | Orphan users for assignment | Users that already have a leader | Validate with Story 1 and Story 2 tests |
| Collaborator (non-leader) | None for this screen and actions | All hierarchy-management datasets and actions | Validate with Story 2 deny tests |
| Unauthenticated user | None | All hierarchy-management datasets and actions | Validate with Story 2 deny tests |

### Key Entities *(include if feature involves data)*

- **Hierarchy Assignment Action**: A leader-initiated operation that links an orphan user to the acting leader as direct manager.
- **Hierarchy Assignment Audit Event**: An immutable record of a completed assignment with actor, target user, previous leader state, new leader state, and time of change.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of eligible assignment operations (orphan user to logged-in leader) are completed successfully on first attempt.
- **SC-002**: 100% of unauthorized hierarchy-management attempts by non-leaders are blocked.
- **SC-003**: 95% of search queries by full or partial name/email return expected orphan-user matches in validation tests.
- **SC-004**: Leaders can complete an assignment action in under 90 seconds in usability validation sessions.

## Assumptions

- Existing role definitions already identify which users are leaders.
- The leader can assign only users who currently have no leader.
- Name and email fields used for search are already available in user records.
- Existing authentication and session handling are reused without changes.
