# Research: GitHub Pull Request Import

**Feature**: `018-github-pr-import`  
**Date**: 2026-08-10

## 1. GitHub API client and authentication

**Decision**: Add `@octokit/rest` as a backend dependency and authenticate with a server-side `GITHUB_TOKEN` environment variable (classic or fine-grained PAT / installation token with read access to org repos, PRs, and comments).

**Rationale**: No first-party GitHub client exists today (only transitive Lerna Octokit). `@octokit/rest` is the standard REST client, actively maintained, and fits TypeScript + Node 26. Env-based secrets match constitution Principle II and existing dotenv patterns.

**Alternatives considered**:
- Raw `fetch` against GitHub REST: more boilerplate for pagination/rate limits; rejected for maintainability.
- GitHub App installation auth: better for production multi-org later, but heavier setup; deferred — PAT/`GITHUB_TOKEN` is enough for manual operator import v1.
- GraphQL-only client: powerful search, but REST Search + PR detail endpoints are sufficient and simpler to mock in tests.

## 2. Pull request discovery strategy

**Decision**: For each (collaborator `githubLogin`, enabled organization), use GitHub Search Issues/PRs with a query equivalent to:

`is:pr is:merged author:{login} org:{organization} merged:{start}..{end}`

Then hydrate each hit with PR detail (stats, branches, URL) plus conversation comments and reviews. Date range uses inclusive UTC calendar days mapped to GitHub `merged:` date qualifiers.

**Rationale**: Search scopes by author + org + merged window in one query, matching FR-006 without listing every repository first. Hydration ensures required fields (additions/deletions/files, branches, body) are complete.

**Alternatives considered**:
- List all org repos then list PRs per repo filtered by author: correct but slower and more API calls for large orgs.
- Events API / timeline: not suited to historical merged-date ranges.

## 3. Comment vs review scope

**Decision**: Persist **issue comments** on the pull request (conversation thread) as comments, and **pull request reviews** as reviews. Inline review comments (diff line comments) are out of scope for v1 unless trivially bundled later; they are not required by the listed review fields.

**Rationale**: Spec separates “comment” and “review” entities with distinct IDs and states; conversation comments + reviews cover management-useful text without expanding scope to every review comment thread.

**Alternatives considered**:
- Store inline review comments as comments: useful later; deferred to keep v1 aligned to stated fields.
- Reviews only: would fail FR-008.

## 4. Collection-control uniqueness and retry

**Decision**: One control row per `(collaborator_id, organization, start_date, end_date)` with unique constraint. Status values: `success` | `failed` (and optionally `skipped` if already success when re-run). On success, skip re-fetch. On failed, allow retry that upserts PR data by GitHub PR ID and updates the control row to `success`.

**Rationale**: Matches FR-010–FR-012: inspectable history, no duplicate successful collections, retry after failure with a single coherent PR set (unique on GitHub PR ID).

**Alternatives considered**:
- Append-only control log without unique business key: harder to prevent duplicates; rejected.
- Soft-delete prior PRs on every run: unnecessary when success skip is the default.

## 5. Operator CLI / npm script shape

**Decision**: Implement `packages/backend/scripts/github-import-prs.ts` run via `tsx`, expose:

- Backend: `npm run github:import-prs --workspace @em-tool/backend -- [--start YYYY-MM-DD] [--end YYYY-MM-DD]`
- Root: `npm run github:import-prs -- [--start ...] [--end ...]` delegating to the backend workspace

Default when dates omitted: previous UTC calendar day for both start and end.

**Rationale**: Matches existing `tsx scripts/*` migration/seed pattern and FR-001 root-level workspace command expectation.

**Alternatives considered**:
- HTTP admin trigger endpoint: useful later; out of scope (spec asks for package.json/manual command).
- Separate worker package: overkill for monorepo size.

## 6. Retrieve API shape and authorization

**Decision**: `POST /github-pull-requests/query` with body `{ githubLogins: string[], startDate: string, endDate: string }` returning `{ pullRequests: [...] }` including nested `comments` and `reviews`. Require bearer app token. Resolve each login to a product user; apply visibility: self or recursive subordinate (`assertCanReadDeliverables`-style / subtree helpers); administrators may query any mapped collaborator; deny peer/superior. Unmapped or invisible logins contribute no rows (and denied logins must not leak data — tests cover explicit deny outcomes).

**Rationale**: POST fits multi-login lists; kebab-case resource naming matches `/github-integrations`. Reusing hierarchy helpers preserves Principle VII; admin allow-all matches the spec matrix (stronger than deliverables-only self+descendant for admins).

**Alternatives considered**:
- GET with comma-separated logins: awkward for many logins; rejected.
- Admin-only retrieve: contradicts collaborator/leader self+subordinate scenarios in the spec.

## 7. Author login matching

**Decision**: Compare GitHub author login to `users.github_login` using case-insensitive equality for import matching and retrieve filters (normalize to lowercase for comparison; store author login as returned by GitHub).

**Rationale**: Profile validation does not force lowercase on `githubLogin`, while org names are lowercased; GitHub logins are case-insensitive. Case-insensitive match avoids missed imports.

**Alternatives considered**:
- Exact case-sensitive match: fragile; rejected.

## 8. Testing strategy for GitHub I/O

**Decision**: Abstract Octokit behind `githubApiClient` with an injectable interface; unit/integration tests mock the client. No live GitHub calls in CI.

**Rationale**: Stable, offline tests; aligns with existing auth-mocked test patterns.

**Alternatives considered**:
- Recorded HTTP fixtures / nock: acceptable later; interface mock is simpler for v1.
