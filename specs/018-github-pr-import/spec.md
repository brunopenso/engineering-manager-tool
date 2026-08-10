# Feature Specification: GitHub Pull Request Import

**Feature Branch**: `018-github-pr-import`  
**Created**: 2026-08-10  
**Status**: Draft  
**Input**: User description: "Create a new package.json command to run the github integration manually. This github integration should For each user that have a github login, Query pull requests across all repositories of each configured GitHub organization from the previous day (create a support for specific dates for future needs) and Persist the imported data into the internal database. Pull request selection rules, comment/review storage, collection control table, and a new API endpoint that receives a list of github logins and a filter of dates to retrieve the collected data."

## User Scenarios & Testing *(mandatory, with required automated tests)*

### User Story 1 - Operator imports merged pull requests for a date range (Priority: P1)

An operator runs a documented project command to import GitHub pull request activity for every collaborator who has a GitHub login. By default the import covers the previous calendar day; the operator can also specify an explicit start and end date for backfills or reprocessing needs. The import walks each configured (enabled) GitHub organization, finds matching merged pull requests, and persists pull requests, comments, and reviews into the product database.

**Why this priority**: Without a reliable, operator-triggered import, there is no collected GitHub activity to query or analyze.

**Automated Test Requirement**: Add tests under `tests/018-github-pr-import/` covering: default previous-day range; explicit date range; only collaborators with a GitHub login are processed; only enabled organizations are queried; only PRs matching author + org + merged-date rules are persisted; comments and reviews for imported PRs are stored with required fields; users without a GitHub login are skipped without failing the overall run when other users succeed.

**Frontend Design**: Not applicable — this story has no user-facing web UI.

**Internationalization**: Not applicable — no user-visible web UI strings.

**Access Control Validation**: The import is an operator/system capability (documented project command), not an end-user self-service action. It MUST only process collaborators that already exist in the product and have a GitHub login, and MUST only query organizations that are currently enabled in GitHub integration configuration.

**Acceptance Scenarios**:

1. **Given** enabled GitHub organizations and collaborators with GitHub logins, **When** an operator runs the import command without dates, **Then** the system imports matching merged pull requests whose merged date falls on the previous calendar day (UTC) for each such collaborator and organization.
2. **Given** the same setup, **When** an operator runs the import with an explicit start and end date, **Then** only pull requests whose merged date falls within that inclusive range are imported.
3. **Given** a collaborator without a GitHub login, **When** the import runs, **Then** that collaborator is skipped and no pull request data is created for them.
4. **Given** a pull request authored by a collaborator’s GitHub login, under an enabled organization, merged in the selected range, **When** the import completes, **Then** the pull request is stored with at least: GitHub pull request ID, organization, repository, repository ID, title, body/description, PR number, files changed count, additions count, deletions count, source branch, target branch, author GitHub login, merged date, and pull request URL when available.
5. **Given** an imported pull request that has comments and reviews on GitHub, **When** the import persists that pull request, **Then** each comment and review is stored with the required fields listed in Requirements (comment and review data).
6. **Given** a pull request that fails author, organization, or merged-date selection rules, **When** the import runs, **Then** that pull request is not stored.

---

### User Story 2 - System prevents duplicate collection for the same period (Priority: P1)

Before and after collecting data for a collaborator, organization, and date range, the system records a collection-control entry so operators can see what was attempted and so a successful period is not imported again as a duplicate run.

**Why this priority**: Duplicate collection wastes quota, creates conflicting records, and makes operational history unreliable.

**Automated Test Requirement**: Add tests under `tests/018-github-pr-import/` covering: a successful collection creates a control record with required fields; a second import for the same collaborator + organization + date range that already succeeded is skipped (or reported as already collected) without duplicating pull request rows; failed collections store error details and allow a later retry; control records include collaborator ID, GitHub login, organization, start date, end date, collection status, execution timestamp, and error details when applicable.

**Frontend Design**: Not applicable — no user-facing web UI.

**Internationalization**: Not applicable — no user-visible web UI strings.

**Access Control Validation**: Collection-control records are system/operator data used by the import process. End users MUST NOT be able to mutate collection-control records through the retrieve API.

**Acceptance Scenarios**:

1. **Given** no prior successful collection for collaborator A, organization O, and date range D, **When** the import completes successfully for that combination, **Then** a control record exists with status indicating success, the execution timestamp, and no error details.
2. **Given** a successful control record already exists for A + O + D, **When** an operator runs import again for the same combination, **Then** the system does not create duplicate pull request records for that period and the control history still reflects that the period was already collected.
3. **Given** a collection attempt fails (for example external GitHub unavailable), **When** the attempt finishes, **Then** a control record stores a failed/error status and error details, and a later import for the same period MAY be retried.
4. **Given** any completed collection attempt, **When** the control record is inspected, **Then** it includes at least collaborator ID, GitHub login, organization, start date, end date, collection status, execution timestamp, and error details if any.

---

### User Story 3 - Authorized user retrieves collected pull request data (Priority: P1)

An authenticated caller uses a new API that accepts a list of GitHub logins and a date filter, and receives the previously imported pull requests (including related comments and reviews) that match those filters—subject to hierarchical visibility rules.

**Why this priority**: Persisted import data only delivers value if authorized consumers can retrieve it for analysis and management workflows.

**Automated Test Requirement**: Add tests under `tests/018-github-pr-import/` covering: filter by one or more GitHub logins; filter by date range on merged date; response includes PR fields plus nested or associated comments and reviews; empty result when nothing matches; validation errors for missing/invalid logins or dates; hierarchical allow/deny matrix (self, descendant, peer, superior); unauthenticated requests denied.

**Frontend Design**: Not applicable — this story delivers an API only; no new web screen is required in this feature.

**Internationalization**: Not applicable — no user-visible web UI strings in this feature.

**Access Control Validation**: Retrieval MUST enforce hierarchical data access control. A caller may retrieve collected data only for GitHub logins that belong to themselves or to collaborators in their recursive subordinate tree. Requests for peers, superiors, or unrelated collaborators MUST be denied (or those logins omitted with an explicit denial outcome covered by tests). Administrators MAY retrieve collected data for any requested GitHub login that exists in the product.

**Acceptance Scenarios**:

1. **Given** imported pull requests exist for several GitHub logins, **When** an authorized caller requests a subset of those logins and a date filter, **Then** the response includes only matching imported pull requests whose author login is in the allowed requested set and whose merged date falls in the filter.
2. **Given** matching pull requests have stored comments and reviews, **When** the caller retrieves them, **Then** comment and review full text and required metadata are included.
3. **Given** a leader requests a subordinate’s GitHub login, **When** the retrieve API is called, **Then** the subordinate’s matching collected data is returned.
4. **Given** a caller requests a peer’s or superior’s GitHub login, **When** the retrieve API is called, **Then** access to that login’s data is denied.
5. **Given** no imported data matches the logins and dates, **When** an authorized caller queries, **Then** the API returns an empty successful result (not an error).
6. **Given** an unauthenticated caller, **When** they call the retrieve API, **Then** the request is denied.

---

### Edge Cases

- No enabled GitHub organizations: import completes without creating pull request data and records an appropriate outcome (no silent hang).
- Collaborator has a GitHub login but authored no merged PRs in the range: control record still reflects a successful empty collection for that collaborator/organization/period.
- Partial failure mid-run (one organization fails, others succeed): successful periods are retained; failed combinations get error control records; overall command reports that some collections failed.
- Overlapping date ranges on retrieve: results include each matching PR once (no duplicated rows in the response for the same GitHub pull request ID).
- Invalid or empty GitHub login list on retrieve: request is rejected with a clear validation error.
- Invalid date filter (end before start, unparseable dates): request is rejected with a clear validation error.
- GitHub login in the retrieve request that does not map to any product collaborator: treated as no matching data for that login for authorized callers, without leaking whether the login exists outside the caller’s visibility scope beyond standard denial rules.
- Re-import after a failed control record: allowed; on success, status reflects success and pull request data for that period is present once.

## Requirements *(mandatory, with required test coverage)*

### Functional Requirements

*All functional requirements MUST be covered by automated tests under `tests/018-github-pr-import/`.*

- **FR-001**: The project MUST provide a documented root-level workspace command that operators can run to trigger the GitHub pull request import manually.
- **FR-002**: When the command is run without an explicit date range, the system MUST import data for the previous calendar day using UTC day boundaries.
- **FR-003**: The command MUST support an explicit start date and end date so operators can import (or retry) a specific inclusive date range.
- **FR-004**: The import MUST process each product collaborator that has a GitHub login and MUST skip collaborators without one.
- **FR-005**: For each such collaborator, the import MUST query pull requests across repositories belonging to each currently enabled GitHub organization configured in the product.
- **FR-006**: The import MUST persist a pull request only when all of the following are true: (a) the pull request author matches the collaborator’s GitHub login, (b) the repository belongs to an enabled configured GitHub organization, and (c) the pull request merged date falls within the selected date range.
- **FR-007**: For each imported pull request, the system MUST store at least: GitHub pull request ID, organization, repository, repository ID, title, body/description, PR number, files changed count, additions count, deletions count, source branch, target branch, author GitHub login, merged date, and pull request URL when available.
- **FR-008**: For each imported pull request, the system MUST store associated comments with at least: GitHub comment ID, pull request reference, author GitHub login, comment body (full text), created date, updated date, and URL when available.
- **FR-009**: For each imported pull request, the system MUST store associated reviews with at least: GitHub review ID, pull request reference, reviewer GitHub login, review body (full text), review state, created date, updated date, and URL when available.
- **FR-010**: The system MUST maintain a collection-control record for each import attempt scoped by collaborator, GitHub login, organization, and date range, storing at least: collaborator ID, GitHub login, organization, start date, end date, collection status, execution timestamp, and error details if any.
- **FR-011**: The system MUST prevent duplicate successful collection for the same collaborator + organization + date range combination (no duplicate persisted pull request sets for an already successfully collected period).
- **FR-012**: Failed collection attempts MUST record error details on the control record and MUST remain eligible for a later retry of the same period.
- **FR-013**: The system MUST expose an authenticated retrieve API that accepts a list of GitHub logins and a date filter and returns matching previously imported pull requests with their comments and reviews.
- **FR-014**: The retrieve API MUST filter results to pull requests whose author GitHub login is in the requested list and whose merged date falls within the provided date filter.
- **FR-015**: The retrieve API MUST enforce hierarchical visibility: callers may access only self and recursive subordinates’ collected data; peer and superior data MUST be denied; administrators MAY access any collaborator’s collected data.
- **FR-016**: Automated tests for this feature MUST live under `tests/018-github-pr-import/` and cover acceptance scenarios for import, collection control, retrieve filtering, and access control.

### Access Control Matrix *(required when data visibility is in scope)*

| Actor | Allowed Data Visibility | Explicitly Denied Visibility | Validation Notes |
|-------|--------------------------|-------------------------------|------------------|
| Individual contributor | Own collected PRs/comments/reviews (own GitHub login) | Any other collaborator’s collected data | Retrieve API tests for self allow / peer deny |
| Mid-level leader | Self + recursive subordinate tree collected data | Peers, superiors, other branches | Retrieve API tests for direct and nested subordinate allow; peer/superior deny |
| Top-level leader | Self + all descendants’ collected data | Non-descendants outside their tree | Same hierarchical rules at full-tree depth |
| Administrator | Any requested GitHub login that maps to a product collaborator | Unauthenticated access | Admin allow-all within product collaborators; unauthenticated denied |
| Unauthenticated caller | None | All retrieve and mutation of collected data | Must receive denial |

### Key Entities *(include if feature involves data)*

- **Imported Pull Request**: A merged GitHub pull request collected for a collaborator under an enabled organization, including identity, repository context, change stats, branches, author login, merged date, and URL when available.
- **Pull Request Comment**: Full-text comment associated with an imported pull request, including GitHub comment identity, author login, timestamps, and URL when available.
- **Pull Request Review**: Full-text review associated with an imported pull request, including GitHub review identity, reviewer login, review state, timestamps, and URL when available.
- **Collection Control Record**: Operational record of an import attempt for one collaborator, organization, and date range, including status, execution time, and error details when failed.
- **Enabled GitHub Organization** *(existing)*: Product configuration of organizations in scope for import; import MUST use only currently enabled entries.
- **Collaborator GitHub Login** *(existing)*: The GitHub username linked on a collaborator profile; required for a collaborator to be included in import and for retrieve matching.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Operators can trigger a full previous-day import with a single documented project command and receive a clear success or partial-failure outcome without manual database intervention.
- **SC-002**: For a successful import period, 100% of pull requests that meet the author + organization + merged-date rules are present in the product with the required pull request fields.
- **SC-003**: For imported pull requests that have comments and reviews on GitHub, 100% of those comments and reviews are stored with full text and the required metadata fields.
- **SC-004**: Re-running import for a period that already completed successfully does not create duplicate pull request records for that collaborator + organization + period (0 duplicates).
- **SC-005**: Authorized callers can retrieve collected pull requests for a given list of GitHub logins and date filter and receive only matching records, including comments and reviews, in a single request.
- **SC-006**: In access-control verification, 100% of peer and superior retrieve attempts for another collaborator’s GitHub login are denied, and 100% of self/subordinate (and administrator) allowed cases succeed as defined in the matrix.
- **SC-007**: Failed collection attempts leave inspectable error details on the control record and remain retryable until a successful collection is recorded for that period.

## Assumptions

- Date boundaries for “previous day” and explicit ranges use **UTC** calendar days unless a later clarification changes this.
- Inclusive start and end dates define the merged-date filter for both import and retrieve.
- “Configured GitHub organizations” means organizations currently **enabled** via the existing GitHub integration administration feature.
- Collaborator GitHub logins already exist on profiles (from the existing profile/GitHub settings capability); this feature does not create or edit GitHub logins.
- The import command is an **operator/system** tool (workspace command), not a new end-user web screen in this feature.
- The retrieve API is the product surface for consuming collected data; no new analytics UI is required in this feature.
- Successful empty collections (no matching PRs) still create a successful control record so the period is not endlessly re-fetched unless operators intentionally clear or override control (out of scope unless needed later).
- On retry after failure, the system upserts/replaces data for that period so the final successful state has a single coherent set of pull requests for the period (no duplicate GitHub pull request IDs).
- External GitHub credentials/connectivity required to query organizations are assumed to be available in the runtime environment when the operator runs the import; missing credentials surface as failed collection with error details.
- Hierarchical visibility for retrieve follows Principle VII of the project constitution; administrators are treated as able to retrieve any collaborator’s collected data for operational needs.
