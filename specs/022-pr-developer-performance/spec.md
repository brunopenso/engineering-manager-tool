# Feature Specification: PR Developer Performance

**Feature Branch**: `022-pr-developer-performance`  
**Created**: 2026-08-11  
**Status**: Draft  
**Input**: User description: "as a manager from a team I would like to understand what my developers performances are based on the pull request data. Create a screen for it."

## Clarifications

### Session 2026-08-12

- Q: When no team member is selected on Team PR Performance, how should the weekly PRs-by-classification chart behave? → A: Team aggregate by week + classification when unfiltered; switch to the selected member when filtered (Option A)

## User Scenarios & Testing _(mandatory, with required automated tests)_

### User Story 1 - Open team PR performance screen (Priority: P1)

As a leader, I open a **Team PR Performance** (or equivalently named) item from the Leader section of the application menu and land on a screen that shows my team's pull request contribution performance for a sensible default period so I can understand how developers are performing from imported PR data without leaving the product.

**Why this priority**: Navigation and leader-only access are prerequisites for every filter, summary, comparison, and detail interaction on the screen.

**Automated Test Requirement**: Add tests at `tests/022-pr-developer-performance/screen-access.us1.test.md` (and corresponding UI/API tests under `tests/022-pr-developer-performance/`) covering: menu visibility for leaders only, route protection for non-leaders, initial page load with default 60-day date range and no team member pre-selected, and empty/unavailable states when no eligible team PR data exists.

**Frontend Design**: Implementation MUST use the `frontend-design` skill with Material UI best practices for the performance screen (filter bar, summary area, comparison visualization, and table layout consistent with existing Leader section screens).

**Internationalization**: All user-visible strings (menu label, filters, chart/card titles, table headers, empty states, errors) MUST be externalized to `en-US` and `pt-BR` catalogs. Tests MUST verify both locales and key parity.

**Access Control Validation**: Only users with the leader role see the menu entry and can load team PR performance data. Non-leaders MUST be denied. Data MUST include only the leader's reporting subtree (direct and indirect reports). Peer, superior, and out-of-branch data MUST NOT appear. The leader's own PR activity MAY be excluded from team performance aggregates (consistent with Team Deliverables / Team Analytics picker scope that focuses on reports).

**Acceptance Scenarios**:

1. **Given** a logged-in user with the leader role, **When** they open the application shell menu, **Then** a Team PR Performance option appears under the Leader section alongside existing leader items.
2. **Given** a logged-in collaborator without the leader role, **When** they view the shell menu, **Then** the Team PR Performance option is not shown.
3. **Given** a non-leader navigates directly to the team PR performance route, **When** the page loads, **Then** access is denied and no performance data is shown.
4. **Given** a leader opens Team PR Performance, **When** the page first loads, **Then** the date range defaults to the last 60 calendar days (rolling window ending today), no team member is pre-selected, and summaries, comparisons, and the weekly authored-PRs-by-classification chart render for the leader's full reporting subtree within that range.

---

### User Story 2 - Filter by period and optional team member (Priority: P1)

As a leader, I optionally narrow the view to a specific team member and/or adjust the date range so every summary, chart, and table on the screen reflects the same filter context.

**Why this priority**: Shared filters keep the performance view coherent and reuse the familiar Team Deliverables / Team Analytics selection pattern.

**Automated Test Requirement**: Add tests at `tests/022-pr-developer-performance/filters.us2.test.md` covering: default 60-day range; optional team member picker populated from the leader's descendant subtree; all widgets refresh when filters change; invalid date ranges are blocked; clearing the team member selection restores subtree-wide aggregates; empty filtered results show clear empty states without errors.

**Frontend Design**: The top filter bar MUST include a changeable start/end date range defaulting to the last 60 days and the same hierarchical team member picker used on Team Deliverables / Team Analytics (optional selection). Filter changes MUST refresh all visible performance widgets without requiring a separate search action.

**Internationalization**: Filter labels, validation messages, placeholder text, and empty-state copy MUST be i18n keys in `en-US` and `pt-BR`.

**Access Control Validation**: The team member picker MUST only list direct and indirect reports (exclude self). Selecting or clearing a member MUST NOT expose metrics for users outside the leader's subtree.

**Acceptance Scenarios**:

1. **Given** a leader on Team PR Performance with the default date range, **When** they select a team member from the picker, **Then** all summaries, charts (including weekly authored PRs by classification), and tables update to show metrics for that person only within the current date range.
2. **Given** a leader has selected a team member, **When** they clear the selection, **Then** all widgets update to aggregate or compare across the entire reporting subtree again (weekly classification chart returns to team-wide weekly stacks).
3. **Given** a leader changes the start or end date, **When** the new range is valid, **Then** all widgets refresh using pull request activity whose relevant PR date falls within the inclusive calendar-day bounds of the range.
4. **Given** a leader sets an end date before the start date, **When** they attempt to apply the range, **Then** the system shows a clear validation message and does not refresh widgets with invalid bounds.
5. **Given** no pull request activity matches the current filters for the authorized subtree, **When** the screen renders, **Then** an empty state is shown and metric cards show zero (or equivalent empty metrics) without erroring.

---

### User Story 3 - See team PR performance summaries and comparison (Priority: P1)

As a leader, I see at-a-glance team totals (pull requests authored, comments made, reviews submitted) and a per-developer comparison of those same signals over the selected period so I can understand relative contribution from imported PR data.

**Why this priority**: The summaries and per-developer comparison are the primary value of the screen—helping managers understand developer PR performance quickly.

**Automated Test Requirement**: Add tests at `tests/022-pr-developer-performance/summaries-comparison.us3.test.md` covering: team totals for authored PRs, comments, and reviews within filter scope; per-developer breakdown for the same three signals; only subtree members with linked GitHub activity (or zero rows for members with no activity, presented consistently); filters update all widgets; single-member filter shows that member's metrics without other developers.

**Frontend Design**: Below the filters, the layout MUST present (1) summary cards or equivalent for team totals of authored PRs, comments, and reviews, and (2) a comparison visualization (chart and/or ranked table) that makes per-developer differences readable. Visual hierarchy MUST keep the comparison scannable for a typical team size.

**Internationalization**: Card titles, chart/table titles, axis/legend/column labels, and zero/empty messaging MUST be i18n keys in `en-US` and `pt-BR`.

**Access Control Validation**: Totals and per-developer series MUST include only authorized subtree members. Peers, superiors, and out-of-branch users MUST NEVER appear as labels, series, or contributors to totals.

**Acceptance Scenarios**:

1. **Given** two reports authored three and one pull requests respectively in the selected period, **When** the leader views team summaries without a member filter, **Then** the authored total is four and the comparison shows both developers with their individual authored counts.
2. **Given** reports made comments and submitted reviews on pull requests in the filtered set, **When** summary cards render, **Then** comment and review totals reflect those counts and the comparison attributes each count to the correct developer.
3. **Given** a leader selects one team member, **When** widgets refresh, **Then** totals and comparison reflect only that member's metrics.
4. **Given** a team member has no imported PR activity in the period, **When** the comparison renders in subtree-wide view, **Then** that member appears with zero metrics (or is listed in an inactive/zero group) so low or missing activity is visible rather than silently omitted in a misleading way—or the screen documents an empty-activity treatment that still allows the leader to understand who contributed.
5. **Given** a team member has no display name, **When** they appear in comparison labels, **Then** their email is used as the fallback label.

---

### User Story 4 - Browse per-developer activity detail table (Priority: P2)

As a leader, I browse a data table of developers in scope with their authored PR count, comment count, and review count for the filtered period, and optionally open a developer row to see the underlying pull requests that contributed to those metrics.

**Why this priority**: The table supports coaching conversations after scanning the high-level comparison; drill-down is valuable but secondary to the summary view.

**Automated Test Requirement**: Add tests at `tests/022-pr-developer-performance/detail-table.us4.test.md` covering: table columns for developer identity and the three metric counts; rows limited to authorized subtree (or the selected member); stable default ordering (for example by authored PR count descending, then display name); optional row drill-down lists the contributing PRs for that developer within filters; empty filtered set shows no misleading rows; hierarchical DAC deny cases for peers/superiors.

**Frontend Design**: Below the summaries/comparison, a Material UI data table MUST list developers and their PR performance metrics. If drill-down is provided, selecting a row MUST open a modal or expandable panel with the developer's contributing pull requests for the current filters, dismissible without losing filter state.

**Internationalization**: Column headers, drill-down titles, role/empty labels, and close affordance text MUST be i18n keys in `en-US` and `pt-BR`.

**Access Control Validation**: Table rows and any drill-down contents MUST expose only authorized subtree members and their imported PR activity within scope. Peer and superior activity MUST NOT appear.

**Acceptance Scenarios**:

1. **Given** three reports with different authored/comment/review counts in the filtered period, **When** the table renders, **Then** each report appears once with correct metric counts.
2. **Given** a leader selects a team member filter, **When** the table refreshes, **Then** only that member's row (or an equivalent single-person detail) is shown.
3. **Given** the leader opens a developer row drill-down, **When** details load, **Then** only that developer's contributing pull requests for the current filters are listed.
4. **Given** no developers have activity and the product chooses not to list zero-activity members as rows, **When** the table renders, **Then** an empty state is shown rather than placeholder or other users' data.
5. **Given** multiple developers, **When** the table loads, **Then** rows use a stable, understandable default order (highest authored PR count first, with a documented tie-breaker).

---

### User Story 5 - Weekly authored PRs by classification chart (Priority: P1)

As a leader, I see a chart of how many pull requests developers **authored** (created) each calendar week in the selected period, broken down by pull request classification (feature, fix, documentation, maintenance), so I can understand the mix of work being shipped over time—for the whole reporting subtree by default, or for one selected team member.

**Why this priority**: Explicitly requested for coaching and performance understanding; complements volume totals with classification mix over time.

**Automated Test Requirement**: Add tests at `tests/022-pr-developer-performance/chart-prs-by-classification.us5.test.md` covering: weekly bucketing of authored PRs only; series/segments for each known classification type; team-wide aggregate when no member is selected; single-member series when a member is selected; empty weeks shown as zero; filters refresh the chart; hierarchical DAC (no peer/superior data); effective classification used for bucketing (user reclassification preferred when present, otherwise system classification).

**Frontend Design**: The chart MUST appear on the Team PR Performance screen with a clear title and legend distinguishing classification types. Weeks MUST be labeled in chronological order for the selected date range. Visual treatment SHOULD align with the existing Team Analytics weekly stacked/segmented chart pattern where practical.

**Internationalization**: Chart title, legend labels for each classification (and any unclassified bucket if later defined), empty-state copy, and axis labels MUST be i18n keys in `en-US` and `pt-BR`.

**Access Control Validation**: Counts MUST include only authored pull requests owned by users in the authorized subtree (or the single selected member). No peer, superior, or out-of-branch data.

**Acceptance Scenarios**:

1. **Given** no team member is selected and reports authored feature and fix pull requests in the same calendar week within scope, **When** the leader views the weekly classification chart, **Then** that week shows separate counts (or stacked segments) per classification totaling the authored pull requests created that week across the subtree.
2. **Given** a leader selects one team member, **When** the chart refreshes, **Then** only that member's authored pull requests contribute to weekly classification totals.
3. **Given** a leader clears the team member selection, **When** the chart refreshes, **Then** it returns to team-wide weekly classification aggregates for the reporting subtree.
4. **Given** a week in the selected range with no authored pull requests in scope, **When** the chart renders, **Then** that week appears with zero counts for all classification series.
5. **Given** an authored pull request has a user reclassification different from its original system classification, **When** it is counted on the chart, **Then** it is bucketed under the effective classification (user reclassification takes precedence).
6. **Given** a leader changes the date range to a valid new period, **When** the chart refreshes, **Then** weekly buckets and classification counts reflect only authored PRs whose PR date falls within the inclusive range.

---

### Edge Cases

- Leader has no subordinates: show a clear empty guidance state; do not invent team members or metrics.
- Subordinates exist but none have linked GitHub logins / imported PR data in the period: show empty metrics with clear messaging.
- Selected team member has no GitHub login: show unavailable/empty guidance for that person without falling back to other users' data.
- Very large teams or long date ranges: page remains usable (pagination or equivalent for tables); summaries remain consistent with the filtered set.
- Imported PR data temporarily unavailable or request fails: show a recoverable error message; do not present stale data as current without indication.
- Developer was both author and commenter/reviewer on the same PR: count the PR once in authored totals; still count their comments/reviews separately.
- Date range includes days/weeks with no activity: comparison and charts treat those periods as zero rather than omitting the timeline in a misleading way when time-series are shown.
- Peer or superior identity must never appear in pickers, labels, totals, charts, or drill-down lists.
- Weekly classification chart counts authored (“created”) pull requests only; comments and reviews do not create chart series.
- Authored PRs with missing or unknown classification: treatment TBD pending clarification (do not silently invent a classification type).

## Requirements _(mandatory, with required test coverage)_

### Functional Requirements

_All functional requirements MUST be covered by automated tests. Define the test(s) for each requirement below._

_For features that expose collaborator or organizational data, requirements MUST define a hierarchical DAC matrix that allows only self + descendants (recursive) and denies peer/superior visibility for every API endpoint, report, and visualization in scope._

- **FR-001**: System MUST provide a leader-only Team PR Performance screen reachable from the Leader section of application navigation.
- **FR-002**: System MUST load PR performance metrics for the leader's reporting subtree for a default period of the last 60 calendar days on first open.
- **FR-003**: Leaders MUST be able to filter by an inclusive start and end date (period). Invalid ranges MUST be rejected with a clear message.
- **FR-004**: Leaders MUST be able to optionally filter to one team member from their descendant subtree (same hierarchical picker rules as Team Deliverables / Team Analytics). Clearing the selection MUST restore subtree-wide view.
- **FR-005**: Period and team member filters MUST apply consistently to summary cards, comparison visualization, the weekly authored-PRs-by-classification chart, and the detail table.
- **FR-006**: System MUST display team (or selected-member) totals for: pull requests authored, comments made, and reviews submitted within the filtered imported PR data.
- **FR-007**: System MUST display a per-developer comparison of authored PRs, comments, and reviews for developers in the authorized filter scope.
- **FR-008**: System MUST display a data table of developers in scope with at least: developer identity (display name with email fallback), authored PR count, comment count, and review count.
- **FR-009**: System MUST allow the leader to inspect the contributing pull requests behind a developer's metrics for the current filters (row drill-down).
- **FR-010**: Non-leaders MUST NOT see the menu entry or retrieve team PR performance data.
- **FR-011**: When no eligible data matches filters, the system MUST show empty states and zero (or equivalent) metrics without erroring.
- **FR-012**: All user-visible web UI strings for this feature MUST be externalized for `en-US` and `pt-BR` with key parity.
- **FR-013**: Every API, report, and visualization in this feature MUST enforce hierarchical visibility: only the leader's recursive descendants (and selected descendant when filtered). Peer, superior, and out-of-branch data MUST be denied.
- **FR-014**: Metrics MUST be derived from already imported pull request activity linked to users in scope; the screen MUST NOT invent activity for users without imported data.
- **FR-015**: System MUST display a weekly chart of authored pull requests broken down by pull request classification (feature, fix, documentation, maintenance) for the selected period.
- **FR-016**: When no team member is selected, the weekly classification chart MUST aggregate authored PRs across the leader's reporting subtree; when a team member is selected, it MUST show only that member's authored PRs.
- **FR-017**: Classification bucketing on the weekly chart MUST use the effective classification (user reclassification when present; otherwise the system classification).

### Access Control Matrix _(required when data visibility is in scope)_

| Actor                           | Allowed Data Visibility                                       | Explicitly Denied Visibility              | Validation Notes                                 |
| ------------------------------- | ------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------ |
| Top leader                      | Self excluded from team aggregates; all descendant PR metrics | Non-descendants                           | Subtree-wide + single-member filter tests        |
| Mid leader                      | Descendant subtree PR metrics only                            | Superiors, peers, other branches          | Recursive descendant allow; peer/superior deny   |
| Individual contributor          | None (no menu / no data)                                      | All team PR performance data              | Route and data access denied                     |
| Administrator (non-leader path) | None via this leader screen unless they also hold leader role | Other users' team metrics via this screen | Admin privilege does not bypass leader-only gate |
| Unauthenticated user            | None                                                          | All PR performance data                   | Route/data access denied                         |

### Key Entities _(include if feature involves data)_

- **Team PR Performance View**: The filtered set of imported pull request contribution metrics for developers in a leader's reporting subtree over a period, optionally narrowed to one member.
- **Developer PR Performance Metrics**: Per-person counts of authored pull requests, comments made, and reviews submitted within the filtered imported PR data.
- **Team PR Performance Totals**: Aggregated authored, comment, and review counts across the current filter scope.
- **Contributing Pull Request**: An imported pull request that counts toward a developer's metrics in the selected period (for drill-down).
- **Weekly Authored PR Classification Series**: Time-bucketed counts of authored pull requests per calendar week, segmented by effective pull request classification, for either the full authorized subtree or one selected member.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A leader can open Team PR Performance and understand subtree PR contribution totals within 30 seconds of page load under normal conditions (default filters applied, summaries visible without extra navigation).
- **SC-002**: 100% of leaders in usability validation can identify the top authored-PR contributor in their subtree from the comparison or table on the first attempt with default filters.
- **SC-003**: Changing period or team member filter updates all on-screen metrics so that totals, comparison, weekly classification chart, and table remain consistent with each other for every tested filter combination.
- **SC-004**: In authorization tests, 0% of peer or superior PR metrics leak into pickers, totals, comparisons, charts, tables, or drill-downs.
- **SC-005**: Leaders with empty teams or no imported PR data see a clear empty state rather than errors or fabricated performance numbers in 100% of those cases.
- **SC-006**: All user-visible strings for the screen are available in both English (United States) and Brazilian Portuguese with complete key parity before release.
- **SC-007**: With default filters, a leader can see for each week in range how many authored PRs fall into each classification category (team-wide), and after selecting a member can see that member's weekly classification mix, without leaving the page.

## Assumptions

- Target users are leaders/managers with the existing leader role; individual contributors continue to use the personal My Pull Requests screen for their own activity.
- "Performance" for this release means contribution volume signals from imported PR data: authored pull requests, comments, and reviews—not code quality scores, cycle time SLAs, or subjective ratings.
- Imported GitHub pull request data and user–GitHub linkage from prior features are available; this feature visualizes and aggregates that data for the leader subtree rather than importing new sources.
- Default period of the last 60 days matches Team Analytics and My Pull Requests for consistency.
- Team member picker behavior matches Team Deliverables / Team Analytics (descendants only, optional, excludes self).
- Leader's own PR activity is excluded from team performance aggregates and pickers, consistent with other leader team views.
- Ranking or "performance" presentation is comparative and informational for coaching; the product does not auto-assign performance grades or HR outcomes.
- Mobile-responsive layout follows existing app shell patterns; a dedicated native mobile app is out of scope.
- Drill-down shows contributing PRs already available in imported data; creating deliverables from PRs remains owned by existing features.
- Weekly classification chart counts authored PRs only (“creating”), using the product’s existing classification types (feature, fix, documentation, maintenance) and effective classification (user reclassification preferred over system classification), consistent with My Pull Requests.
- When no team member is selected, the weekly classification chart shows team-wide aggregates; when a member is selected, it shows that member only.
