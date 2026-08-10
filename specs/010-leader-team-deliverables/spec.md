# Feature Specification: Leader Team Deliverables

**Feature Branch**: `010-leader-team-deliverables`  
**Created**: 2026-05-29  
**Status**: Draft  
**Input**: User description: "lets create a new screen in the leader section called Team Deliverables that should be access only for the role leader. This screen should have: 1. In the top of the screen a select field showing the hierarchy above the current user, a date filter with fix last 30 days. 2. After selecting the user or change the date a search of the deliverables should be executed and a datatable should be shown contain the title and description."

## Clarifications

### Session 2026-05-29

- Q: Should the date filter remain fixed or be user-adjustable? → A: Changeable date range filter, defaulting to the last 30 days selected on initial load.
- Q: What is the "reviewed" field and how does it help leaders? → A: A per-deliverable **reviewed** indicator that the logged-in leader can toggle from the results table; state is stored per leader–deliverable pair so leaders can track which items they have already read across sessions.

## User Scenarios & Testing _(mandatory, with required automated tests)_

### User Story 1 - Leader browses a team member's recent deliverables (Priority: P1)

As a leader, I open the Team Deliverables screen, pick a person from my reporting team using the selector at the top, and immediately see that person's deliverables from the currently selected date range (default last 30 days) in a table with title, description, and reviewed status so I can prepare for coaching and performance conversations.

**Why this priority**: This is the core value—leaders reviewing subordinate deliverables in one dedicated place without navigating deep links per person.

**Automated Test Requirement**: Add tests at `tests/010-leader-team-deliverables/team-deliverables-search.us1.test.md` (and corresponding UI/API tests under `tests/010-leader-team-deliverables/`) covering: leader-only screen access, team-member selector population from the leader's descendant subtree, automatic search on user selection, default 30-day date range application, and table columns (title, description, and reviewed).

**Frontend Design**: Implementation MUST use the `frontend-design` skill with Material UI best practices for the Team Deliverables screen, including a clear filter bar at the top (person selector and changeable date range defaulting to last 30 days) and a readable data table below.

**Access Control Validation**: The leader may select and view deliverables only for users in their direct or indirect reporting subtree. Peers, superiors, users in other branches, and the leader's own deliverables via this team selector flow are out of scope for the selector list (self is excluded from the team picker because this screen is for reviewing team members). Read access for selected subordinates follows the existing deliverables hierarchy rules (read-only for deliverable content; reviewed state is leader-specific).

**Acceptance Scenarios**:

1. **Given** a logged-in leader with at least one direct or indirect report who has deliverables updated in the last 30 days, **When** they open Team Deliverables and select that report, **Then** a data table appears showing only that person's deliverables within the selected date range with title, description, and reviewed columns populated.
2. **Given** a logged-in leader on Team Deliverables, **When** the screen first loads, **Then** the person selector lists all direct and indirect reports by display name (with email fallback when name is missing), the date filter defaults to the last 30 days, and no search results are shown until a person is selected.
3. **Given** a leader has selected a team member, **When** they change the selection to another team member in their subtree, **Then** the deliverables search runs again and the table updates to show the newly selected person's results.
4. **Given** a selected team member has no deliverables updated within the current date range, **When** the search completes, **Then** the table shows an empty state explaining that no deliverables match the current filters.

---

### User Story 2 - Changeable date filter with last-30-days default (Priority: P1)

As a leader, I can adjust the date range used to filter deliverables while the screen always opens with the last 30 days pre-selected, so I can focus on recent work by default but widen or narrow the window when needed.

**Why this priority**: The date window is a primary filter paired with person selection; a sensible default keeps the common path fast while changeability supports deeper review.

**Automated Test Requirement**: Add tests at `tests/010-leader-team-deliverables/team-deliverables-date-filter.us2.test.md` validating: default last-30-days range on load, custom range selection, automatic search when the date range changes (with a team member already selected), and inclusion/exclusion by last-updated timestamp within the chosen range.

**Frontend Design**: The date filter MUST appear in the top filter bar as a changeable range control (start and end dates) pre-filled to the last 30 days on initial load. Changing either bound MUST trigger a new search when a team member is selected.

**Access Control Validation**: Date filtering applies after authorization; unauthorized users never receive deliverable rows regardless of date range.

**Acceptance Scenarios**:

1. **Given** a team member has one deliverable updated 10 days ago and one updated 40 days ago, **When** a leader selects that member with the default last-30-days range, **Then** only the deliverable updated 10 days ago appears in the table.
2. **Given** a leader has selected a team member and changes the date range to include dates older than 30 days, **When** the new range is applied, **Then** the deliverables search runs again and the table updates to reflect deliverables whose last-updated timestamp falls within the new range.
3. **Given** a leader opens Team Deliverables, **When** they inspect the date filter before interacting, **Then** the range is pre-set to the last 30 days (rolling window ending today).
4. **Given** a deliverable's last-updated date falls exactly on the selected start or end boundary, **When** a leader searches for that owner, **Then** the deliverable is included in results.

---

### User Story 3 - Leader marks deliverables as reviewed (Priority: P2)

As a leader, I can mark each deliverable in the results table as reviewed so I can tell at a glance which items I have already read and pick up where I left off in later sessions.

**Why this priority**: Tracking reviewed status reduces repeated work during recurring check-ins and makes large portfolios easier to work through over time.

**Automated Test Requirement**: Add tests at `tests/010-leader-team-deliverables/team-deliverables-reviewed.us3.test.md` covering: default unreviewed state, toggle to reviewed, toggle back to unreviewed, persistence after reload, and isolation so one leader's reviewed state does not change another leader's view of the same deliverable.

**Frontend Design**: The reviewed field MUST appear as a clear toggle or checkbox in each table row. Toggling MUST provide immediate visual feedback and persist without requiring a full page reload.

**Access Control Validation**: Only the logged-in leader may set or change reviewed state for deliverables they are authorized to view on this screen. Reviewed state MUST NOT be writable by the deliverable owner or by leaders outside the authorized read path.

**Acceptance Scenarios**:

1. **Given** a leader views a subordinate deliverable they have not reviewed before, **When** the row loads, **Then** the reviewed indicator shows unreviewed.
2. **Given** a leader marks a deliverable as reviewed, **When** they reload the screen and search for the same team member and date range, **Then** that deliverable still shows as reviewed for that leader.
3. **Given** a leader marks a deliverable as reviewed, **When** a different leader in the same superior chain views the same deliverable, **Then** the second leader sees their own reviewed state (default unreviewed unless they have marked it).
4. **Given** a leader marks a deliverable as reviewed, **When** they toggle reviewed off, **Then** the deliverable returns to unreviewed for that leader.

---

### User Story 4 - Restrict Team Deliverables to leaders (Priority: P2)

As the business owner, I need the Team Deliverables screen available only to users with the leader role so team deliverable portfolios are not exposed through this workflow to unauthorized roles.

**Why this priority**: Access control is essential but secondary to the primary browse flow once leader role checks align with other leader-only screens.

**Automated Test Requirement**: Add tests at `tests/010-leader-team-deliverables/team-deliverables-access-control.us4.test.md` validating allow for leaders, deny for non-leader collaborators and unauthenticated users, and deny API access when requesting deliverables for users outside the leader's subtree.

**Frontend Design**: Non-leaders who navigate to this route MUST see an authorization outcome consistent with existing leader-only screens (redirect or denial without data).

**Access Control Validation**: Leader role is required for the screen and underlying search. Non-leaders cannot list subtree members for this feature or retrieve deliverables through its search endpoint.

**Acceptance Scenarios**:

1. **Given** an authenticated collaborator without the leader role navigates to Team Deliverables, **When** the page loads, **Then** access is denied and no team member list or deliverable data is shown.
2. **Given** an unauthenticated request for Team Deliverables data, **When** the request is processed, **Then** the request is rejected.
3. **Given** a leader attempts to search deliverables for a user outside their reporting subtree, **When** the search is requested, **Then** the operation is denied and no deliverable rows are returned.

---

### Edge Cases

- Leader has no direct or indirect reports: person selector is empty and the screen shows guidance that no team members are available to review.
- Selected team member has deliverables but none fall within the selected date range: empty state for the current filters, not an error.
- Leader selects an invalid date range (end before start): the system rejects or auto-corrects with a clear message before searching.
- Selected team member has a very long description: table remains readable (wrapping or truncation with full text accessible on focus or expand is acceptable in planning; v1 must not hide descriptions entirely).
- Leader's subtree is large: person selector remains usable without unacceptable delay for typical team sizes.
- Team member display name is missing: selector and any labels use email fallback.
- Network or search failure while loading deliverables: user sees a clear error message and can retry by changing selection, date range, or reloading.
- Failure while saving reviewed toggle: user sees a clear error and the reviewed indicator reverts to the last persisted state.
- Leader loses leader role while on the screen: subsequent navigation or refresh denies access consistently with other leader routes.
- Concurrent selection or date-range changes: only the latest filter combination's results are shown (no stale table from an earlier request).
- Deliverable is deleted after being marked reviewed: reviewed state for that deliverable is no longer surfaced (orphaned review records may be discarded during planning).

## Requirements _(mandatory, with required test coverage)_

### Functional Requirements

_All functional requirements MUST be covered by automated tests. This feature exposes subordinate deliverable data and MUST enforce hierarchical DAC on every search and selector population path._

- **FR-001**: The system MUST provide a **Team Deliverables** screen in the authenticated application shell under the Leader section, reachable from leader navigation.
- **FR-002**: The system MUST restrict access to the Team Deliverables screen and its search capability to users with the **leader** role only.
- **FR-003**: The system MUST display at the top of the screen a **person selector** listing every direct and indirect report in the logged-in leader's reporting subtree, each labeled with display name (email fallback when display name is unavailable).
- **FR-004**: The person selector MUST NOT include peers, superiors, users outside the leader's subtree, or users from other organizational branches.
- **FR-005**: The system MUST display at the top of the screen a **changeable date range filter** with start and end dates, **defaulting to the last 30 days** (rolling window ending today) on initial screen load.
- **FR-006**: The system MUST apply the date filter using each deliverable's **last-updated** timestamp: include deliverables whose last-updated date falls within the selected range (inclusive of both boundaries); exclude deliverables outside the range.
- **FR-007**: The system MUST execute a deliverables search automatically when the leader selects or changes the selected team member.
- **FR-008**: The system MUST execute a deliverables search automatically when the leader changes the date range, provided a team member is already selected.
- **FR-009**: The system MUST NOT run a deliverables search until a team member is selected (no default person selection on initial load).
- **FR-010**: The system MUST reject or prevent search when the selected date range is invalid (for example end date before start date), with a clear user-facing message.
- **FR-011**: Search results MUST be shown in a **data table** with three data columns for v1: **title**, **description**, and **reviewed** (plus any non-data affordances such as row keys for testing).
- **FR-012**: The system MUST expose a **reviewed** indicator per result row that the logged-in leader can toggle between reviewed and unreviewed.
- **FR-013**: The system MUST persist reviewed state per **reviewing leader and deliverable** pair so each leader maintains an independent reviewed history.
- **FR-014**: New deliverables MUST default to **unreviewed** for each leader until explicitly marked reviewed.
- **FR-015**: The system MUST enforce read-only access for leaders viewing subordinate deliverable content on this screen (no create, edit, or delete of deliverable fields in v1); toggling reviewed is the only mutation allowed on this screen.
- **FR-016**: The system MUST deny deliverable search when the requested user is not in the logged-in leader's descendant subtree, returning no data and an appropriate authorization outcome.
- **FR-017**: The system MUST deny reviewed-state changes when the leader is not authorized to view the target deliverable.
- **FR-018**: The system MUST show a clear empty state when the selected team member has no deliverables matching the current date range.
- **FR-019**: The system MUST show a clear empty or informational state when the leader has no team members in their subtree.
- **FR-020**: The system MUST cover all functional requirements with automated tests, including authorization negative cases, date-boundary cases, and reviewed-state persistence cases.

### Access Control Matrix _(required when data visibility is in scope)_

Visibility follows organizational reporting position. The Team Deliverables screen is leader-only; within it, leaders may read deliverables only for descendant subtree members and may update reviewed state only for deliverables they are authorized to view.

| Actor                                   | Team Deliverables screen | Person selector options          | Search deliverables for user                                           | Toggle reviewed state                                        |
| --------------------------------------- | ------------------------ | -------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| Leader (logged in)                      | Allowed                  | Direct and indirect reports only | Allowed for subtree members only (read-only content); denied otherwise | Allowed for authorized deliverables; own reviewed state only |
| Collaborator (non-leader)               | Denied                   | Denied                           | Denied                                                                 | Denied                                                       |
| Unauthenticated user                    | Denied                   | Denied                           | Denied                                                                 | Denied                                                       |
| Deliverable owner (subordinate)         | N/A                      | N/A                              | N/A                                                                    | Denied (reviewed is leader workflow only)                    |
| Leader selecting peer or superior       | N/A (not in selector)    | Denied (excluded from list)      | Denied if requested directly                                           | Denied                                                       |
| Leader selecting user in another branch | N/A (not in selector)    | Denied (excluded from list)      | Denied if requested directly                                           | Denied                                                       |

**Validation notes**: Automated tests MUST cover: non-leader screen deny; unauthenticated deny; subtree member allow with title/description/reviewed rows; out-of-subtree search deny; peer/superior excluded from selector population; reviewed toggle allow for authorized leader; reviewed toggle deny for non-leader and unauthorized target.

### Key Entities _(include if feature involves data)_

- **Team member (selector option)**: A user in the logged-in leader's descendant reporting subtree, identified by user id and display name (or email fallback), used to scope deliverable search.
- **Deliverable (search result row)**: An existing deliverable owned by the selected team member; for this screen **title** and **description** are displayed read-only, filtered by last-updated date within the selected range.
- **Date range filter**: Changeable start and end dates; defaults to a rolling last-30-days window ending on the current date when the screen loads.
- **Reviewed state**: A boolean per reviewing leader and deliverable indicating whether that leader has marked the item as reviewed; independent across leaders viewing the same deliverable; defaults to unreviewed.
- **Reporting subtree**: The set of all direct and indirect reports of the logged-in leader, used to populate the person selector and authorize search.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of unauthorized access attempts to Team Deliverables by non-leaders and unauthenticated users are blocked in automated tests.
- **SC-002**: 100% of search attempts for users outside the leader's subtree are denied in automated tests.
- **SC-003**: In validation scenarios with known deliverable timestamps, 100% of results include only deliverables whose last-updated date falls within the selected range (default last 30 days and at least one custom range scenario).
- **SC-004**: 100% of reviewed-state toggles by an authorized leader persist correctly across reload in automated tests; 100% of unauthorized reviewed-state changes are denied.
- **SC-005**: Leaders with at least one report can select a team member and see matching deliverables (title, description, reviewed) in under 5 seconds on a typical office network connection in validation tests.
- **SC-006**: Leaders can identify which team member's deliverables they are viewing, distinguish items by title, and see which items they have already reviewed without using another screen (validated in usability checks with sample data).

## Assumptions

- "Leader" means an authenticated user with the leader role, consistent with other leader-only features (hierarchy management, hierarchy view, create user).
- "At the top of the screen" refers to UI placement: the person selector and date filter appear in a filter bar above the results table.
- The person selector lists **team members below the leader** (direct and indirect reports), not superiors or peers; this matches the "Team Deliverables" purpose and existing deliverables read rules from collaborator deliverables (superiors read subordinate deliverables read-only).
- The date filter is **changeable** with start and end dates; it **defaults to the last 30 days** on initial load. Leaders may widen or narrow the window; invalid ranges are blocked before search.
- Date filtering uses the deliverable **last-updated** timestamp, consistent with how deliverables are ordered elsewhere in the product.
- The **reviewed** field is a leader-only workflow aid: a toggle per row, stored per reviewing leader and deliverable, defaulting to unreviewed. It is not visible to or editable by the deliverable owner on their management screen in v1.
- Other deliverable fields (impact, tags, links) remain on existing deliverable management or detail surfaces; this screen shows title, description, and reviewed only.
- Deliverable entities and hierarchical read authorization already exist; this feature adds a leader-focused discovery screen, filtered search, and reviewed tracking.
- Reporting relationships are available via the existing organizational hierarchy (single manager per user); subtree resolution reuses the same rules as other leader hierarchy features.
- Initial load does not pre-select a team member; the leader must choose whom to review before results appear.
