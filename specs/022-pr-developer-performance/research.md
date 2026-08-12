# Research: PR Developer Performance

## Decision 1: Server-side aggregated leader endpoint (not client rollup of raw PRs)

- **Decision**: Add `GET /users/leader/team-pr-performance?startDate=&endDate=&userId?` returning totals, per-developer metrics, `weekStarts[]`, and weekly authored-by-classification rows in one response. Add a separate drill-down `GET /users/leader/team-pr-performance/developers/{userId}/pull-requests?startDate=&endDate=` for contributing PR list.
- **Rationale**: Spec FR-005/FR-013 and SC-003 require filter-consistent widgets with hierarchical DAC. Team Analytics (016) already proved one authorized aggregate round-trip is safer and faster than shipping raw multi-user PR graphs to the browser.
- **Alternatives considered**:
  - Reuse `POST /github-pull-requests/my-activity` per member (rejected: N+1 calls; my-activity is self-only).
  - Extend `POST /github-pull-requests/query` with multi-login + client aggregates (rejected: authored-only query misses comment/review metrics; client rollup risks leakage and large payloads).
  - Single mega-payload including all drill-down PRs (rejected: heavy for 60-day subtree).

## Decision 2: Map developers via `users.github_login`

- **Decision**: Resolve in-scope users with `fetchLeaderDescendantRows` (or single subtree `userId`). Join activity by case-insensitive match of `users.github_login` to `author_github_login` / comment `author_github_login` / review `reviewer_github_login`. Users without a GitHub login contribute **zero** metrics and appear only if product chooses zero rows (table: include with zeros for visibility of missing linkage in subtree-wide view when they are descendants—prefer include zeros so low/missing activity is visible per US3).
- **Rationale**: Spec Assumptions and FR-014; mirrors how personal activity binds identity. Import data is login-keyed.
- **Alternatives considered**:
  - Match only authors present in imported tables and omit silent zeros (rejected: harder for leaders to spot unlinked reports).

## Decision 3: Date and week semantics (`merged_at`)

- **Decision**: Filter PRs with **`merged_at`** using inclusive UTC calendar-day bounds via existing `validateDateRange` / `toUtcStartOfDay` / `toUtcEndOfDay`. Bucket weeks with PostgreSQL `date_trunc('week', merged_at)` (Monday UTC week start, same as 016). Comment/review counts attach to PRs whose `merged_at` is in range (same filtered PR set pattern as 020 cards).
- **Rationale**: Aligns with My Pull Requests PR date (020 research). Spec “PR date” for this product is merge date of imported PRs.
- **Alternatives considered**:
  - GitHub `created_at` / opened date (rejected: not the established product PR date).
  - Comment/review event timestamps as primary filter (rejected: inconsistent with authored chart axis).

## Decision 4: Metric definitions

- **Decision**:
  - **Authored count**: distinct imported PRs where developer is author and `merged_at` in range.
  - **Comment count**: count of comment rows authored by the developer’s login on imported PRs with `merged_at` in range.
  - **Review count**: count of review rows by the developer’s login on imported PRs with `merged_at` in range.
  - Author who also commented/reviewed: PR counts once in authored; comments/reviews still counted.
- **Rationale**: Matches FR-006/FR-007 and 020 card semantics at team scope.
- **Alternatives considered**:
  - Distinct PRs commented/reviewed instead of event counts (rejected: 020 uses event counts).

## Decision 5: Weekly classification chart + Unclassified

- **Decision**: Stacked weekly series for authored PRs only. Effective class = `COALESCE(user_reclassification, classification_type)`. Null effective class → bucket key `unclassified` (API) / Unclassified (UI). Always zero-fill all weeks in range and all series keys (`feature`, `fix`, `documentation`, `maintenance`, `unclassified`) so empty weeks show zeros. Unfiltered = subtree authored aggregates; `userId` set = that member only (clarify Option A).
- **Rationale**: FR-015–FR-018, US5, clarify session; week segment sum must equal authored count (SC-008).
- **Alternatives considered**:
  - Exclude unclassified (rejected in clarify).
  - Force-map to `maintenance` (rejected: dishonest).
  - Chart only when member selected (rejected in clarify Option A).

## Decision 6: Comparison visualization + table ordering

- **Decision**: Use `@mui/x-charts` grouped/stacked bars (or horizontal bar comparison) for per-developer authored/comment/review when unfiltered; single-developer metrics when filtered. Detail table columns: display name (email fallback), authored, comments, reviews. Default sort: authored desc, then display name asc. Cap chart legend/series to a reasonable top-N by authored if needed (document in tasks; table remains complete).
- **Rationale**: FR-007/FR-008; reuse chart stack from 016/020; table supports coaching (US4).
- **Alternatives considered**:
  - Table-only without comparison chart (rejected: US3 asks for comparison visualization).
  - Resizable analytics grid (rejected: not requested; overkill vs fixed layout).

## Decision 7: Drill-down payload

- **Decision**: On row open, call drill-down endpoint returning PR summaries for that developer in the current period: PRs they authored **or** commented on **or** reviewed (same involvement rule as my-activity), with repository, mergedAt, role (owner/involved), effectiveClassification, title, and nested comment/review counts for the actor. Modal patterned after `PullRequestDetailModal` / team deliverable review modal.
- **Rationale**: FR-009; on-demand load; DAC re-asserted for `{userId}`.
- **Alternatives considered**:
  - Authored-only drill-down (rejected: metrics include comments/reviews).
  - Client-only expansion without second call (rejected without shipping full PR graph in aggregate).

## Decision 8: Route, navigation, i18n

- **Decision**: Route `/app/leader/team-pr-performance` behind `LeaderRoute`. Menu label key `menu.teamPrPerformance` (en: “Team PR Performance”). Screen copy under `leader.teamPrPerformance.*` in `en-US`/`pt-BR` `leader.json`. Reuse `TeamMemberHierarchyPicker`, `defaultLast60DayRange()`, `isValidDateRange`.
- **Rationale**: Consistent with Team Analytics placement; Principle IX.
- **Alternatives considered**:
  - Extend Team Analytics page with PR widgets (rejected: separate navigation and stories; keeps deliverable vs PR concerns clear).
  - New i18n namespace (rejected: leader section already uses `leader` ns).

## Decision 9: Empty and error states

- **Decision**: No descendants → guidance empty state, no fabricated metrics. Descendants without GitHub/import activity → zeros + empty chart series. API failure → recoverable error; do not present stale success data unmarked. Invalid dates → client validation + API 400.
- **Rationale**: FR-011, edge cases, SC-005.
- **Alternatives considered**:
  - Hide zero-activity members entirely (optional later; v1 prefers visibility of zeros for coaching honesty).
