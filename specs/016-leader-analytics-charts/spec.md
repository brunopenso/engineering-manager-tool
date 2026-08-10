# Feature Specification: Leader Analytics Charts

**Feature Branch**: `016-leader-analytics-charts`  
**Created**: 2026-06-04  
**Status**: Draft  
**Input**: User description: "Create a chart dashboard with a new menu option for leaders (leader section only). Top of page: optional date filter defaulting to last 60 days and optional team member selection (same as Team Deliverables). Page is a resizable widget layout. Charts: (1) deliverables added per week versus business impact, (2) user engagement as new deliverables added per week per person (lower is worse), (3) count of deliverables the logged-in leader still needs to review."

## User Scenarios & Testing _(mandatory, with required automated tests)_

### User Story 1 - Leader opens analytics dashboard (Priority: P1)

As a leader, I open a new **Team Analytics** item from the Leader section of the application menu and land on a dashboard where I can see visual summaries of my team's deliverable activity without opening the Team Deliverables table first.

**Why this priority**: Navigation and leader-only access are prerequisites for every chart and filter on the page.

**Automated Test Requirement**: Add tests at `tests/016-leader-analytics-charts/analytics-access.us1.test.md` (and corresponding UI/API tests under `tests/016-leader-analytics-charts/`) covering: menu visibility for leaders only, route protection for non-leaders, and initial page load with default 60-day date range and no team member pre-selected.

**Frontend Design**: Implementation MUST use the `frontend-design` skill with Material UI best practices for the analytics screen, including a filter bar at the top and a widget-style chart area below.

**Access Control Validation**: Only users with the leader role see the menu entry and can load analytics data. Non-leaders receive the same authorization outcome as other leader-only screens.

**Acceptance Scenarios**:

1. **Given** a logged-in user with the leader role, **When** they open the application shell menu, **Then** a **Team Analytics** option appears under the Leader section alongside existing leader items.
2. **Given** a logged-in collaborator without the leader role, **When** they view the shell menu, **Then** the Team Analytics option is not shown.
3. **Given** a non-leader navigates directly to the analytics route, **When** the page loads, **Then** access is denied and no chart data is shown.
4. **Given** a leader opens Team Analytics, **When** the page first loads, **Then** the date range defaults to the last 60 days (rolling window ending today), no team member is pre-selected, and all three charts render for the leader's full reporting subtree within that range.

---

### User Story 2 - Optional filters refine all charts (Priority: P1)

As a leader, I can optionally narrow analytics to a specific team member and/or adjust the date range so every chart on the dashboard reflects the same filter context.

**Why this priority**: Shared filters keep the dashboard coherent and reuse the familiar Team Deliverables selection pattern.

**Automated Test Requirement**: Add tests at `tests/016-leader-analytics-charts/analytics-filters.us2.test.md` validating: default 60-day range, optional team member picker populated from the leader's descendant subtree (same rules as Team Deliverables), charts refresh when filters change, invalid date ranges are blocked, and clearing the team member selection restores subtree-wide aggregates.

**Frontend Design**: The top filter bar MUST include the same hierarchical team member picker used on Team Deliverables (optional selection) and a changeable start/end date range defaulting to the last 60 days. Filter changes MUST refresh all visible charts without requiring a separate search action.

**Access Control Validation**: The team member picker MUST only list direct and indirect reports (exclude self). Selecting or clearing a member MUST NOT expose deliverables or metrics for users outside the leader's subtree.

**Acceptance Scenarios**:

1. **Given** a leader on Team Analytics with the default date range, **When** they select a team member from the picker, **Then** all charts update to show metrics for that person only within the current date range.
2. **Given** a leader has selected a team member, **When** they clear the selection, **Then** all charts update to aggregate across the entire reporting subtree again.
3. **Given** a leader changes the start or end date, **When** the new range is valid, **Then** all charts refresh using deliverables whose **creation date** falls within the inclusive calendar-day bounds of the range.
4. **Given** a leader sets an end date before the start date, **When** they attempt to apply the range, **Then** the system shows a clear validation message and does not refresh charts with invalid bounds.
5. **Given** a leader has not selected a team member, **When** charts load, **Then** metrics include all direct and indirect reports (leader excluded from engagement breakdowns as an owner, consistent with Team Deliverables picker scope).

---

### User Story 3 - Deliverables added per week by business impact (Priority: P1)

As a leader, I view a chart that shows how many deliverables were **added** each calendar week in the selected period, broken down by business impact level, so I can see whether the team is logging high-impact work over time.

**Why this priority**: This is the primary portfolio health signal requested for the release.

**Automated Test Requirement**: Add tests at `tests/016-leader-analytics-charts/chart-deliverables-by-impact.us3.test.md` covering weekly bucketing by creation date, four impact categories (low, medium, high, transformational), correct counts per bucket for filtered and unfiltered views, and empty weeks displayed as zero.

**Frontend Design**: The chart MUST be placed in the resizable widget grid with a clear title and legend distinguishing business impact levels. Weeks MUST be labeled in chronological order for the selected date range.

**Access Control Validation**: Counts MUST include only deliverables owned by users in the authorized subtree (or the single selected member). No peer, superior, or out-of-branch data.

**Acceptance Scenarios**:

1. **Given** two deliverables created in the same calendar week with different business impact values within scope, **When** the leader views the deliverables-by-week chart, **Then** that week shows separate counts (or stacked segments) per impact level totaling the deliverables created that week.
2. **Given** a week in the selected range with no new deliverables, **When** the chart renders, **Then** that week appears with zero counts for all impact levels.
3. **Given** a deliverable was created on the first or last day of the selected range, **When** charts refresh, **Then** it is counted in the correct week bucket.
4. **Given** a leader narrows to one team member, **When** the chart refreshes, **Then** only that member's created deliverables contribute to weekly impact totals.

---

### User Story 4 - Engagement: new deliverables per week per person (Priority: P2)

As a leader, I view a chart that shows how many deliverables each team member **added** per calendar week so I can spot low activity (fewer adds per week indicates weaker engagement).

**Why this priority**: Supports coaching on consistent logging habits; secondary to the impact overview but explicitly requested.

**Automated Test Requirement**: Add tests at `tests/016-leader-analytics-charts/chart-engagement-by-user.us4.test.md` covering per-user weekly series for subtree-wide view, single-series when one member is selected, zero weeks for inactive users, and ordering or labeling that identifies team members by display name (email fallback).

**Frontend Design**: The engagement chart MUST make per-person weekly add counts easy to compare. When no team member is selected, the chart MUST distinguish team members (for example separate series or grouped bars per week). When one member is selected, the chart MUST show only that person's weekly add counts.

**Access Control Validation**: Engagement metrics MUST only include owners in the leader's subtree; users outside the subtree never appear as series or labels.

**Acceptance Scenarios**:

1. **Given** two reports each added one deliverable in the same week, **When** the leader views the engagement chart without a member filter, **Then** that week reflects one add for each report (not a single anonymous total unless the visualization aggregates with a drill-down affordance documented in planning).
2. **Given** a report added no deliverables for several consecutive weeks in range, **When** the chart renders, **Then** those weeks show zero adds for that person so low engagement is visually apparent.
3. **Given** a leader selects one team member, **When** the engagement chart refreshes, **Then** only that person's weekly add counts are shown.
4. **Given** a team member has no display name, **When** they appear in the chart legend or labels, **Then** their email is used as the fallback label.

---

### User Story 5 - Pending review count (Priority: P2)

As a leader, I see how many deliverables in the current filter scope I have **not yet marked as reviewed**, so I know how much review work remains.

**Why this priority**: Closes the loop with the Team Deliverables reviewed workflow already in the product.

**Automated Test Requirement**: Add tests at `tests/016-leader-analytics-charts/chart-pending-review.us5.test.md` covering: count of unreviewed deliverables for the logged-in leader, respect for date range and optional member filter, decrease when leader marks reviewed elsewhere, and zero when all in-scope items are reviewed.

**Frontend Design**: The pending-review visualization MUST present a single prominent count (or equivalent gauge) for the logged-in leader's unreviewed items in scope, with a short label explaining it reflects items they still need to review.

**Access Control Validation**: Reviewed state is per leader–deliverable pair. The count MUST reflect only the logged-in leader's reviewed flags, not another leader's.

**Acceptance Scenarios**:

1. **Given** three in-scope deliverables the leader has not marked reviewed, **When** the pending-review widget loads, **Then** it shows a count of three.
2. **Given** the leader marks one of those deliverables reviewed on Team Deliverables, **When** they return to Team Analytics with the same filters, **Then** the pending-review count decreases by one.
3. **Given** all in-scope deliverables are marked reviewed by this leader, **When** the widget loads, **Then** the count is zero.
4. **Given** a leader selects a team member filter, **When** the pending-review widget refreshes, **Then** the count includes only unreviewed deliverables owned by that member within the date range.
5. **Given** another leader has reviewed the same deliverable, **When** the first leader views the widget, **Then** the count still reflects the first leader's own reviewed state only.

---

### User Story 6 - Resizable widget layout (Priority: P2)

As a leader, I can resize and rearrange chart widgets on the dashboard so I can emphasize the visuals most relevant to my current check-in.

**Why this priority**: Improves usability for different screen sizes and leader preferences; does not block core metrics.

**Automated Test Requirement**: Add tests at `tests/016-leader-analytics-charts/widget-layout.us6.test.md` covering: default layout with all three widgets visible, resize handles change widget footprint, layout survives in-session navigation away and back, and charts remain readable after resize.

**Frontend Design**: The page MUST use a widget-style layout where each chart occupies a resizable panel. Leaders MUST be able to drag or resize panels within reasonable bounds so content does not overlap unreadably.

**Access Control Validation**: Layout preferences are personal UI state and do not change which data the leader may see.

**Acceptance Scenarios**:

1. **Given** a leader on Team Analytics, **When** the page loads, **Then** all three chart widgets are visible in a default arrangement that fits a typical desktop viewport without horizontal scrolling for the default sizes.
2. **Given** a leader resizes a widget, **When** they release the resize control, **Then** the chart redraws within the new bounds without losing the current filter context.
3. **Given** a leader resizes widgets and navigates to another shell route, **When** they return to Team Analytics in the same browser session, **Then** their last widget sizes and positions are restored.
4. **Given** a narrow viewport, **When** the leader views the dashboard, **Then** widgets stack or reflow so charts remain usable (no clipped axes or illegible labels).

---

### Edge Cases

- Leader has no direct or indirect reports: team member picker is empty; charts show empty states explaining no team data is available (not an error).
- Selected date range contains no deliverable creations in scope: impact and engagement charts show zeros or empty-state messaging; pending review count may still be non-zero if unreviewed deliverables fall in range by creation date.
- Very large subtree: charts and picker remain responsive for typical team sizes; planning may cap legend entries or aggregate smallest series if needed (document in plan, not spec blocker).
- Leader selects a team member with no deliverables in range: charts show empty state for that member; pending review shows zero if nothing to review.
- Concurrent filter changes: only the latest filter combination drives chart data (no stale series from superseded requests).
- Network failure loading chart data: clear error per widget or page-level retry without partial misleading totals.
- Deliverable created exactly at week boundary (timezone): week assignment follows consistent calendar-week rules aligned with other date features in the product.
- Leader loses leader role while on page: refresh or navigation denies access consistently with other leader routes.
- Unauthenticated API requests for analytics aggregates: rejected with no data leakage.

## Requirements _(mandatory, with required test coverage)_

### Functional Requirements

_All functional requirements MUST be covered by automated tests. This feature aggregates subordinate deliverable and review data and MUST enforce hierarchical DAC on every analytics endpoint._

- **FR-001**: The system MUST expose a **Team Analytics** screen in the authenticated application shell under the **Leader** section, visible only to users with the leader role.
- **FR-002**: The system MUST deny access to Team Analytics for non-leader collaborators and unauthenticated users, consistent with other leader-only screens.
- **FR-003**: The screen MUST provide an optional team member selector using the same hierarchical reporting picker behavior and data scope as **Team Deliverables** (direct and indirect reports only, self excluded, display name with email fallback).
- **FR-004**: The screen MUST provide a changeable start/end date range that **defaults to the last 60 days** on initial load (rolling window ending today).
- **FR-005**: Both filters MUST be optional in the sense that charts MUST render on load without requiring a team member selection; date range MUST always have a default applied.
- **FR-006**: Changing either filter MUST refresh all charts to reflect the same filter context without a separate search button.
- **FR-007**: Invalid date ranges (end before start) MUST be blocked with a clear message before charts refresh.
- **FR-008**: The system MUST provide aggregated analytics for the leader's reporting subtree when no team member is selected, and for a single selected member when the picker has a selection.
- **FR-009**: The **deliverables by week and business impact** chart MUST count deliverables by **calendar week of creation date** within the selected range, grouped into the four business impact levels used elsewhere in the product (low, medium, high, transformational).
- **FR-010**: The **engagement** chart MUST show **new deliverables added per calendar week per team member** in scope; lower weekly counts indicate lower engagement for coaching purposes.
- **FR-011**: The **pending review** widget MUST show the count of in-scope deliverables the **logged-in leader** has not marked as reviewed, using the same per-leader reviewed semantics as Team Deliverables.
- **FR-012**: Pending review counts MUST respect the active date range (deliverables whose creation date falls within the range) and optional team member filter.
- **FR-013**: The page MUST use a **widget layout** where each chart occupies a resizable panel; leaders MUST be able to resize widgets and see charts adapt to the new size.
- **FR-014**: Widget size and position MUST persist for the duration of the browser session when the leader navigates away and returns to Team Analytics.
- **FR-015**: All analytics data MUST be served through leader-authorized endpoints that reject requests for users outside the leader's reporting subtree.
- **FR-016**: Chart data MUST NOT include deliverables owned by peers, superiors, users in other branches, or the leader's own deliverables when aggregating team engagement (consistent with team picker scope).

### Access Control Matrix _(required when data visibility is in scope)_

| Actor                     | Allowed Data Visibility                                                                                                                                          | Explicitly Denied Visibility                                                     | Validation Notes                                             |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Leader                    | Metrics and counts for deliverables owned by self plus all direct and indirect reports within the selected filters; reviewed state for the logged-in leader only | Peers, superiors, users outside reporting subtree, other leaders' reviewed flags | `tests/016-leader-analytics-charts/` access and filter tests |
| Collaborator (non-leader) | None via Team Analytics                                                                                                                                          | All team analytics and leader menu entry                                         | Menu hidden; route denied                                    |
| Unauthenticated user      | None                                                                                                                                                             | All analytics endpoints and screen                                               | Standard auth rejection                                      |

### Key Entities _(include if feature involves data)_

- **Deliverable**: Work item owned by a collaborator; attributes relevant to analytics include creation date, business impact level, and owner.
- **Business impact level**: Categorical value (low, medium, high, transformational) used to segment weekly add counts.
- **Leader reviewed state**: Per-leader, per-deliverable flag indicating whether the logged-in leader has reviewed an item; drives pending review count.
- **Reporting relationship**: Defines which users belong in the leader's subtree for picker options and aggregate scope.
- **Analytics filter context**: Combined optional team member selection and inclusive calendar date range (default last 60 days) applied uniformly to all widgets.
- **Widget layout state**: Leader's chosen sizes and positions of chart panels for the session.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Leaders can open Team Analytics from the Leader menu and see all three widgets populated with default filters in under 5 seconds on a typical corporate network for teams up to 50 reports.
- **SC-002**: 100% of chart refresh operations after a valid filter change complete with updated visuals within 3 seconds for teams up to 50 reports under normal load.
- **SC-003**: Leaders can identify which calendar weeks had zero new deliverables for a selected team member without opening Team Deliverables (engagement chart shows zero for those weeks).
- **SC-004**: Leaders can see the pending review count match the number of unreviewed rows they would see on Team Deliverables for the same member and date filters within a single testing session (zero discrepancy).
- **SC-005**: Non-leader users cannot discover or load team analytics data through menu, direct navigation, or API (0 successful unauthorized loads in acceptance tests).
- **SC-006**: At least 90% of leaders in usability validation can resize a chart widget and read axis labels without horizontal scrolling on a 1280px-wide viewport.

## Assumptions

- **Leader** means an authenticated user with the leader role, consistent with Team Deliverables and other leader-only features.
- Menu label **Team Analytics** is used unless product copy is adjusted during planning; it sits in the Leader section only.
- Weekly buckets use **calendar weeks** (Monday–Sunday or locale-consistent with existing product date features); exact week boundary rules will align with implementation planning and existing UTC day-bound handling.
- **Creation date** (`created_at`) is the time axis for deliverables-added and engagement charts, consistent with the collaborator deliverables list date filter.
- **Business impact** uses the four levels already stored on deliverables (low, medium, high, transformational).
- **Reviewed** semantics and storage match feature 010 (per leader–deliverable pair); pending review counts unreviewed items only for the logged-in leader.
- When no team member is selected, **engagement** shows per-person weekly series for all reports in the subtree; when one member is selected, only that person's series is shown.
- The team member picker reuses the same hierarchy data and UX as Team Deliverables rather than introducing a new selection model.
- Widget layout persistence across browser sessions (beyond the current session) is out of scope for v1 unless already supported by a global user-preferences mechanism.
- Export, drill-down to individual deliverables, and custom chart types beyond the three listed are out of scope for this release.
- The user mentioned a specific charting library in the request; visualization technology choices are deferred to implementation planning and are not part of this specification.
