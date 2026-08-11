# Research: User Pull Request Activity

## Decision 1: New self-only my-activity endpoint (not authored-only query alone)

- **Decision**: Add `POST /github-pull-requests/my-activity` with body `{ startDate, endDate }` only. Resolve the actor’s GitHub login from `request.auth.userId`. Return imported pull requests where the actor is **author OR comment author OR review reviewer** (case-insensitive login match) and `mergedAt` falls in the inclusive UTC date range. Do **not** accept arbitrary `githubLogins` on this endpoint.
- **Rationale**: Existing `POST /github-pull-requests/query` filters only by `author_github_login` (018/019). Spec FR-009 and US3/US4 require involved rows and comment/review counts on PRs the user did not author. A session-bound endpoint enforces FR-014 (self-only) more strongly than trusting the client to pass only its own login into the hierarchical query API.
- **Alternatives considered**:
  - Call existing `/query` with self login + client aggregate (rejected: never returns non-authored involved PRs).
  - Extend `/query` with an `involvement` flag (rejected: widens a multi-login DAC endpoint; harder to keep this screen self-only).
  - Separate summary endpoint + list endpoint (rejected: extra round-trips; filters must stay consistent per FR-005).

## Decision 2: Client-side repository filter and summary aggregation

- **Decision**: Backend returns the period-scoped activity list (with nested comments/reviews). Web applies repository filter, builds weekly authored chart series, comment/review card counts, table role labels, and modal content from that payload.
- **Rationale**: Spec allows thin client aggregation; repository options must be derived from the user’s activity in the period (FR-004). Keeps the API simple and avoids duplicating week-bucket logic server-side for a personal screen.
- **Alternatives considered**:
  - Server-side repository filter + pre-aggregated chart/cards (rejected: more contract surface for little gain at personal scale).

## Decision 3: Involvement role labeling

- **Decision**: For each returned PR, derive `involvementRole`: `owner` if `normalize(authorGithubLogin) === actorLogin`, else `involved`. Prefer computing on the server in the response DTO for a single source of truth; client may re-derive identically for display.
- **Rationale**: Matches Assumptions (owner = author; involved = comment and/or review without authorship). Author+commenter stays `owner` while still counting their comments/reviews on cards.
- **Alternatives considered**:
  - Three-way role (author / commenter / reviewer) (rejected: spec asks owner vs involved only).

## Decision 4: Data availability caveat for involved PRs

- **Decision**: Document that involved (non-authored) PRs appear only when those PRs were imported because another collaborator’s author-based import (018) persisted them (with nested comments/reviews). My Activity does not invent PRs that were never imported.
- **Rationale**: Import selection is author-centric; commenting/reviewing alone does not trigger import of a PR. Product honesty avoids false empty-state interpretation.
- **Alternatives considered**:
  - Expand import to collector-as-reviewer (rejected: out of scope for 020; belongs to a future import feature).

## Decision 5: Reuse chart stack and date helpers

- **Decision**: Reuse existing `@mui/x-charts` `BarChart`, `defaultLast60DayRange()` from `packages/web/src/utils/dateRange.ts`, `isValidDateRange`, and week labeling helpers (`isoWeekLabel` / same UTC week approach as 016). No new chart dependency.
- **Rationale**: Constitution VIII + existing 016 patterns; SC default period matches analytics.
- **Alternatives considered**:
  - New chart library (rejected: unnecessary divergence).
  - Daily buckets (rejected: noisier for 60-day default; weekly matches product precedent).

## Decision 6: Navigation and route placement

- **Decision**: Authenticated collaborator route `/app/my-pull-requests` under `ProtectedRoute` / `AppShellLayout` (not Leader/Admin-only). Add menu entry to `BASE_SHELL_MENU_OPTIONS` in `shellOptions.ts` with i18n key `menu.myPullRequests`.
- **Rationale**: Spec US1 — all signed-in users; self-only screen.
- **Alternatives considered**:
  - Leader-section placement (rejected: not leader-scoped).
  - Profile sub-page only (rejected: primary navigation requested).

## Decision 7: UI composition (filters, summaries, table, modal)

- **Decision**: Single page `MyPullRequestsPage` with: filter Paper (start/end dates + repository select), summary row (authored weekly `BarChart` + two metric Cards), MUI `Table` (repository, PR date/`mergedAt`, role), row-click `Dialog` modal for full PR detail (patterned after `TeamDeliverableReviewModal`). Optional `TablePagination` when lists are large.
- **Rationale**: Matches FR-001–FR-010 and existing deliverables table/modal patterns; no `@mui/x-data-grid` in repo.
- **Alternatives considered**:
  - Resizable analytics widget grid (rejected: overkill for personal summaries).

## Decision 8: GitHub login empty state

- **Decision**: If `user.githubLogin` from `AuthProvider` is null/empty, render guidance empty state and **do not** call my-activity. If login exists but API returns `[]`, show filtered empty states with zero metrics.
- **Rationale**: FR-011 / FR-012; auth session already exposes `githubLogin`.
- **Alternatives considered**:
  - Backend-only empty handling without frontend short-circuit (acceptable fallback, but wastes a round-trip).

## Decision 9: i18n namespace

- **Decision**: Add `prActivity` namespace under `packages/web/src/locales/{en-US,pt-BR}/prActivity.json`, register in `I18N_NAMESPACES`, plus `shell.menu.myPullRequests`. No hard-coded user-visible strings on the page.
- **Rationale**: Constitution IX; keeps PR activity copy isolated from leader/admin catalogs.
- **Alternatives considered**:
  - Stuff keys into `common` only (rejected: large feature-specific surface).

## Decision 10: Testing layout

- **Decision**: Feature docs under `tests/020-user-pr-activity/`; backend Vitest under `packages/backend/tests/020-user-pr-activity/` (or `user-pr-activity/`); web Vitest under `packages/web/tests/020-user-pr-activity/`. Cover involvement query, self-only DAC, filters, summaries, table/modal, i18n key parity.
- **Rationale**: Constitution VI feature-based test organization.
- **Alternatives considered**:
  - Fold into 018 test folders (rejected: different feature number and UI scope).

## Decision 11: No schema migration

- **Decision**: No new tables or columns. Query existing `github_imported_pull_requests`, comments, and reviews entities from 018/019.
- **Rationale**: Read/query feature only; Principle III satisfied by reuse.
- **Alternatives considered**:
  - Materialized activity view (rejected: premature optimization).
