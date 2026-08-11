# Feature Specification: User Pull Request Activity

**Feature Branch**: `020-user-pr-activity`  
**Created**: 2026-08-11  
**Status**: Draft  
**Input**: User description: "the backend have an api to retrieve the pull requests that a user was involved. Lets create a screen for the user to see the prs. The screen should have: filter by period, filter by repository, show a chart showing the prs the the user were authored and a card showing the number of comments and other the number of reviews. below this lets create a datatable to show the Prs with the following information: repository, pr date, if the user was owner of the Pr or involved in the PR. When clicking on the item open a modal window showing all the information related to the PR"

## User Scenarios & Testing _(mandatory, with required automated tests)_

### User Story 1 - Open My Pull Requests screen (Priority: P1)

As an authenticated collaborator with a linked GitHub login, I open a **My Pull Requests** (or equivalently named) screen from the application menu and land on a page that loads my imported pull request activity for a sensible default period so I can review my GitHub contribution without leaving the product.

**Why this priority**: Navigation and initial load are the entry point for every filter, summary, and detail interaction on the screen.

**Automated Test Requirement**: Add tests at `tests/020-user-pr-activity/screen-access.us1.test.md` (and corresponding UI tests under `tests/020-user-pr-activity/` / `packages/web/tests/`) covering: menu entry visibility for authenticated users, route loads for signed-in users, users without a GitHub login see a clear empty/unavailable state without inventing data, default period applied on first load, and unauthenticated access denied.

**Frontend Design**: Implementation MUST use the `frontend-design` skill with Material UI best practices for the activity screen (filter bar, summary area, and table layout consistent with existing app shell patterns).

**Internationalization**: All user-visible strings (menu label, filters, chart/card titles, table headers, role labels, empty states, modal titles, errors) MUST be externalized to `en-US` and `pt-BR` catalogs. Tests MUST verify both locales and key parity.

**Access Control Validation**: The screen shows only the logged-in user's own imported pull request activity. Peers', superiors', and subordinates' activity MUST NOT appear on this screen. Unauthenticated users MUST NOT access the route or its data.

**Acceptance Scenarios**:

1. **Given** a logged-in user with a GitHub login and imported pull request data, **When** they open the application menu, **Then** a My Pull Requests option is available and navigating to it loads the activity screen.
2. **Given** a logged-in user opens My Pull Requests for the first time, **When** the page loads, **Then** the period filter defaults to the last 60 calendar days (rolling window ending today) and summaries plus the table reflect that default period.
3. **Given** a logged-in user without a GitHub login, **When** they open My Pull Requests, **Then** the screen explains that GitHub activity is unavailable until a GitHub login is linked and does not show fabricated pull request rows.
4. **Given** an unauthenticated visitor, **When** they navigate directly to the My Pull Requests route, **Then** access is denied and no pull request data is shown.

---

### User Story 2 - Filter by period and repository (Priority: P1)

As a user on My Pull Requests, I narrow the view by date period and optionally by repository so the chart, summary cards, and table all reflect the same filtered set of pull requests I authored or was involved in.

**Why this priority**: Shared filters are required for the summaries and table to be trustworthy and usable across many repositories and time ranges.

**Automated Test Requirement**: Add tests at `tests/020-user-pr-activity/filters.us2.test.md` covering: default 60-day period; changing start/end dates refreshes chart, cards, and table; repository options are derived from repositories present in the user's activity for the selected period (or clear empty options when none); selecting a repository narrows all sections; clearing repository restores period-only results; invalid ranges (end before start) are blocked with a clear message; empty filtered results show an empty state without errors.

**Frontend Design**: A filter bar at the top MUST include a period (start/end date) control and a repository filter. Filter changes MUST update the chart, both cards, and the table together without requiring a separate "search" step beyond applying the filter controls.

**Internationalization**: Filter labels, validation messages, placeholder text, and empty-state copy MUST be i18n keys in `en-US` and `pt-BR`.

**Access Control Validation**: Filters MUST only operate on the logged-in user's own authorized activity. Repository options MUST NOT reveal repositories that appear only in other users' imported data.

**Acceptance Scenarios**:

1. **Given** the user is on My Pull Requests with the default period, **When** they change the start or end date to a valid range, **Then** the chart, comment card, review card, and table all refresh to the new period.
2. **Given** imported activity spans multiple repositories in the selected period, **When** the user opens the repository filter, **Then** they can choose among those repositories (plus an all-repositories option or equivalent clear state).
3. **Given** a repository is selected, **When** summaries and the table refresh, **Then** only pull requests for that repository in the period are included.
4. **Given** the user clears the repository filter, **When** the screen refreshes, **Then** all repositories in the period are included again.
5. **Given** the user sets an end date before the start date, **When** they attempt to apply the period, **Then** a clear validation message is shown and the previous valid results remain.
6. **Given** no pull requests match the current filters, **When** the screen renders, **Then** an empty state is shown for the chart, cards show zero (or equivalent empty metrics), and the table has no rows.

---

### User Story 3 - See authored PR chart and comment/review summary cards (Priority: P1)

As a user, I see a chart of pull requests I authored over the selected period (respecting repository filter) and two summary cards: one for the number of comments I made and one for the number of reviews I submitted, so I can grasp contribution volume at a glance before reading the table.

**Why this priority**: The visual and numeric summaries are the primary “at a glance” value of the screen and were explicitly requested.

**Automated Test Requirement**: Add tests at `tests/020-user-pr-activity/summaries.us3.test.md` covering: authored-PR chart counts only PRs where the user is the author; weekly (or clearly labeled chronological) bucketing within the selected period; comment card counts only comments authored by the user within the filtered PR set; review card counts only reviews submitted by the user within the filtered PR set; filters update all three widgets; empty period yields zero/empty chart series.

**Frontend Design**: Below the filters, the layout MUST present (1) a chart of authored pull requests over time and (2) two distinct cards for comment count and review count. Visual hierarchy MUST make the chart and cards readable above the table without crowding.

**Internationalization**: Chart title, axis/legend labels as applicable, card titles, and zero/empty messaging MUST be i18n keys in `en-US` and `pt-BR`.

**Access Control Validation**: Chart and card metrics MUST be computed only from the logged-in user's own activity in scope. No other collaborator's authored PRs, comments, or reviews contribute to these widgets.

**Acceptance Scenarios**:

1. **Given** the user authored three pull requests in different weeks of the selected period, **When** the chart renders, **Then** those authored pull requests appear in the correct time buckets and pull requests the user only commented on or reviewed do not inflate the authored series.
2. **Given** the user made five comments and two reviews on pull requests in the filtered set, **When** the cards render, **Then** the comments card shows 5 and the reviews card shows 2.
3. **Given** the user narrows to one repository, **When** widgets refresh, **Then** chart and card values include only activity for that repository in the period.
4. **Given** no authored pull requests in range but some comments/reviews exist, **When** the screen renders, **Then** the authored chart is empty/zero while the comment and review cards still reflect those counts.

---

### User Story 4 - Browse PR table and open detail modal (Priority: P1)

As a user, I browse a data table of pull requests I authored or was involved in (commented and/or reviewed), see repository, PR date, and whether I was the owner or only involved, and open a row to view a modal with the full pull request information (including related comments and reviews when available).

**Why this priority**: The table and detail modal are how users inspect individual contributions after scanning the summaries.

**Automated Test Requirement**: Add tests at `tests/020-user-pr-activity/table-detail.us4.test.md` covering: table columns for repository, PR date, and ownership/involvement role; rows include authored PRs and PRs where the user commented or reviewed but did not author; role labeling distinguishes owner vs involved; row click opens a modal with full PR information available from the retrieved data (title, description/body when present, repository, dates, branches, counts, URL when present, nested comments and reviews); closing the modal returns to the table; empty filtered set shows no rows; sorting or stable default ordering by PR date (newest first) is verified.

**Frontend Design**: Below the chart/cards, a Material UI data table MUST list matching pull requests. Clicking a row MUST open a modal dialog with comprehensive PR details. The modal MUST be dismissible and must not navigate away from the screen.

**Internationalization**: Column headers, owner/involved labels, modal title/section labels, empty table copy, and close affordance text MUST be i18n keys in `en-US` and `pt-BR`.

**Access Control Validation**: Table rows and modal contents MUST expose only pull requests from the logged-in user's own authorized activity. Detail content MUST NOT reveal other collaborators' activity beyond what is already part of those shared PR records the user is entitled to see for their own involvement.

**Acceptance Scenarios**:

1. **Given** filtered results include an authored PR and a PR the user only reviewed, **When** the table renders, **Then** both rows appear with correct repository and PR date, the authored row is marked as owner, and the reviewed-only row is marked as involved.
2. **Given** the user clicks a table row, **When** the modal opens, **Then** it shows the pull request’s full available information (at least title, repository, PR date, author, ownership/involvement context, and associated comments and reviews when present).
3. **Given** the modal is open, **When** the user closes it, **Then** they return to the same filtered table view without losing filter selections.
4. **Given** no matching pull requests, **When** the table renders, **Then** an empty state is shown instead of placeholder rows.
5. **Given** multiple matching pull requests, **When** the table loads, **Then** rows are ordered by PR date with newest first unless the user applies an explicit alternate sort provided by the table.

---

### Edge Cases

- User has no GitHub login linked: show guidance empty state; do not call for other users' data.
- User has GitHub login but no imported activity in the selected period: empty chart/cards/table with clear messaging.
- Repository filter selected then period changed so that repository no longer appears: clear or reset repository filter gracefully and refresh.
- Very large result sets for long periods: page remains usable (table pagination or equivalent browsing control); summaries remain consistent with the filtered set.
- Pull request missing optional fields (body, URL, etc.): modal still opens and shows available fields without errors.
- User was both author and commenter/reviewer on the same PR: treat as owner in the table role column; still count their comments/reviews in the cards.
- Imported data temporarily unavailable or request fails: show a recoverable error message; do not show stale data as if it were current without indication.

## Requirements _(mandatory, with required test coverage)_

### Functional Requirements

_All functional requirements MUST be covered by automated tests. Define the test(s) for each requirement below._

_For features that expose collaborator or organizational data, requirements MUST define a hierarchical DAC matrix that allows only self + descendants (recursive) and denies peer/superior visibility for every API endpoint, report, and visualization in scope._

- **FR-001**: System MUST provide an authenticated My Pull Requests screen reachable from the application navigation for signed-in users.
- **FR-002**: System MUST load the logged-in user's imported pull request activity for a default period of the last 60 calendar days on first open.
- **FR-003**: Users MUST be able to filter activity by an inclusive start and end date (period). Invalid ranges MUST be rejected with a clear message.
- **FR-004**: Users MUST be able to filter activity by repository, including an all-repositories state. Repository choices MUST be limited to repositories present in the user's activity for the current period.
- **FR-005**: Period and repository filters MUST apply consistently to the authored-PR chart, comment card, review card, and data table.
- **FR-006**: System MUST display a chart of pull requests authored by the logged-in user over the selected filtered period.
- **FR-007**: System MUST display a summary card with the count of comments authored by the logged-in user on pull requests in the filtered set.
- **FR-008**: System MUST display a summary card with the count of reviews submitted by the logged-in user on pull requests in the filtered set.
- **FR-009**: System MUST display a data table of pull requests where the logged-in user is the author (owner) or was involved via comment and/or review, showing at least: repository, PR date, and owner vs involved role.
- **FR-010**: Selecting a table row MUST open a modal with the full available pull request information for that item, including related comments and reviews when present.
- **FR-011**: Users without a linked GitHub login MUST see a clear unavailable/empty guidance state rather than other users' data or silent failure.
- **FR-012**: When no pull requests match the filters, the system MUST show empty states for chart/table and zero (or equivalent) metrics on cards without erroring.
- **FR-013**: All user-visible web UI strings for this feature MUST be externalized for `en-US` and `pt-BR` with key parity.
- **FR-014**: The My Pull Requests screen and its data retrieval MUST expose only the logged-in user's own activity (self). Peer, superior, and subordinate activity MUST NOT be shown on this screen.

### Access Control Matrix _(required when data visibility is in scope)_

| Actor                          | Allowed Data Visibility                         | Explicitly Denied Visibility                         | Validation Notes                                      |
| ------------------------------ | ----------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------- |
| Individual contributor         | Own imported PR activity only                   | All other users                                      | Screen + data tests for self-only                     |
| Leader                         | Own imported PR activity only (this screen)     | Subordinates, peers, superiors on this screen        | Leaders use other features for team views if needed   |
| Administrator                  | Own imported PR activity only (this screen)     | Other users' activity on this screen                 | Admin privilege does not broaden this personal screen |
| Unauthenticated user           | None                                            | All PR activity                                      | Route/data access denied                              |

### Key Entities _(include if feature involves data)_

- **User Pull Request Activity View**: The filtered set of imported pull requests relevant to the logged-in user for a period and optional repository, including authored and involvement-based membership.
- **Authored Pull Request Series**: Time-bucketed counts of pull requests where the user is the author, used by the chart.
- **Comment Count / Review Count**: Aggregates of comments and reviews authored by the user within the filtered pull request set, shown on summary cards.
- **Pull Request List Item**: Table row with repository, PR date, and role (owner vs involved).
- **Pull Request Detail**: Full imported pull request information shown in the modal, including nested comments and reviews when available.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Authenticated users with a GitHub login and matching imported data can open My Pull Requests and see their default-period activity (chart, cards, and at least one table row when data exists) within 5 seconds under normal conditions.
- **SC-002**: Changing period or repository updates chart, both cards, and table so that 100% of visible metrics and rows remain consistent with the active filters (spot-checkable in acceptance tests).
- **SC-003**: In usability checks, at least 90% of participants correctly identify whether a listed pull request marks them as owner vs involved on the first attempt.
- **SC-004**: Users can open a pull request row and view complete available detail in the modal, then dismiss it and continue filtering, without losing their filter context.
- **SC-005**: Users without a GitHub login or with no matching activity always receive a clear empty/unavailable state rather than incorrect third-party data (0 cross-user data leaks in access tests).
- **SC-006**: All new user-visible strings for the feature are available in both English (`en-US`) and Portuguese (`pt-BR`).

## Assumptions

- The existing backend capability to retrieve imported pull requests for a user (by GitHub identity and date range) is reused as the data source; this feature focuses on the web screen experience and any thin client-side aggregation needed for chart/cards/role labeling.
- “Involved” means the user commented on and/or reviewed the pull request but is not its author; “owner” means the user is the pull request author. A user who is both author and commenter/reviewer is shown as owner.
- “PR date” means the pull request’s merged date from imported data (consistent with the existing import/query model).
- Default period is the last 60 calendar days, matching other analytics-style screens in the product.
- Repository filter is a single-select (or equivalent one-repository-at-a-time) control plus an all-repositories state for v1.
- Authored chart uses chronological buckets within the selected period (weekly buckets unless planning selects a clearer alternative that remains testable).
- Comment and review cards count actions performed by the logged-in user (not total comments/reviews on those PRs by everyone).
- This screen is personal (self-only). Viewing a subordinate’s or peer’s PR activity on this screen is out of scope.
- Users must already have a GitHub login on their profile for activity to load; linking GitHub remains a profile concern outside this feature.
- Table pagination (or equivalent) may be used when result sets are large; exact page size is a planning detail as long as browsing remains usable.
- Mobile-responsive layout follows existing app shell patterns; no separate mobile-only design is required for v1.
