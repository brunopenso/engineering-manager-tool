# Feature Specification: Leader Team Deliverables

**Feature Branch**: `010-leader-team-deliverables`  
**Created**: 2026-05-29  
**Status**: Draft  
**Input**: User description: "lets create a new screen in the leader section called Team Deliverables that should be access only for the role leader. This screen should have: 1. In the top of the screen a select field showing the hierarchy above the current user, a date filter with fix last 30 days. 2. After selecting the user or change the date a search of the deliverables should be executed and a datatable should be shown contain the title and description."

## User Scenarios & Testing *(mandatory, with required automated tests)*

### User Story 1 - Leader browses a team member's recent deliverables (Priority: P1)

As a leader, I open the Team Deliverables screen, pick a person from my reporting team using the selector at the top, and immediately see that person's deliverables from the last 30 days in a table with title and description so I can prepare for coaching and performance conversations.

**Why this priority**: This is the core value—leaders reviewing subordinate deliverables in one dedicated place without navigating deep links per person.

**Automated Test Requirement**: Add tests at `tests/010-leader-team-deliverables/team-deliverables-search.us1.test.md` (and corresponding UI/API tests under `tests/010-leader-team-deliverables/`) covering: leader-only screen access, team-member selector population from the leader's descendant subtree, automatic search on user selection, 30-day date filter application, and table columns (title and description only).

**Frontend Design**: Implementation MUST use the `frontend-design` skill with Material UI best practices for the Team Deliverables screen, including a clear filter bar at the top (person selector and fixed date preset) and a readable data table below.

**Access Control Validation**: The leader may select and view deliverables only for users in their direct or indirect reporting subtree. Peers, superiors, users in other branches, and the leader's own deliverables via this team selector flow are out of scope for the selector list (self is excluded from the team picker because this screen is for reviewing team members). Read access for selected subordinates follows the existing deliverables hierarchy rules (read-only).

**Acceptance Scenarios**:

1. **Given** a logged-in leader with at least one direct or indirect report who has deliverables updated in the last 30 days, **When** they open Team Deliverables and select that report, **Then** a data table appears showing only that person's deliverables from the last 30 days with title and description columns populated.
2. **Given** a logged-in leader on Team Deliverables, **When** the screen first loads, **Then** the person selector lists all direct and indirect reports by display name (with email fallback when name is missing) and no search results are shown until a person is selected.
3. **Given** a leader has selected a team member, **When** they change the selection to another team member in their subtree, **Then** the deliverables search runs again and the table updates to show the newly selected person's results.
4. **Given** a selected team member has no deliverables updated in the last 30 days, **When** the search completes, **Then** the table shows an empty state explaining that no deliverables match the current filters.

---

### User Story 2 - Fixed last-30-days date filter (Priority: P1)

As a leader, I see that deliverable results are always scoped to the last 30 days so I focus on recent work without configuring date ranges.

**Why this priority**: The date window is a primary filter paired with person selection; it defines what "recent team output" means on this screen.

**Automated Test Requirement**: Add tests at `tests/010-leader-team-deliverables/team-deliverables-date-filter.us2.test.md` validating that only deliverables whose last-updated timestamp falls within the rolling 30-day window (inclusive of today) are returned; deliverables older than 30 days are excluded.

**Frontend Design**: The date filter MUST appear in the top filter bar as a fixed, read-only preset labeled clearly (for example "Last 30 days") so leaders understand the scope without expecting a custom range picker in v1.

**Access Control Validation**: Date filtering applies after authorization; unauthorized users never receive deliverable rows regardless of date.

**Acceptance Scenarios**:

1. **Given** a team member has one deliverable updated 10 days ago and one updated 40 days ago, **When** a leader selects that member, **Then** only the deliverable updated 10 days ago appears in the table.
2. **Given** a leader is viewing Team Deliverables, **When** they inspect the filter bar, **Then** the date filter shows a fixed last-30-days preset and does not offer custom start/end date inputs in v1.
3. **Given** a deliverable was updated exactly 30 days ago (boundary), **When** a leader searches for that owner, **Then** the deliverable is included in results.

---

### User Story 3 - Restrict Team Deliverables to leaders (Priority: P2)

As the business owner, I need the Team Deliverables screen available only to users with the leader role so team deliverable portfolios are not exposed through this workflow to unauthorized roles.

**Why this priority**: Access control is essential but secondary to the primary browse flow once leader role checks align with other leader-only screens.

**Automated Test Requirement**: Add tests at `tests/010-leader-team-deliverables/team-deliverables-access-control.us3.test.md` validating allow for leaders, deny for non-leader collaborators and unauthenticated users, and deny API access when requesting deliverables for users outside the leader's subtree.

**Frontend Design**: Non-leaders who navigate to this route MUST see an authorization outcome consistent with existing leader-only screens (redirect or denial without data).

**Access Control Validation**: Leader role is required for the screen and underlying search. Non-leaders cannot list subtree members for this feature or retrieve deliverables through its search endpoint.

**Acceptance Scenarios**:

1. **Given** an authenticated collaborator without the leader role navigates to Team Deliverables, **When** the page loads, **Then** access is denied and no team member list or deliverable data is shown.
2. **Given** an unauthenticated request for Team Deliverables data, **When** the request is processed, **Then** the request is rejected.
3. **Given** a leader attempts to search deliverables for a user outside their reporting subtree, **When** the search is requested, **Then** the operation is denied and no deliverable rows are returned.

---

### Edge Cases

- Leader has no direct or indirect reports: person selector is empty and the screen shows guidance that no team members are available to review.
- Selected team member has deliverables but all are older than 30 days: empty state for the current filters, not an error.
- Selected team member has a very long description: table remains readable (wrapping or truncation with full text accessible on focus or expand is acceptable in planning; v1 must not hide descriptions entirely).
- Leader's subtree is large: person selector remains usable without unacceptable delay for typical team sizes.
- Team member display name is missing: selector and any labels use email fallback.
- Network or search failure while loading deliverables: user sees a clear error message and can retry by changing selection or reloading.
- Leader loses leader role while on the screen: subsequent navigation or refresh denies access consistently with other leader routes.
- Concurrent selection changes: only the latest selection's results are shown (no stale table from an earlier request).

## Requirements *(mandatory, with required test coverage)*

### Functional Requirements

*All functional requirements MUST be covered by automated tests. This feature exposes subordinate deliverable data and MUST enforce hierarchical DAC on every search and selector population path.*

- **FR-001**: The system MUST provide a **Team Deliverables** screen in the authenticated application shell under the Leader section, reachable from leader navigation.
- **FR-002**: The system MUST restrict access to the Team Deliverables screen and its search capability to users with the **leader** role only.
- **FR-003**: The system MUST display at the top of the screen a **person selector** listing every direct and indirect report in the logged-in leader's reporting subtree, each labeled with display name (email fallback when display name is unavailable).
- **FR-004**: The person selector MUST NOT include peers, superiors, users outside the leader's subtree, or users from other organizational branches.
- **FR-005**: The system MUST display at the top of the screen a **date filter** fixed to the **last 30 days** (rolling window ending today), presented as a non-editable preset in v1.
- **FR-006**: The system MUST apply the date filter using each deliverable's **last-updated** timestamp: include deliverables updated within the last 30 days (inclusive of the boundary day); exclude older deliverables.
- **FR-007**: The system MUST execute a deliverables search automatically when the leader selects or changes the selected team member.
- **FR-008**: The system MUST NOT run a deliverables search until a team member is selected (no default selection on initial load).
- **FR-009**: Search results MUST be shown in a **data table** with exactly two data columns for v1: **title** and **description** (plus any non-data affordances such as row keys for testing).
- **FR-010**: The system MUST enforce read-only access for leaders viewing subordinate deliverables on this screen (no create, edit, or delete actions in v1).
- **FR-011**: The system MUST deny deliverable search when the requested user is not in the logged-in leader's descendant subtree, returning no data and an appropriate authorization outcome.
- **FR-012**: The system MUST show a clear empty state when the selected team member has no deliverables matching the last-30-days filter.
- **FR-013**: The system MUST show a clear empty or informational state when the leader has no team members in their subtree.
- **FR-014**: The system MUST cover all functional requirements with automated tests, including authorization negative cases and date-boundary cases.

### Access Control Matrix *(required when data visibility is in scope)*

Visibility follows organizational reporting position. The Team Deliverables screen is leader-only; within it, leaders may read deliverables only for descendant subtree members.

| Actor | Team Deliverables screen | Person selector options | Search deliverables for user |
|-------|--------------------------|-------------------------|------------------------------|
| Leader (logged in) | Allowed | Direct and indirect reports only | Allowed for subtree members only (read-only); denied otherwise |
| Collaborator (non-leader) | Denied | Denied | Denied |
| Unauthenticated user | Denied | Denied | Denied |
| Leader selecting peer or superior | N/A (not in selector) | Denied (excluded from list) | Denied if requested directly |
| Leader selecting user in another branch | N/A (not in selector) | Denied (excluded from list) | Denied if requested directly |

**Validation notes**: Automated tests MUST cover: non-leader screen deny; unauthenticated deny; subtree member allow with title/description rows; out-of-subtree search deny; peer/superior excluded from selector population.

### Key Entities *(include if feature involves data)*

- **Team member (selector option)**: A user in the logged-in leader's descendant reporting subtree, identified by user id and display name (or email fallback), used to scope deliverable search.
- **Deliverable (search result row)**: An existing deliverable owned by the selected team member; for this screen only **title** and **description** are displayed, filtered by last-updated date within the last 30 days.
- **Date filter preset**: Fixed rolling window of 30 days ending on the current date; not user-configurable in v1.
- **Reporting subtree**: The set of all direct and indirect reports of the logged-in leader, used to populate the person selector and authorize search.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of unauthorized access attempts to Team Deliverables by non-leaders and unauthenticated users are blocked in automated tests.
- **SC-002**: 100% of search attempts for users outside the leader's subtree are denied in automated tests.
- **SC-003**: In validation scenarios with known deliverable timestamps, 100% of results include only deliverables updated within the last 30 days and exclude older items.
- **SC-004**: Leaders with at least one report can select a team member and see matching deliverables (title and description) in under 5 seconds on a typical office network connection in validation tests.
- **SC-005**: Leaders can identify which team member's deliverables they are viewing and distinguish items by title without using another screen (validated in usability checks with sample data).

## Assumptions

- "Leader" means an authenticated user with the leader role, consistent with other leader-only features (hierarchy management, hierarchy view, create user).
- "At the top of the screen" refers to UI placement: the person selector and date filter appear in a filter bar above the results table.
- The person selector lists **team members below the leader** (direct and indirect reports), not superiors or peers; this matches the "Team Deliverables" purpose and existing deliverables read rules from collaborator deliverables (superiors read subordinate deliverables read-only).
- "Fixed last 30 days" means a rolling 30-day window based on the current date, not a calendar month; the filter is not editable in v1 (no custom date range picker).
- Date filtering uses the deliverable **last-updated** timestamp, consistent with how deliverables are ordered elsewhere in the product.
- The data table shows **title** and **description** only in v1; other deliverable fields (impact, tags, links) remain on existing deliverable management or detail surfaces.
- Deliverable entities and hierarchical read authorization already exist; this feature adds a leader-focused discovery screen and filtered search, not a new deliverable data model.
- Reporting relationships are available via the existing organizational hierarchy (single manager per user); subtree resolution reuses the same rules as other leader hierarchy features.
- Initial load does not pre-select a team member; the leader must choose whom to review before results appear.
