# Feature Specification: Deliverables Portfolio Filters

**Feature Branch**: `012-deliverables-list-filters`  
**Created**: 2026-06-01  
**Status**: Draft  
**Input**: User description: "IN the screen `app/deliverables` i am missing some filter options, lets add filter by creation date with a date picker with start and end date, system tags and impact"

## User Scenarios & Testing *(mandatory, with required automated tests)*

### User Story 1 - Collaborator narrows portfolio by creation date (Priority: P1)

A signed-in collaborator on the Deliverables management screen (`/app/deliverables`) sets a start date and end date to see only deliverables they created within that period, so they can focus on recent work or review a specific time window for performance conversations.

**Why this priority**: Creation date is the primary time-based lens the user asked for; it directly supports quarterly and annual portfolio reviews.

**Automated Test Requirement**: Add tests under `tests/012-deliverables-list-filters/` covering: default list shows all owned deliverables when no date filter is set; applying a valid inclusive date range hides deliverables created outside the range; invalid range (end before start) blocks filtering with a clear message; clearing the date filter restores the full list.

**Frontend Design**: The Deliverables management screen filter area MUST use the `frontend-design` skill with Material UI best practices—paired start and end date pickers, visible validation for invalid ranges, and a clear way to clear the date selection.

**Access Control Validation**: Date filtering applies only to the authenticated collaborator's own deliverables; no other user's data appears regardless of filter settings.

**Acceptance Scenarios**:

1. **Given** a collaborator has deliverables created on different calendar days, **When** they set start and end dates that include only some of those days and apply the filter, **Then** only deliverables whose **creation date** falls within the range (inclusive of both boundaries) are shown.
2. **Given** a collaborator has not set a creation date filter, **When** they open the Deliverables management screen, **Then** all of their deliverables are listed (subject only to any other active filters).
3. **Given** a collaborator sets an end date before the start date, **When** they attempt to apply the date filter, **Then** the filter is not applied and they see a clear message explaining the range is invalid.
4. **Given** a collaborator has applied a creation date filter, **When** they clear both date fields (or use a clear control for the date filter), **Then** the date constraint is removed and deliverables outside the former range become visible again.

---

### User Story 2 - Collaborator filters by business impact (Priority: P1)

A collaborator selects one or more business impact levels (Low, Medium, High, Transformational) on the Deliverables management screen so the table shows only deliverables matching the selected impact classifications.

**Why this priority**: Impact is a core dimension of the deliverable model and a common way to prioritize portfolio review alongside the date filter.

**Automated Test Requirement**: Add tests under `tests/012-deliverables-list-filters/` covering: single impact selection; multiple impact selections (union); no impact selection means all impact levels pass; combined with date and tag filters (AND across filter types).

**Frontend Design**: Impact filter MUST use the `frontend-design` skill with Material UI best practices—multi-select or equivalent control labeled consistently with how impact appears in the table, with an obvious clear/reset for impact selection.

**Access Control Validation**: Impact filtering applies only to the collaborator's own deliverables.

**Acceptance Scenarios**:

1. **Given** a collaborator has deliverables with different impact levels, **When** they select only "High", **Then** only deliverables classified as High are shown.
2. **Given** a collaborator selects "Medium" and "High", **When** the filter is applied, **Then** deliverables with either Medium or High impact are shown.
3. **Given** no impact level is selected, **When** other filters are inactive or active, **Then** impact does not exclude any deliverables (all four levels remain eligible).

---

### User Story 3 - Collaborator filters by system tags (Priority: P1)

A collaborator selects one or more system tags from the organization tag catalog on the Deliverables management screen so the table shows deliverables associated with at least one of the selected tags.

**Why this priority**: System tags tie deliverables to platforms and domains; filtering by tag is essential for focused portfolio views.

**Automated Test Requirement**: Add tests under `tests/012-deliverables-list-filters/` covering: single tag match; multiple tags with union semantics; deliverable with multiple tags appears when any selected tag matches; empty tag selection does not exclude by tag; invalid or retired tag identifiers are not offered in the filter control.

**Frontend Design**: System tag filter MUST use the `frontend-design` skill with Material UI best practices—multi-select showing tag name and visual identity (e.g., color) consistent with tag chips in the table, sourced from the same catalog used when creating deliverables.

**Access Control Validation**: Tag filtering applies only to the collaborator's own deliverables; only active catalog tags available for deliverable assignment are selectable in the filter.

**Acceptance Scenarios**:

1. **Given** a collaborator has deliverables tagged "Platform" and "Data", **When** they filter by "Platform", **Then** only deliverables that include the Platform system tag are shown.
2. **Given** a deliverable has both "Platform" and "Security" tags, **When** the collaborator filters by "Platform" OR "Security" (both selected), **Then** that deliverable is shown.
3. **Given** no system tag is selected in the filter, **When** the list is displayed, **Then** system tags do not exclude any deliverables.
4. **Given** the organization tag catalog is loaded for the filter, **When** the collaborator opens the tag filter, **Then** they see the same tag names they can assign when creating a deliverable (no orphan or unknown tags in the picker).

---

### User Story 4 - Collaborator combines filters and resets (Priority: P2)

A collaborator applies creation date, impact, and system tag filters together, sees the intersection of criteria, and can reset all filters quickly to return to the full portfolio view.

**Why this priority**: Combined filtering is the day-to-day workflow once individual controls exist; reset prevents frustration when filters stack to zero results.

**Automated Test Requirement**: Add tests under `tests/012-deliverables-list-filters/` covering: AND logic across filter types; empty result state when no deliverables match; reset restores full list; filter state does not affect edit/delete authorization on visible rows.

**Frontend Design**: Filters MUST be grouped at the top of the Deliverables management screen (above the table) with a single "Clear all filters" action when any filter is active, following Material UI layout patterns from the `frontend-design` skill.

**Access Control Validation**: Combined filtering never surfaces another user's deliverables.

**Acceptance Scenarios**:

1. **Given** a collaborator sets a creation date range, impact "High", and system tag "Platform", **When** filters are applied, **Then** only owned deliverables that satisfy **all three** conditions are shown.
2. **Given** active filters match no deliverables, **When** the table updates, **Then** the collaborator sees an empty filtered state message (distinct from the "no deliverables yet" first-time empty state) explaining that no items match the current filters.
3. **Given** multiple filters are active, **When** the collaborator chooses "Clear all filters", **Then** all filter controls return to their default unfiltered state and the full owned portfolio is shown again.

---

### Edge Cases

- Collaborator sets only a start date or only an end date: treat as an incomplete date filter—either require both dates before applying the date constraint or document behavior in FR (require both).
- Creation timestamp falls exactly on start-of-day or end-of-day boundary: inclusive calendar-day boundaries must include deliverables created anywhere on the first and last selected days in the user's local calendar interpretation for the picker.
- Deliverable has no system tags (should not occur for valid records per create rules): if legacy data exists, it does not match any positive tag filter but still appears when no tag filter is selected.
- All filters active yield zero rows: show filtered empty state; clearing any one filter may restore results.
- Collaborator changes filters while delete confirmation is open: list refresh after delete respects current filters.
- Very large personal portfolios: filtering must update the visible list within a responsive time acceptable for interactive use (see success criteria).

## Requirements *(mandatory, with required test coverage)*

### Functional Requirements

*All functional requirements MUST be covered by automated tests. This feature extends the collaborator-only Deliverables management screen; it does not change who may read or write deliverables.*

- **FR-001**: The system MUST expose filter controls on the **Deliverables management screen** (`/app/deliverables`) above the deliverables table, without removing existing list, add, edit, or delete capabilities.
- **FR-002**: The system MUST provide a **creation date range filter** with separate **start date** and **end date** inputs (date picker UX).
- **FR-003**: The creation date filter MUST apply only when **both** start and end dates are set; until then, creation date MUST NOT exclude deliverables.
- **FR-004**: The creation date filter MUST include deliverables whose **creation date** falls on or between the selected start and end dates, **inclusive** of both calendar days.
- **FR-005**: The system MUST prevent application of a creation date range where the end date is before the start date, with a clear user-facing validation message.
- **FR-006**: The system MUST provide a **business impact filter** allowing selection of zero or more of: Low, Medium, High, Transformational.
- **FR-007**: When one or more impact levels are selected, the list MUST show only deliverables whose business impact is among the selected levels; when none are selected, impact MUST NOT exclude deliverables.
- **FR-008**: The system MUST provide a **system tags filter** allowing selection of zero or more tags from the organization system tag catalog.
- **FR-009**: When one or more system tags are selected, the list MUST show deliverables that have **at least one** of the selected system tags; when none are selected, tags MUST NOT exclude deliverables.
- **FR-010**: Active filters across creation date, impact, and system tags MUST combine with **logical AND** (a deliverable must satisfy every active filter type to appear).
- **FR-011**: The system MUST provide a **clear all filters** action that resets creation date, impact, and system tag filters to their default unfiltered state in one step.
- **FR-012**: The system MUST distinguish **no deliverables in portfolio** (first-time empty) from **no deliverables match current filters** (filtered empty) with appropriate messaging.
- **FR-013**: Filtering MUST apply only to deliverables owned by the authenticated collaborator on this screen; hierarchical read paths for superiors are out of scope for this feature.
- **FR-014**: The deliverables list used for filtering MUST expose enough data for each row to evaluate creation date, business impact, and system tags without requiring the user to open each item's edit form.

### Access Control Matrix *(required when data visibility is in scope)*

| Actor | Allowed Data Visibility | Explicitly Denied Visibility | Validation Notes |
|-------|--------------------------|-------------------------------|------------------|
| Collaborator (owner) | Own deliverables on `/app/deliverables`, filtered in memory or via list query scoped to self | Any other user's deliverables | Filter tests use two-user fixtures; peer cannot see filtered results of another user |
| Leader / superior | Unchanged from existing deliverable read rules (not this screen) | N/A for this feature | No new read surfaces; leaders continue using Team Deliverables and hierarchy read paths |
| Peer | Unchanged (no access to other's portfolios) | Other peers' deliverables | Regression tests on list ownership |

### Key Entities

- **Deliverable (portfolio row)**: Work outcome owned by a collaborator; attributes relevant to filtering include **creation date**, **business impact classification**, and **system tags** (references to catalog tags).
- **System tag (catalog)**: Organization-defined label used on deliverables; filter options are drawn from the same catalog as create/edit.
- **Filter state**: User's current creation date range (optional), selected impact levels, and selected system tag identifiers; drives which owned deliverables appear in the table.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Collaborators can apply any single filter type (date, impact, or tags) and see an updated list in under 2 seconds for portfolios up to 200 deliverables under normal conditions.
- **SC-002**: In usability terms, 90% of collaborators can locate and apply a combined three-filter view (date + impact + tag) without assistance on first attempt, evidenced by task-based test scripts in the test plan.
- **SC-003**: Filtered empty state and unfiltered empty state are visually and textually distinct so users do not confuse "no matches" with "no deliverables created yet."
- **SC-004**: After using "Clear all filters," the visible row count matches the collaborator's full owned portfolio count (100% restoration in automated tests).
- **SC-005**: Zero deliverables from other users appear in the filtered list across authorization test fixtures (100% deny rate for cross-user list access).

## Assumptions

- The Deliverables management screen (`/app/deliverables`) is the sole in-scope surface; Team Deliverables leader screen already has its own date and reviewed filters and is not modified by this feature.
- **Creation date** (not last-updated date) is the correct time axis per user request; deliverable list data will include creation date for filtering.
- Creation date pickers use **calendar dates**; inclusive day boundaries are interpreted in the collaborator's local timezone as presented by the date picker.
- System tag filter uses **union (OR)** semantics within the tag dimension when multiple tags are selected; **AND** applies only **across** filter types (date + impact + tags).
- Impact filter uses **union (OR)** semantics when multiple levels are selected.
- Default on screen load: **no filters applied** (full portfolio visible), unlike the Team Deliverables default last-30-days pattern.
- Filter choices are **session-local** to the screen visit unless a future feature adds persistence; leaving and returning to the screen resets filters to default.
- Organization system tags available at create time are the same set offered in the filter control (active catalog only).
- Business impact values remain the four levels defined in the collaborator deliverables feature: Low, Medium, High, Transformational.
