# Feature Specification: Deliverables Portfolio Filters

**Feature Branch**: `012-deliverables-list-filters`  
**Created**: 2026-06-01  
**Status**: Draft  
**Input**: User description: "IN the screen `app/deliverables` i am missing some filter options, lets add filter by creation date with a date picker with start and end date, system tags and impact"

## Clarifications

### Session 2026-06-01

- Q: Where should portfolio filtering execute (client vs server)? → A: **All filtering MUST occur on the backend**; the screen requests a filtered list from the server rather than filtering a full client-side download.
- Q: What is the default date range when the Deliverables management screen loads? → A: **Last 30 days** (rolling window ending today), matching the Team Deliverables date-range default pattern; the screen always loads with this range applied via the backend.

## User Scenarios & Testing *(mandatory, with required automated tests)*

### User Story 1 - Collaborator narrows portfolio by creation date (Priority: P1)

A signed-in collaborator on the Deliverables management screen (`/app/deliverables`) sees deliverables from the **last 30 days** by default and can change the start and end dates to request a different creation-date window from the server, so they can focus on recent work or review a specific period for performance conversations.

**Why this priority**: Creation date is the primary time-based lens the user asked for; it directly supports quarterly and annual portfolio reviews.

**Automated Test Requirement**: Add tests under `tests/012-deliverables-list-filters/` covering: initial load requests last-30-day range and shows only in-range deliverables; changing dates triggers a new backend request with updated bounds; invalid range (end before start) is rejected with a clear message and does not return a narrowed list; resetting filters restores the default last-30-day window.

**Frontend Design**: The Deliverables management screen filter area MUST use the `frontend-design` skill with Material UI best practices—paired start and end date pickers pre-filled with the last-30-day default, visible validation for invalid ranges, and automatic list refresh when dates change (valid range).

**Access Control Validation**: Date filtering applies only to the authenticated collaborator's own deliverables on the server; no other user's data appears regardless of filter settings.

**Acceptance Scenarios**:

1. **Given** a collaborator opens the Deliverables management screen, **When** the page loads, **Then** start and end dates default to the last 30 days (inclusive, ending today) and the table shows only their deliverables whose **creation date** falls within that range.
2. **Given** a collaborator changes start and end dates to a valid range, **When** the new range is applied, **Then** the system requests a filtered list from the backend and shows only deliverables created within the new inclusive boundaries.
3. **Given** a collaborator sets an end date before the start date, **When** they attempt to load the list, **Then** the request is not sent (or is rejected) and they see a clear message explaining the range is invalid.
4. **Given** a collaborator uses **Clear all filters**, **When** the action completes, **Then** the date range resets to the last-30-day default and the backend returns the corresponding portfolio slice.

---

### User Story 2 - Collaborator filters by business impact (Priority: P1)

A collaborator selects one or more business impact levels (Low, Medium, High, Transformational) so the backend returns only deliverables matching the selected impact classifications within the active creation-date window.

**Why this priority**: Impact is a core dimension of the deliverable model and a common way to prioritize portfolio review alongside the date filter.

**Automated Test Requirement**: Add tests under `tests/012-deliverables-list-filters/` covering: single impact selection; multiple impact selections (union); no impact selection means all impact levels pass within the date window; combined with date and tag filters (AND across filter types) enforced server-side.

**Frontend Design**: Impact filter MUST use the `frontend-design` skill with Material UI best practices—multi-select or equivalent control labeled consistently with how impact appears in the table, with an obvious clear/reset for impact selection.

**Access Control Validation**: Impact filtering applies only to the collaborator's own deliverables on the server.

**Acceptance Scenarios**:

1. **Given** a collaborator has deliverables with different impact levels in the active date range, **When** they select only "High" and the list reloads, **Then** only High-impact deliverables are returned.
2. **Given** a collaborator selects "Medium" and "High", **When** the list reloads, **Then** deliverables with either Medium or High impact are returned.
3. **Given** no impact level is selected, **When** the list reloads, **Then** impact does not exclude deliverables within the active date range.

---

### User Story 3 - Collaborator filters by system tags (Priority: P1)

A collaborator selects one or more system tags from the organization tag catalog so the backend returns deliverables associated with at least one of the selected tags within the active creation-date window.

**Why this priority**: System tags tie deliverables to platforms and domains; filtering by tag is essential for focused portfolio views.

**Automated Test Requirement**: Add tests under `tests/012-deliverables-list-filters/` covering: single tag match; multiple tags with union semantics; deliverable with multiple tags appears when any selected tag matches; empty tag selection does not exclude by tag; invalid tag identifiers rejected server-side.

**Frontend Design**: System tag filter MUST use the `frontend-design` skill with Material UI best practices—multi-select showing tag name and visual identity (e.g., color) consistent with tag chips in the table, sourced from the same catalog used when creating deliverables.

**Access Control Validation**: Tag filtering applies only to the collaborator's own deliverables on the server; only active catalog tags are accepted.

**Acceptance Scenarios**:

1. **Given** a collaborator has deliverables tagged "Platform" and "Data" in the active date range, **When** they filter by "Platform" and reload, **Then** only deliverables that include the Platform system tag are returned.
2. **Given** a deliverable has both "Platform" and "Security" tags, **When** the collaborator filters by both tags, **Then** that deliverable is returned.
3. **Given** no system tag is selected, **When** the list reloads, **Then** system tags do not exclude deliverables within the active date range.
4. **Given** the organization tag catalog is loaded for the filter, **When** the collaborator opens the tag filter, **Then** they see the same tag names they can assign when creating a deliverable.

---

### User Story 4 - Collaborator combines filters and resets (Priority: P2)

A collaborator applies creation date, impact, and system tag filters together, receives the intersection from the backend, and can reset all filters quickly to return to the default last-30-day portfolio view.

**Why this priority**: Combined filtering is the day-to-day workflow once individual controls exist; reset prevents frustration when filters stack to zero results.

**Automated Test Requirement**: Add tests under `tests/012-deliverables-list-filters/` covering: AND logic across filter types on the server; empty result state when no deliverables match; reset restores default last-30-day range and clears impact/tag selections; filter state does not affect edit/delete authorization on visible rows.

**Frontend Design**: Filters MUST be grouped at the top of the Deliverables management screen (above the table) with a single "Clear all filters" action when any filter differs from defaults, following Material UI layout patterns from the `frontend-design` skill.

**Access Control Validation**: Combined filtering never surfaces another user's deliverables.

**Acceptance Scenarios**:

1. **Given** a collaborator sets a creation date range, impact "High", and system tag "Platform", **When** the list reloads, **Then** the backend returns only owned deliverables that satisfy **all three** conditions.
2. **Given** active filters match no deliverables, **When** the table updates, **Then** the collaborator sees an empty filtered state message (distinct from the "no deliverables yet" first-time empty state when applicable).
3. **Given** multiple filters are active, **When** the collaborator chooses "Clear all filters", **Then** date range resets to last 30 days, impact and tag selections clear, and the backend returns the default portfolio slice.

---

### Edge Cases

- Invalid date range (end before start): reject before or during API call; show clear message; do not show a misleading partial list.
- Creation timestamp on range boundaries: inclusive calendar-day boundaries on **`created_at`** (server applies consistent UTC day bounds aligned with existing team-deliverables date handling).
- Deliverable has no system tags (legacy data): does not match any positive tag filter; may still appear when no tag filter is selected.
- All filters yield zero rows: show filtered empty state; **Clear all filters** restores default last-30-day view.
- Collaborator changes filters while delete confirmation is open: list refresh after delete uses current filter parameters.
- Deliverables exist outside the last 30 days but none inside: show filtered/period empty messaging, not "add your first deliverable" unless the user has no deliverables at all.

## Requirements *(mandatory, with required test coverage)*

### Functional Requirements

*All functional requirements MUST be covered by automated tests. This feature extends the collaborator-only Deliverables management screen; it does not change who may read or write deliverables.*

- **FR-001**: The system MUST expose filter controls on the **Deliverables management screen** (`/app/deliverables`) above the deliverables table, without removing existing list, add, edit, or delete capabilities.
- **FR-002**: The system MUST provide a **creation date range filter** with separate **start date** and **end date** inputs (date picker UX).
- **FR-003**: On initial screen load, the creation date range MUST default to the **last 30 days** (rolling window ending today, inclusive) and the system MUST request the portfolio list from the **backend** using that range.
- **FR-004**: The backend MUST filter deliverables by **creation date** (`created_at`) inclusive of both start and end calendar days for the supplied range.
- **FR-005**: The system MUST reject or prevent list requests when the end date is before the start date, with a clear user-facing validation message.
- **FR-006**: The system MUST provide a **business impact filter** allowing selection of zero or more of: Low, Medium, High, Transformational.
- **FR-007**: When one or more impact levels are selected, the **backend** MUST return only deliverables whose business impact is among the selected levels (OR within impact); when none are selected, impact MUST NOT exclude deliverables within the active date range.
- **FR-008**: The system MUST provide a **system tags filter** allowing selection of zero or more tags from the organization system tag catalog.
- **FR-009**: When one or more system tags are selected, the **backend** MUST return deliverables that have **at least one** of the selected system tags (OR within tags); when none are selected, tags MUST NOT exclude deliverables within the active date range.
- **FR-010**: Active filters across creation date, impact, and system tags MUST combine with **logical AND** on the **backend** (a deliverable must satisfy every active filter type to be returned).
- **FR-011**: The system MUST provide a **clear all filters** action that resets the date range to the **last-30-day default** and clears impact and system tag selections, then reloads the list from the backend.
- **FR-012**: The system MUST distinguish **no deliverables in portfolio** (first-time empty) from **no deliverables match current filters** (filtered empty) with appropriate messaging.
- **FR-013**: Filtering MUST apply only to deliverables owned by the authenticated collaborator; hierarchical read paths for superiors are out of scope for this feature.
- **FR-014**: The owner portfolio list endpoint MUST accept filter parameters (creation date range, optional impact levels, optional system tag identifiers) and return only matching rows; the screen MUST NOT download the full unfiltered portfolio for client-side filtering.

### Access Control Matrix *(required when data visibility is in scope)*

| Actor | Allowed Data Visibility | Explicitly Denied Visibility | Validation Notes |
|-------|--------------------------|-------------------------------|------------------|
| Collaborator (owner) | Own deliverables on `/app/deliverables`, filtered by backend query scoped to self | Any other user's deliverables | API tests with two-user fixtures; peer cannot obtain another user's filtered list |
| Leader / superior | Unchanged from existing deliverable read rules (not this screen) | N/A for this feature | No new read surfaces |
| Peer | Unchanged (no access to other's portfolios) | Other peers' deliverables | Regression tests on list ownership |

### Key Entities

- **Deliverable (portfolio row)**: Work outcome owned by a collaborator; attributes relevant to filtering include **creation date**, **business impact classification**, and **system tags** (references to catalog tags).
- **System tag (catalog)**: Organization-defined label used on deliverables; filter options are drawn from the same catalog as create/edit.
- **Filter criteria**: Creation date range (default last 30 days), optional selected impact levels, optional selected system tag identifiers; sent to the backend on each list request.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Collaborators see an updated list within 5 seconds after changing any filter under normal conditions (server-filtered request).
- **SC-002**: In usability terms, 90% of collaborators can locate and apply a combined three-filter view (date + impact + tag) without assistance on first attempt, evidenced by task-based test scripts in the test plan.
- **SC-003**: Filtered empty state and first-time portfolio empty state are visually and textually distinct so users do not confuse "no matches" with "no deliverables created yet."
- **SC-004**: After using "Clear all filters," the visible list matches the **default last-30-day** backend query (date reset + impact/tags cleared) in automated tests.
- **SC-005**: Zero deliverables from other users appear in filtered list responses across authorization test fixtures (100% deny rate for cross-user access).

## Assumptions

- The Deliverables management screen (`/app/deliverables`) is the sole in-scope surface; Team Deliverables leader screen is not modified by this feature.
- **Creation date** (`created_at`) is the time axis for the date filter (not last-updated).
- **Backend filtering** is mandatory for date, impact, and tags; the web client sends filter parameters and renders the returned list only.
- Default on screen load and after **Clear all filters**: **last 30 days** ending today (same rolling-window intent as Team Deliverables).
- System tag filter uses **union (OR)** within tags; impact filter uses **union (OR)** within levels; **AND** applies across filter types on the server.
- Filter choices are **session-local** to the screen visit unless a future feature adds persistence.
- Organization system tags available at create time are the same set offered in the filter control (active catalog only).
- Business impact values remain: Low, Medium, High, Transformational.
