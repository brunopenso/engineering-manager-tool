# Feature Specification: GitHub Pull Request Natural Key

**Feature Branch**: `019-github-pr-natural-key`  
**Created**: 2026-08-10  
**Status**: Draft  
**Input**: User description: "the github pullrquest feature is based on user we need to change it to be based on the natural key of the pull request, i mean, repository id and pull request id."

## Clarifications

### Session 2026-08-10

- Q: Must existing imported rows be reconciled to one record per natural key? → A: No — tables are empty; apply schema changes only as needed (no data reconciliation/cutover).
- Q: How should collection-control uniqueness be scoped? → A: Based on pull request uniqueness (same natural key as the imported PR: repository id + pull request id), not collaborator + organization + date range.
- Q: When a successful collection-control already exists for a PR natural key, should later imports skip that PR? → A: No — always refresh PR data on every import hit; collection-control is audit/history only (no skip).

## User Scenarios & Testing _(mandatory, with required automated tests)_

### User Story 1 - Imported pull requests are identified by repository and pull request id (Priority: P1)

Operators and downstream consumers treat each imported GitHub pull request as a single durable record identified by its natural key: GitHub **repository id** plus GitHub **pull request id**. The same merged pull request MUST NOT appear as multiple product records when import runs for different collaborators, retries the same period, or reprocesses overlapping date ranges.

**Why this priority**: Today imported pull requests are effectively anchored to a collaborator (user). That makes identity fragile—duplicates, conflicting ownership, and unstable upserts when the same GitHub PR is encountered again. A PR-native natural key is the foundation for correct storage and retrieval.

**Automated Test Requirement**: Add tests under `tests/019-github-pr-natural-key/` covering: persist uses natural key `(repositoryId, githubPullRequestId)`; re-import of the same PR updates the existing record instead of inserting a second row; two import paths that discover the same PR (for example overlapping date runs or author remapping) still yield exactly one stored pull request for that natural key; required PR fields remain populated after upsert.

**Frontend Design**: Not applicable — no user-facing web UI in this feature.

**Internationalization**: Not applicable — no user-visible web UI strings.

**Access Control Validation**: This story changes identity of stored pull request records, not who may retrieve them. Hierarchical retrieve rules from the existing GitHub PR import capability remain in force (self + recursive subordinates; deny peers/superiors; administrators may access any collaborator-mapped collected data).

**Acceptance Scenarios**:

1. **Given** a merged pull request with repository id R and pull request id P has never been imported, **When** import persists it, **Then** exactly one imported pull request exists whose natural key is (R, P).
2. **Given** an imported pull request already exists for (R, P), **When** import encounters the same pull request again, **Then** the existing record is updated in place and no second row is created for (R, P).
3. **Given** the same GitHub pull request would previously have been associated through different collaborator-centric processing paths, **When** import completes, **Then** the product still holds a single record for (R, P).
4. **Given** an upsert for (R, P), **When** GitHub field values differ from the stored copy (for example title or counts), **Then** the stored record reflects the latest imported values while retaining the same natural key.

---

### User Story 2 - Collaborator is association context, not pull request identity (Priority: P1)

Import may still discover pull requests by walking collaborators who have a GitHub login, but the stored pull request’s identity MUST NOT depend on which collaborator triggered the import. Author GitHub login (and any derived collaborator association used for visibility) is metadata for filtering and access control—not part of the unique identity of the pull request.

**Why this priority**: Separating discovery (user-driven import) from identity (PR natural key) prevents user changes, reassignment, or re-import order from splintering one GitHub PR into many product records.

**Automated Test Requirement**: Add tests under `tests/019-github-pr-natural-key/` covering: uniqueness is enforced on `(repositoryId, githubPullRequestId)` and is not scoped by collaborator; changing or clearing collaborator association fields does not create a new PR row for the same (R, P); retrieve-by-author-login still returns the PR when author login matches; DAC allow/deny based on author-to-collaborator mapping still holds.

**Frontend Design**: Not applicable — no user-facing web UI.

**Internationalization**: Not applicable — no user-visible web UI strings.

**Access Control Validation**: Retrieve visibility continues to use the author GitHub login mapped to product collaborators under hierarchical DAC. Identity change MUST NOT weaken deny rules for peers and superiors.

**Acceptance Scenarios**:

1. **Given** pull request (R, P) authored by GitHub login L, **When** it is imported during collaborator C’s import pass, **Then** the record is keyed by (R, P) and author login L is stored as an attribute (not as the uniqueness basis).
2. **Given** (R, P) already exists, **When** a later import pass for the same or another processing path re-persists (R, P), **Then** uniqueness remains on (R, P) regardless of which collaborator context ran the import.
3. **Given** an authorized caller requests collected data for login L, **When** retrieve runs, **Then** pull requests authored by L are returned using hierarchical visibility rules, without requiring the pull request’s identity to be the collaborator’s user id.
4. **Given** a peer or superior requests another collaborator’s login, **When** retrieve runs, **Then** access remains denied as in the existing import feature’s access matrix.

---

### User Story 3 - Collection control audits each pull request by natural key (Priority: P1)

When import collects a pull request, the system records or updates a collection-control entry keyed by that pull request’s natural key `(repositoryId, githubPullRequestId)`. Collection control is for audit and operational history only: a prior successful control MUST NOT cause the import to skip refreshing that pull request. Every import hit for (R, P) MUST refresh the stored pull request (and nested comments/reviews) via natural-key upsert, and MUST update the control record’s latest status, execution timestamp, and error details when applicable. Collection control is not unique by collaborator, organization, or date range.

**Why this priority**: With PR-native identity, operators still need inspectable per-PR collection outcomes, without blocking refreshes when the same PR is encountered again.

**Automated Test Requirement**: Add tests under `tests/019-github-pr-natural-key/` covering: control is unique on `(repositoryId, githubPullRequestId)`; a later import that hits the same PR refreshes PR data and updates control (does not skip); failed control records error details and a later import still attempts refresh; control records are not unique on collaborator + organization + date range.

**Frontend Design**: Not applicable — no user-facing web UI.

**Internationalization**: Not applicable — no user-visible web UI strings.

**Access Control Validation**: Collection-control records remain system/operator operational data. End users MUST NOT mutate collection-control records through the retrieve API. Retrieve DAC for pull request payloads is unchanged.

**Acceptance Scenarios**:

1. **Given** no collection-control record for pull request (R, P), **When** import successfully persists that pull request, **Then** a control record exists for (R, P) with success status and execution timestamp.
2. **Given** a successful control record already exists for (R, P), **When** import encounters the same pull request again, **Then** the system refreshes the stored pull request data for (R, P) (upsert, no second PR row) and updates the control record’s audit fields; it does not skip the refresh because of the prior success.
3. **Given** a collection attempt for (R, P) fails, **When** the attempt finishes, **Then** the control record for (R, P) stores failed/error status and error details, and a later import that hits (R, P) still attempts to refresh.
4. **Given** any collection-control record, **When** inspected, **Then** its uniqueness basis is the pull request natural key (R, P), not collaborator + organization + date range.

---

### User Story 4 - Related comments and reviews stay attached to the natural-keyed pull request (Priority: P2)

Comments and reviews imported for a pull request remain attached to the single natural-keyed pull request record. Re-import MUST NOT orphan or duplicate comment/review sets under a second pull request row for the same (repository id, pull request id).

**Why this priority**: Nested activity is only trustworthy if the parent PR identity is stable.

**Automated Test Requirement**: Add tests under `tests/019-github-pr-natural-key/` covering: comments/reviews link to the single PR for (R, P); re-import upserts nested items without creating a duplicate parent; retrieve returns nested comments/reviews for that one parent.

**Frontend Design**: Not applicable — no user-facing web UI.

**Internationalization**: Not applicable — no user-visible web UI strings.

**Access Control Validation**: Nested comment/review payloads follow the parent pull request’s retrieve visibility; no additional lateral access is introduced.

**Acceptance Scenarios**:

1. **Given** (R, P) is imported with comments and reviews, **When** a caller retrieves that pull request, **Then** the nested comments and reviews are returned with the parent.
2. **Given** (R, P) already has nested items, **When** import runs again for the same pull request, **Then** nested items are upserted against the same parent and a second parent for (R, P) is not created.
3. **Given** no nested items exist on GitHub for (R, P), **When** import persists the pull request, **Then** the parent exists with an empty comment/review set.

---

### Edge Cases

- Missing repository id or pull request id from the source payload: the pull request MUST NOT be persisted; the import records a failure or skip for that item with a clear reason (no silent write of an incomplete natural key).
- Repository id and pull request id present but other fields incomplete: persistence may still proceed only if the natural key and minimum required PR fields from the existing import feature are satisfied; otherwise fail that item.
- Re-import after author GitHub login changes on GitHub for the same (R, P): update author attribute on the existing record; do not create a second identity.
- Collection-control uniqueness follows the pull request natural key `(repositoryId, githubPullRequestId)`. Collaborator, organization, and date range MUST NOT define collection-control uniqueness (they may remain informational on import runs or elsewhere, but not the control unique key).
- Prior successful collection-control for (R, P) MUST NOT skip a later import hit: refresh always; control is audit/history only.
- Target tables are empty: deliver schema/identity changes only—no requirement to merge, deduplicate, or otherwise reconcile historical imported rows.
- Retrieve with overlapping filters: response includes each matching pull request once per natural key (no duplicate parents for the same (R, P)).

## Requirements _(mandatory, with required test coverage)_

### Functional Requirements

_All functional requirements MUST be covered by automated tests under `tests/019-github-pr-natural-key/`._

- **FR-001**: Each imported pull request MUST be uniquely identified by the natural key composed of GitHub repository id and GitHub pull request id.
- **FR-002**: The system MUST enforce uniqueness of imported pull requests on that natural key so that at most one stored pull request exists per `(repositoryId, githubPullRequestId)`.
- **FR-003**: Import persistence MUST upsert by natural key: matching `(repositoryId, githubPullRequestId)` updates the existing record; absence inserts a new record.
- **FR-004**: Collaborator (product user) MUST NOT be part of the imported pull request’s unique identity. Collaborator context MAY be used to discover whose GitHub activity to query and to support hierarchical visibility, but MUST NOT define whether two imports refer to the same pull request.
- **FR-005**: Author GitHub login MUST remain stored on the imported pull request as an attribute used for filtering and access-control mapping.
- **FR-006**: Import MUST refuse to persist a pull request when repository id or pull request id is missing or blank.
- **FR-007**: Comments and reviews MUST remain associated with the single natural-keyed parent pull request; re-import MUST NOT create a second parent for the same natural key.
- **FR-008**: Retrieve behavior MUST continue to filter by requested GitHub logins and date range and MUST return each matching pull request at most once per natural key, including nested comments and reviews.
- **FR-009**: Retrieve MUST continue to enforce hierarchical data access control (self + recursive subordinates allowed; peers and superiors denied; administrators may access any collaborator-mapped collected data; unauthenticated denied).
- **FR-010**: Collection-control records MUST be uniquely keyed by the same pull request natural key `(repositoryId, githubPullRequestId)`, not by collaborator + organization + date range.
- **FR-011**: Collection-control MUST be audit/history only: a prior successful (or failed) control record MUST NOT cause import to skip refreshing a pull request when that pull request is hit again.
- **FR-012**: Every import hit for a pull request natural key MUST refresh stored pull request data (and nested comments/reviews) via natural-key upsert and MUST update the corresponding collection-control record’s latest status, execution timestamp, and error details when applicable.
- **FR-013**: Failed collection attempts for a pull request natural key MUST record error details on the control record; a later import that hits the same natural key MUST still attempt refresh.
- **FR-014**: Because imported pull request and collection-control tables are empty, this feature MUST deliver required schema/identity changes only and MUST NOT require historical data reconciliation or duplicate-row cutover.
- **FR-015**: Automated tests for this feature MUST live under `tests/019-github-pr-natural-key/` and cover natural-key uniqueness, always-refresh upsert behavior, non-user identity, PR-keyed audit collection control (no skip), nested attachment stability, retrieve deduplication, and DAC allow/deny.

### Access Control Matrix _(required when data visibility is in scope)_

| Actor                  | Allowed Data Visibility                                        | Explicitly Denied Visibility            | Validation Notes                                              |
| ---------------------- | -------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------- |
| Individual contributor | Own collected PRs (author login maps to self)                  | Any other collaborator’s collected data | Retrieve tests: self allow / peer deny                        |
| Mid-level leader       | Self + recursive subordinate tree collected data               | Peers, superiors, other branches        | Direct and nested subordinate allow; peer/superior deny       |
| Top-level leader       | Self + all descendants’ collected data                         | Non-descendants outside their tree      | Same hierarchical rules at full-tree depth                    |
| Administrator          | Any requested GitHub login that maps to a product collaborator | Unauthenticated access                 | Admin allow-all within product collaborators; unauthenticated denied |
| Unauthenticated caller | None                                                           | All retrieve of collected PR data       | Must receive denial                                           |

### Key Entities _(include if feature involves data)_

- **Imported Pull Request**: A merged GitHub pull request stored once under natural key `(repositoryId, githubPullRequestId)`, with author login and other PR attributes as non-identity fields.
- **Pull Request Comment**: Full-text comment attached to the natural-keyed imported pull request.
- **Pull Request Review**: Full-text review attached to the natural-keyed imported pull request.
- **Collection Control Record**: Audit/history record for collection outcomes of one pull request natural key `(repositoryId, githubPullRequestId)`, including latest status, execution time, and error details when failed. Uniqueness follows the pull request, not collaborator/organization/date range. Does not gate or skip refreshes.
- **Collaborator GitHub Login** _(existing)_: Used for import discovery and retrieve/DAC mapping; not part of pull request or collection-control uniqueness.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: For any repository id R and pull request id P, the product holds at most one imported pull request record (0 duplicates) after any sequence of imports and retries.
- **SC-002**: Re-importing an already stored pull request updates the existing record in 100% of successful upsert cases and creates 0 additional rows for that natural key.
- **SC-003**: 100% of pull requests persisted without both repository id and pull request id are rejected (not stored).
- **SC-004**: Authorized retrieve requests return each matching pull request at most once per natural key, with nested comments and reviews attached to that single parent.
- **SC-005**: In access-control verification, 100% of peer and superior retrieve attempts remain denied, and 100% of self/subordinate (and administrator) allowed cases succeed as defined in the matrix.
- **SC-006**: Collection-control uniqueness is enforced on `(repositoryId, githubPullRequestId)` with at most one control record per natural key, updated on each import hit for audit/history.
- **SC-007**: When import hits a pull request that already has a successful control record, 100% of those hits still refresh pull request data (0 skips caused by prior success) and still produce 0 duplicate pull request rows for that natural key.
- **SC-008**: Failed collection for a natural key leaves inspectable error details on the control record, and a later hit still attempts refresh.
- **SC-009**: Delivery requires no historical row reconciliation (empty tables); schema/identity changes alone are sufficient for the uniqueness model.

## Assumptions

- This feature changes the identity model of the existing GitHub pull request import capability (`018-github-pr-import`); it does not replace the operator import command, date-range behavior for *searching* GitHub, or retrieve API’s login + date filters.
- “Pull request id” means the GitHub pull request identifier already collected as the pull request’s GitHub id (not the per-repository PR number alone). The natural key is the pair with repository id.
- Collection-control uniqueness matches pull request uniqueness: `(repositoryId, githubPullRequestId)`.
- Collection-control is audit/history only; import always refreshes on hit and never skips because a prior control status was successful.
- Date ranges remain an import *query* parameter for finding merged PRs on GitHub; they are not the uniqueness key for collection-control records.
- Author-based hierarchical visibility remains the retrieve authorization model; removing collaborator from PR and collection-control identity does not remove DAC.
- No new end-user web screens are in scope.
- Imported pull request and collection-control tables are empty in target environments; only schema changes are needed—no data backfill or duplicate merge.
