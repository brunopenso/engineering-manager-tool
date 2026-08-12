# Feature Specification: Create Deliverable from Pull Requests

**Feature Branch**: `021-pr-deliverable-create`  
**Created**: 2026-08-11  
**Status**: Draft  
**Input**: User description: "I have a screen that list my PRs with a checkbox, the idea here is to select some PRs and enable a button to create a deliverable. When the user click in this button, show a modal with a loading and call an API in the backend that will ask for LLM to analyse the selected pull requests and retrieve the data to create a deliverable (the entity it self). Show that information in the modal for the user and ask for the confirmation. When the user clicks in confirm, create a deliverable in the database and show a link to the user to complement the information needed and when click redirect to the deliverable. Important: do not implement any LLM call. lets mock that part for now."

## User Scenarios & Testing _(mandatory, with required automated tests)_

### User Story 1 - Select pull requests and open create-deliverable flow (Priority: P1)

As a collaborator on My Pull Requests, I select one or more pull requests with checkboxes and use an enabled **Create deliverable** action to start a guided flow that turns that selection into a proposed deliverable.

**Why this priority**: Selection and entry into the create flow are the gate for the entire feature; without them, analysis and confirmation cannot happen.

**Automated Test Requirement**: Add tests under `tests/021-pr-deliverable-create/select-and-open.us1.test.md` (and matching automated test files) covering: checkboxes on PR table rows; Create deliverable disabled when none selected; enabled when at least one selected; clicking Create deliverable opens the modal in a loading state; selection is cleared or preserved consistently after cancel according to Assumptions; unauthenticated access denied.

**Frontend Design**: Extends the existing My Pull Requests table with row selection and a primary Create deliverable control. Modal and selection affordances MUST use the `frontend-design` skill with Material UI best practices (accessible checkboxes, clear disabled/enabled button states, focus management when the modal opens).

**Internationalization**: All new user-visible strings (button labels, modal titles, empty selection hints, loading copy, errors) MUST be externalized to `en-US` and `pt-BR`. Tests MUST verify both locales and key parity.

**Access Control Validation**: Only the logged-in user may select from and act on their own pull request activity list. Peers', superiors', and subordinates' PR lists MUST NOT be usable as input for this flow.

**Acceptance Scenarios**:

1. **Given** the My Pull Requests table has rows, **When** no row is checked, **Then** the Create deliverable action is disabled.
2. **Given** the user checks one or more pull request rows, **When** the selection is non-empty, **Then** Create deliverable becomes enabled.
3. **Given** at least one pull request is selected, **When** the user clicks Create deliverable, **Then** a modal opens showing a loading state while analysis is requested.
4. **Given** an unauthenticated visitor, **When** they attempt to reach the create-deliverable flow, **Then** access is denied and no analysis is started.

---

### User Story 2 - Review mocked analysis proposal and confirm or cancel (Priority: P1)

As a collaborator, after starting the flow I wait while the system analyzes my selected pull requests (mocked analysis in this release), then review the proposed deliverable fields in the same modal and either confirm creation or cancel without saving.

**Why this priority**: Reviewing the proposal before persistence is the trust and quality control step of the feature and completes the core MVP with Story 1 and Story 3.

**Automated Test Requirement**: Add tests under `tests/021-pr-deliverable-create/review-proposal.us2.test.md` covering: loading state while analysis runs; successful mocked proposal displayed with deliverable field values; Confirm and Cancel actions; cancel closes modal without creating a deliverable; analysis failure shows a recoverable error without creating a deliverable; proposal reflects the selected pull request set used for the request.

**Frontend Design**: The modal MUST transition from loading to a readable proposal summary (title, description, and other proposed deliverable attributes) with Confirm and Cancel. Errors MUST be clear and non-technical. Use the `frontend-design` skill with Material UI dialog patterns and accessible busy/loading announcements.

**Internationalization**: Proposal labels, Confirm/Cancel, loading and error messages MUST be in `en-US` and `pt-BR` catalogs with tests for key parity.

**Access Control Validation**: Analysis MUST only accept pull request identifiers that belong to the authenticated user's authorized activity. Requests that include other users' pull requests MUST be rejected.

**Acceptance Scenarios**:

1. **Given** the user started Create deliverable with a valid selection, **When** analysis is in progress, **Then** the modal shows a loading indicator and does not yet offer Confirm.
2. **Given** mocked analysis succeeds, **When** the response is shown, **Then** the modal displays the proposed deliverable information for review and offers Confirm and Cancel.
3. **Given** the proposal is visible, **When** the user clicks Cancel, **Then** the modal closes and no deliverable is created.
4. **Given** analysis fails (for example invalid selection or service error), **When** the modal updates, **Then** the user sees an error message, can dismiss the modal, and no deliverable is created.

---

### User Story 3 - Confirm creation and open the new deliverable (Priority: P1)

As a collaborator who accepts the proposal, I confirm creation so a deliverable is saved for me, then see a link to complete any remaining information and follow that link to the deliverable detail/edit experience.

**Why this priority**: Persistence and navigation to complement the record are the outcome users need; without them the flow is incomplete.

**Automated Test Requirement**: Add tests under `tests/021-pr-deliverable-create/confirm-and-open.us3.test.md` covering: Confirm creates a deliverable owned by the authenticated user with proposed field values; success state shows a link/control to continue editing; activating the link navigates to the new deliverable; Confirm while create fails shows an error and does not claim success; double-submit does not create duplicate deliverables under normal UI guards; only the owner can create via this flow.

**Frontend Design**: After successful create, the modal MUST present a clear success state with a prominent link or button to complement the deliverable information. Navigation MUST land on the existing deliverable edit/detail surface for that record. Use the `frontend-design` skill with Material UI best practices.

**Internationalization**: Success copy, complement-information CTA, and create-error messages MUST be externalized to `en-US` and `pt-BR` with locale and key-parity tests.

**Access Control Validation**: Creation always attributes ownership to the authenticated user. Users MUST NOT create deliverables for others via this flow. After creation, opening the deliverable follows existing deliverable ownership rules (owner edit access).

**Acceptance Scenarios**:

1. **Given** a visible proposal, **When** the user clicks Confirm, **Then** a deliverable is created in the system for the authenticated user using the proposed values.
2. **Given** creation succeeds, **When** the success state appears, **Then** the user sees a link (or equivalent control) inviting them to complement the deliverable information.
3. **Given** the success link is shown, **When** the user activates it, **Then** they are taken to the newly created deliverable so they can complete or adjust fields.
4. **Given** creation fails, **When** the error is shown, **Then** the user is informed, no success link is shown, and they can retry or cancel without a false success state.

---

### User Story 4 - Clear selection and empty-state behaviors (Priority: P2)

As a collaborator, I understand when Create deliverable is unavailable (no rows, no selection) and can change my selection before starting analysis so I do not accidentally propose the wrong pull request set.

**Why this priority**: Improves correctness and clarity but is secondary to the create path itself.

**Automated Test Requirement**: Add tests under `tests/021-pr-deliverable-create/selection-edge.us4.test.md` covering: empty table keeps Create deliverable disabled; toggling checkboxes updates enablement; changing selection before opening the modal changes which PRs are sent to analysis; after successful create, selection is cleared so a stale set is not reused by accident.

**Frontend Design**: Selection state MUST remain visible and consistent with button enablement. Empty filtered table MUST not imply the action is available.

**Internationalization**: Any empty-selection helper text MUST be localized in `en-US` and `pt-BR`.

**Access Control Validation**: Same self-only PR activity scope as Story 1.

**Acceptance Scenarios**:

1. **Given** no pull requests match current filters, **When** the table is empty, **Then** Create deliverable remains disabled.
2. **Given** the user selects then deselects all rows, **When** selection becomes empty, **Then** Create deliverable returns to disabled.
3. **Given** a deliverable was just created successfully from a selection, **When** the user returns to the table, **Then** the previous selection is cleared (or otherwise cannot silently reuse the prior set without an explicit new selection).

---

### Edge Cases

- User selects pull requests and filters change so some selected rows disappear from the visible table: selection for analysis MUST only include identifiers still valid for the user; stale or unauthorized IDs are rejected by the backend.
- User closes the modal during loading: no deliverable is created; a late analysis response MUST NOT open a confirm step on a closed flow unless the user still has the modal open.
- User confirms twice quickly: the system MUST create at most one deliverable for that confirmation action (idempotent UI/server guard).
- Selected pull requests have sparse metadata: mocked analysis still returns a usable proposal with required deliverable fields populated by placeholder/default values the user can edit later.
- User has no GitHub login / no PR activity: Create deliverable stays unavailable because there is nothing to select.
- Analysis or create returns authorization failure: show a user-friendly error; do not leak whether other users' PR IDs exist.

## Requirements _(mandatory, with required test coverage)_

### Functional Requirements

_All functional requirements MUST be covered by automated tests. Define the test(s) for each requirement below._

- **FR-001**: The My Pull Requests table MUST support multi-select of pull request rows via checkboxes (or equivalent accessible selection controls).
- **FR-002**: The system MUST provide a Create deliverable action that is disabled when zero pull requests are selected and enabled when one or more are selected.
- **FR-003**: Activating Create deliverable MUST open a modal that immediately shows a loading state and requests analysis of the selected pull requests from the backend.
- **FR-004**: The backend MUST expose an analysis capability that accepts the authenticated user's selected pull request identifiers and returns a proposed deliverable payload suitable for review (title, description, role in deliverable, business impact classification, personal performance improvement points, and optional fields such as technical description, system/user tags, and reference links when available).
- **FR-005**: Analysis MUST NOT call a real large language model in this release; the analysis result MUST be produced by a deterministic mock that derives a plausible proposal from the selected pull request data (for example titles, repositories, and descriptions).
- **FR-006**: After analysis succeeds, the modal MUST present the proposed deliverable information and require explicit user confirmation before any deliverable is persisted.
- **FR-007**: Canceling or dismissing the modal before successful confirmation MUST NOT create a deliverable.
- **FR-008**: Confirming the proposal MUST create a deliverable owned by the authenticated user using the proposed field values (subject to existing deliverable validation rules for required fields and allowed enumerations).
- **FR-009**: After successful creation, the modal MUST show a link or equivalent control to complement the deliverable information; activating it MUST navigate the user to the newly created deliverable's existing detail/edit experience.
- **FR-010**: The analysis and create operations MUST reject requests that reference pull requests outside the authenticated user's authorized activity set.
- **FR-011**: The create operation MUST attribute ownership solely to the authenticated user and MUST NOT allow creating a deliverable on behalf of another user.
- **FR-012**: Analysis and create failures MUST surface user-friendly errors in the modal without claiming success or navigating away.
- **FR-013**: All new user-visible web copy for this feature MUST be externalized through `en-US` and `pt-BR` translation catalogs with automated key-parity coverage.
- **FR-014**: All functional requirements in this feature MUST be covered by automated tests under `tests/021-pr-deliverable-create/`.

### Access Control Matrix _(required when data visibility is in scope)_

| Actor                          | Allowed Data Visibility / Actions                                     | Explicitly Denied Visibility / Actions                          | Validation Notes                                   |
| ------------------------------ | --------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------- |
| Individual collaborator (self) | Select own PR activity; run analysis; create own deliverable; open it | Other users' PRs as analysis input; create for others           | Self-only selection + owner create tests           |
| Peer                           | Own PR flow only                                                      | Another peer's PRs or deliverables via this flow                | Cross-user PR ID rejection                         |
| Superior                       | Own PR flow only (this feature)                                       | Subordinate PRs as input to this personal create flow           | Leaders use other features for team coaching views |
| Subordinate                    | Own PR flow only                                                      | Superior PR activity                                            | Upward access denied                               |
| Unauthenticated user           | None                                                                  | Analysis, create, navigation into protected deliverable screens | Route/API denial                                   |

### Key Entities

- **Pull request selection**: The set of imported pull request records the user marks on My Pull Requests to drive analysis; each item is identified by a stable pull request record identifier already available to the user.
- **Deliverable proposal**: A non-persisted preview of deliverable fields produced by mocked analysis of the selected pull requests, shown for confirmation before save.
- **Deliverable** (existing): Persisted collaborator-owned work record created on confirmation; required and optional attributes follow the existing deliverable model (title, description, role in deliverable, system tags, business impact, personal performance improvement points, optional technical description, user tags, reference links).
- **Create-deliverable session (UI)**: Modal lifecycle covering loading → proposal review → confirm/cancel → success with complement link; not a separate persisted entity.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A collaborator can go from selecting pull requests to confirming a proposed deliverable and reaching the new deliverable screen in under 2 minutes in normal use (excluding intentional long review of the proposal text).
- **SC-002**: 100% of automated tests show Create deliverable remains disabled with an empty selection and becomes enabled with a non-empty selection.
- **SC-003**: 100% of analysis responses in this release are produced without a live LLM call (verified by tests that exercise the mock analysis path and assert proposal shape).
- **SC-004**: 100% of cancel-before-confirm paths create zero deliverables; 100% of successful confirm paths create exactly one deliverable owned by the acting user in automated tests.
- **SC-005**: After successful create, 100% of success-state navigation tests land on the newly created deliverable so the user can complement information.
- **SC-006**: 100% of attempts to analyze or create using another user's pull request identifiers are denied in automated authorization tests.
- **SC-007**: New UI strings for the flow have matching `en-US` and `pt-BR` keys with parity verified in automated tests.

## Assumptions

- This feature extends the existing My Pull Requests screen (feature 020); it does not introduce a separate PR listing page.
- Users may select any pull requests shown in their activity table (authored or involved); the mock analyzer uses the selected set as input regardless of owner vs involved role.
- Real LLM integration is explicitly out of scope for this release; a backend mock returns deterministic proposed field values derived from selected PR metadata so the UX and persistence path can ship first.
- The mock proposal always supplies values that satisfy existing deliverable required-field validation (using sensible defaults/placeholders when PR metadata is thin), so confirmation can create a valid record; the user then complements richer detail on the deliverable screen.
- System tag suggestions in the mock may be empty or limited to tags the user is allowed to assign; if no valid system tags can be suggested, the mock uses a documented default strategy agreed at planning time that still satisfies create validation (for example a known catalog tag available in fixtures/tests).
- Persisting an explicit many-to-many link between the new deliverable and the source pull requests is out of scope for this release unless needed for validation; selected PRs are analysis input only. Optional reference links in the proposal may include URLs of the selected PRs when available.
- Deliverable create/edit screens and hierarchical read rules from feature 006 remain unchanged except for navigation into the newly created record from this flow.
- Hierarchical DAC for this feature focuses on self-only PR input and owner-only create; superiors do not create deliverables for subordinates through this modal in v1.
- Minimum selection size is one pull request; there is no maximum beyond practical UI limits for this release.
- Closing the browser during loading cancels the user-facing flow; any orphaned analysis work has no user-visible side effect because analysis does not persist a deliverable.
