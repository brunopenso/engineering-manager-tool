# Feature Specification: Hierarchy Subtree and Itself Selection

**Feature Branch**: `023-subtree-itself-select`  
**Created**: 2026-08-12  
**Status**: Draft  
**Input**: User description: "we need to change one behaviour across the application. When selecting users in the combobox we are showing the hierarchy and it is correct. But when we need to see a entire team i can't select more than one level. So the idea here is when selecting a top level name I want to see the entire structure below it. But when I want to see the select person we need to create a new option called 'itself'."

## User Scenarios & Testing _(mandatory, with required automated tests)_

### User Story 1 - Select a person to include their full team subtree (Priority: P1)

As a leader, when I choose a person who has reports in the shared hierarchy team-member picker, the application scopes results to that person **and everyone below them in the hierarchy** (all levels), so I can review an entire team with one selection instead of being limited to a single person.

**Why this priority**: This is the core behavior change—leaders cannot currently view multi-level teams through the picker and must pick individuals one at a time.

**Automated Test Requirement**: Add tests under `tests/023-subtree-itself-select/` covering: selecting a mid- or top-level report includes that person plus all direct and indirect descendants in the resulting data scope; selecting a leaf (no reports) includes only that person; behavior is consistent across every screen that uses the shared hierarchy team-member picker (team deliverables, team analytics, and team PR performance).

**Frontend Design**: Implementation MUST use the `frontend-design` skill with Material UI best practices for the shared hierarchy picker and any scope indicator in the filter bar. The existing hierarchy display in the combobox MUST remain; only the meaning of a selection changes for people with reports.

**Internationalization**: All new or changed user-visible strings (including the "Itself" option label and any scope/hint copy) MUST be externalized to `en-US` and `pt-BR` translation catalogs via the established i18n configuration. Tests MUST verify both locales and key parity.

**Access Control Validation**: Subtree scope MUST never expand beyond the logged-in leader’s authorized reporting subtree. Selecting a subordinate with reports includes only that subordinate’s descendants that are already visible to the actor. Peers, superiors, and other branches remain denied.

**Acceptance Scenarios**:

1. **Given** a logged-in leader whose report Alice has reports Bob and Carol (Carol has Dave), **When** the leader selects Alice in the hierarchy picker (not "Itself"), **Then** the screen’s data scope includes Alice, Bob, Carol, and Dave.
2. **Given** a logged-in leader with a leaf report Eve who has no reports, **When** the leader selects Eve, **Then** the data scope includes only Eve.
3. **Given** the same Alice hierarchy on Team Deliverables, Team Analytics, and Team PR Performance, **When** the leader selects Alice (subtree mode) on each screen, **Then** each screen applies the same Alice-plus-descendants scope rules for its own data.

---

### User Story 2 - "Itself" option to scope to only the selected person (Priority: P1)

As a leader, when I want data for only one person who also has a team below them, I can choose a new **"Itself"** option for that person so the scope is limited to that individual and does not include their reports.

**Why this priority**: Without "Itself", leaders would lose the ability to inspect a single manager/lead’s own activity once default selection includes the full subtree.

**Automated Test Requirement**: Add tests under `tests/023-subtree-itself-select/` covering: "Itself" is available for people who have at least one report; choosing "Itself" for Alice includes only Alice; "Itself" is not required (and may be omitted) for leaf people; the selected value clearly distinguishes subtree vs itself in the UI and in subsequent searches/refreshes.

**Frontend Design**: The "Itself" choice MUST be discoverable next to or under the person in the hierarchy picker without breaking the existing expand/collapse hierarchy browsing. Selected state MUST make it obvious whether the current scope is the person’s team (subtree) or "Itself".

**Internationalization**: The label **"Itself"** (and equivalent Portuguese copy) MUST come from i18n catalogs (`en-US` and `pt-BR`) with key parity verified in tests.

**Access Control Validation**: "Itself" still requires the selected person to be within the actor’s authorized subtree. It MUST NOT grant visibility to peers, superiors, or other branches.

**Acceptance Scenarios**:

1. **Given** Alice has reports, **When** the leader opens the hierarchy picker on Alice’s row, **Then** an "Itself" option is available for Alice in addition to selecting Alice’s full team.
2. **Given** Alice has reports Bob and Carol, **When** the leader chooses Alice’s "Itself" option, **Then** the data scope includes only Alice.
3. **Given** Eve has no reports, **When** the leader opens the picker on Eve, **Then** selecting Eve scopes to Eve only (no separate "Itself" choice is required).
4. **Given** a leader previously selected Alice’s subtree, **When** they switch to Alice’s "Itself", **Then** results refresh to Alice-only data and the picker shows the Itself scope as selected.

---

### User Story 3 - Clear scope feedback and empty subtree results (Priority: P2)

As a leader, I can tell whether my current selection is a full team or only the person, and I get a clear empty state when the chosen scope has no matching data in the active filters (for example date range).

**Why this priority**: Correct scoping is useless if leaders cannot tell what they selected or confuse “no data” with a wrong person.

**Independent Test**: Add tests under `tests/023-subtree-itself-select/` validating displayed selection label/scope indicator for subtree vs Itself, and empty-state messaging when the scoped set has no matching records.

**Frontend Design**: Selection display in the closed picker MUST reflect person name plus whether scope is team (subtree) or Itself, using Material UI patterns consistent with the existing filter bar.

**Internationalization**: Scope indicator and empty-state strings MUST be externalized to `en-US` and `pt-BR` with locale and key-parity tests.

**Access Control Validation**: Empty states MUST NOT leak existence of people or records outside the authorized scope.

**Acceptance Scenarios**:

1. **Given** Alice’s subtree is selected, **When** the leader looks at the closed picker, **Then** the selection presentation indicates Alice’s team/subtree scope (not only the bare name with no distinction from Itself).
2. **Given** Alice’s "Itself" is selected, **When** the leader looks at the closed picker, **Then** the selection presentation indicates Alice with Itself scope.
3. **Given** a valid subtree or Itself selection with no matching data for the current filters, **When** results load, **Then** an empty state explains that nothing matches the current scope and filters (without implying authorization failure).

---

### Edge Cases

- Person with reports but all descendants inactive/unavailable in the actor’s view: subtree selection still includes the selected person and any remaining visible descendants; if only the person is visible, results behave like a one-person scope.
- Switching from subtree to Itself (or the reverse) for the same person MUST refresh data for the new scope without requiring a full page reload.
- Clearing the team-member selection (where a screen allows clear / “all my team”) MUST restore that screen’s existing “no person filter / full authorized team” behavior and MUST NOT leave a stale Itself/subtree mode applied.
- Deep hierarchies (many levels): selecting a top-level name includes **all** levels below, not only direct reports.
- Unauthorized or out-of-subtree person id / Itself request: denied with no data returned.
- Screens that previously required a single person before searching (for example Team Deliverables) MUST support searching when a subtree scope is selected, returning combined results for everyone in that scope subject to existing screen filters.

## Requirements _(mandatory, with required test coverage)_

### Functional Requirements

_All functional requirements MUST be covered by automated tests. Define the test(s) for each requirement below._

_For features that expose collaborator or organizational data, requirements MUST define a hierarchical DAC matrix that allows only self + descendants (recursive) and denies peer/superior visibility for every API endpoint, report, and visualization in scope._

- **FR-001**: Across every screen that uses the shared hierarchy team-member picker, selecting a person who has reports MUST set the data scope to that person plus all of their direct and indirect reports (full subtree), not only the selected person. _Tests: `tests/023-subtree-itself-select/` subtree selection on each affected screen._
- **FR-002**: The hierarchy picker MUST provide an **"Itself"** option for each selectable person who has at least one report, which sets the data scope to that person only. _Tests: picker UI + scope application._
- **FR-003**: Selecting a person with no reports MUST set the data scope to that person only; a separate "Itself" option is not required for leaf people. _Tests: leaf selection._
- **FR-004**: The closed picker (and any explicit scope indicator) MUST make the active mode visible: subtree (person + team below) versus Itself (person only). _Tests: UI selection display._
- **FR-005**: Changing between subtree and Itself for the same person, or changing to another person/scope, MUST re-run the screen’s existing search/load behavior with the new scope. _Tests: selection change refresh._
- **FR-006**: Subtree and Itself scopes MUST be honored by each consuming screen’s existing filters (for example date range) and empty-state rules. _Tests: filtered empty and non-empty results._
- **FR-007**: Authorization MUST continue to allow only people inside the logged-in leader’s reporting subtree; subtree expansion MUST NOT include peers, superiors, or other branches. Out-of-scope requests MUST be denied. _Tests: access-control matrix._
- **FR-008**: All new user-visible strings related to this behavior (including "Itself" and scope labels) MUST be provided in `en-US` and `pt-BR` with key parity. _Tests: locale/key parity._
- **FR-009**: Behavior MUST be consistent for all current consumers of the shared hierarchy team-member picker (Team Deliverables, Team Analytics, Team PR Performance) so leaders learn one selection model application-wide. _Tests: cross-screen consistency._

### Access Control Matrix _(required when data visibility is in scope)_

| Actor                          | Allowed Data Visibility                                                                 | Explicitly Denied Visibility                         | Validation Notes                                      |
| ------------------------------ | --------------------------------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------- |
| Top / mid leader               | Subtree or Itself for any descendant in their authorized reporting tree                 | Peers, superiors, other branches, non-descendants    | Subtree of a child cannot escape actor’s own subtree  |
| Leader selecting child’s team  | Selected descendant + that descendant’s descendants (still within actor’s tree)         | Anyone outside actor’s authorized tree               | Deep include-all-levels; not direct-reports-only      |
| Leader selecting Itself        | Only the chosen descendant’s own records                                                | That person’s reports (unless separately selected)   | Itself never widens access beyond the person          |
| Individual contributor / peer  | No access to these leader team screens / picker scopes                                  | All team scopes                                      | Existing leader-only gates remain                     |

### Key Entities

- **Hierarchy selection**: A chosen person from the leader’s reporting tree plus a **scope mode** of either **subtree** (person + all descendants) or **itself** (person only).
- **Subtree**: The selected person and every person who reports to them directly or indirectly at any depth, limited to people the actor is already allowed to see.
- **Itself**: Scope limited to the selected person’s own data, excluding their reports.
- **Shared hierarchy team-member picker**: The common control used across leader team screens to choose whose data to view.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Leaders can obtain a multi-level team view with a single selection of a higher-level person in under 10 seconds (open picker → select person → see scoped results), without selecting each descendant individually.
- **SC-002**: In usability checks, at least 90% of leaders correctly distinguish subtree vs Itself on the first attempt after reading the picker labels.
- **SC-003**: 100% of screens that use the shared hierarchy team-member picker apply the same subtree / Itself rules (no screen left on single-person-only selection for managers with reports).
- **SC-004**: Access-control validation passes for allow (descendant subtree/Itself) and deny (peer, superior, other branch) on every affected screen’s data load.
- **SC-005**: Leaders can switch from a person’s team scope to that person’s Itself scope (and back) and see updated results without leaving the screen.

## Assumptions

- The hierarchy combobox’s visual tree (indent, expand/collapse, names) remains correct and is not redesigned beyond adding the Itself option and clearer scope feedback.
- Default meaning of selecting a person’s name (when they have reports) is **subtree**; **"Itself"** is the explicit opt-in for person-only scope.
- Leaf people keep a single select action (person only); offering "Itself" for leaves is unnecessary.
- "All my team" / cleared selection behavior on screens that already support it stays as today (full authorized team for the logged-in leader) and is separate from selecting a subordinate’s subtree.
- The change applies application-wide to current shared-picker consumers; screens that do not use this picker are out of scope.
- Existing date ranges and other non-person filters continue to apply after the new scope is resolved.
- Portuguese and English copy for "Itself" will use natural localization (not necessarily the English word "Itself" in `pt-BR`).
