# Feature Specification: Deliverable Review Notes

**Feature Branch**: `011-deliverable-review-notes`  
**Created**: 2026-05-30  
**Status**: Draft  
**Input**: User description: "IN the screen Team Deliverables when i click in review a modal is open with the details of that deliverable. Now lets work in the second tab of that screen where a person that is a Leader will add DeliverableReview. So lets create this screen respecting the DAC principle."

## Clarifications

### Session 2026-05-30

- Q: When a leader saves review notes, should the deliverable reviewed indicator change automatically, and does it differ by reporting relationship? → A: ~~Direct-leader only~~ **Superseded** — see clarifications below.
- Q: Should auto-reviewed on notes save apply only to the direct leader or to any leader who writes a review? → A: **Any authorized leader** who successfully saves review notes MUST have that deliverable automatically marked **reviewed for that leader** on the Team Deliverables table. Reviewed state remains per leader—one leader saving notes does not change another leader's reviewed indicator.
- Q: Confirm uniform reviewed behaviour for all leaders in the chain? → A: **Same behaviour for any leader** — direct manager, indirect superior, or any other authorized leader in the reporting chain who saves review notes gets their own reviewed indicator auto-updated; no leader type is treated differently.

## User Scenarios & Testing _(mandatory, with required automated tests)_

### User Story 1 - Leader writes and saves review notes (Priority: P1)

As a leader reviewing a team member's deliverable, I open the Review modal from Team Deliverables, switch to the Notes tab, write my private coaching notes about that deliverable, and save them so I can reference my feedback in future one-on-ones.

**Why this priority**: This is the core value of the Notes tab—leaders capturing structured feedback tied to a specific deliverable without leaving the Team Deliverables workflow.

**Automated Test Requirement**: Add tests at `tests/011-deliverable-review-notes/deliverable-review-notes-save.us1.test.md` (and corresponding UI/API tests under `tests/011-deliverable-review-notes/`) covering: Notes tab renders an editable notes area for authorized leaders, save persists notes for the logged-in leader and deliverable, reload shows saved content, empty-state before first save, and auto-reviewed for the saving leader on successful notes save.

**Frontend Design**: Implementation MUST use the `frontend-design` skill with Material UI best practices inside the existing Review deliverable modal Notes tab—a multiline text area, clear Save action, success/error feedback, and loading state while fetching existing notes.

**Access Control Validation**: Only the logged-in leader may create or update notes for deliverables they are authorized to read via the existing hierarchical deliverables read rules. Notes MUST NOT be visible to or editable by the deliverable owner, peers, or leaders outside the authorized read path.

**Acceptance Scenarios**:

1. **Given** a leader opens Review on a subordinate deliverable they are authorized to read, **When** they switch to the Notes tab, **Then** they see an editable notes area (empty if they have never saved notes for this deliverable).
2. **Given** a leader enters text in the Notes tab and saves, **When** they close and reopen the modal or reload the page, **Then** their saved notes appear unchanged for that deliverable.
3. **Given** a leader has previously saved notes, **When** they edit the text and save again, **Then** the updated notes replace the prior version for that leader–deliverable pair.
4. **Given** a leader saves notes successfully, **When** the save completes, **Then** they receive clear confirmation that notes were saved.
5. **Given** any authorized leader saves review notes, **When** the save completes, **Then** that deliverable shows as **reviewed** for **that leader** on the Team Deliverables table without requiring a separate reviewed toggle.
6. **Given** Leader A and Leader B are both authorized to read the same deliverable, **When** Leader A saves review notes, **Then** only Leader A's reviewed indicator updates; Leader B's reviewed indicator is unchanged until Leader B saves their own notes or toggles reviewed manually.

---

### User Story 2 - Leader views existing notes when returning (Priority: P1)

As a leader who reviewed a deliverable earlier, I can reopen the Notes tab and immediately see the notes I wrote before, so I do not repeat feedback or lose context between check-ins.

**Why this priority**: Read-back is essential for notes to be useful across sessions; without it, leaders would lose prior coaching context.

**Automated Test Requirement**: Add tests at `tests/011-deliverable-review-notes/deliverable-review-notes-load.us2.test.md` validating fetch on tab open, display of saved notes, empty state when no notes exist, and error handling when load fails.

**Frontend Design**: Opening the Notes tab MUST load the current leader's saved notes for the selected deliverable with a visible loading indicator and a recoverable error state if loading fails.

**Access Control Validation**: Load returns only the logged-in leader's notes for the requested deliverable; unauthorized requests are denied with no note content leaked.

**Acceptance Scenarios**:

1. **Given** a leader saved notes for a deliverable yesterday, **When** they open Review and switch to Notes today, **Then** yesterday's notes are shown in the editable area.
2. **Given** a leader has never saved notes for a deliverable, **When** they open the Notes tab, **Then** the notes area is empty with guidance that they may add private review notes.
3. **Given** loading notes fails due to a transient error, **When** the Notes tab is shown, **Then** the leader sees an error message and can retry without losing unsaved draft text they may have started typing.

---

### User Story 3 - Independent notes per leader (Priority: P2)

As an organization with multiple leaders in the same reporting chain, each leader maintains their own private notes on the same deliverable without seeing or overwriting another leader's notes.

**Why this priority**: Deliverable review is a leader-specific workflow; shared notes would break coaching privacy and conflict with per-leader reviewed tracking from Team Deliverables.

**Automated Test Requirement**: Add tests at `tests/011-deliverable-review-notes/deliverable-review-notes-isolation.us3.test.md` covering two leaders on the same deliverable with distinct note content, no cross-leader visibility on read, and no cross-leader overwrite on save.

**Frontend Design**: The UI MUST never display another leader's notes; only the logged-in leader's content is loaded into the Notes tab.

**Access Control Validation**: Each leader's notes are scoped to `(reviewing leader, deliverable)`; peer leaders in other branches and unauthorized users cannot read or write any leader's notes.

**Acceptance Scenarios**:

1. **Given** Leader A and Leader B are both authorized to read the same subordinate deliverable, **When** Leader A saves "Focus on testing" and Leader B saves "Great stakeholder comms", **Then** Leader A sees only "Focus on testing" and Leader B sees only "Great stakeholder comms".
2. **Given** Leader A has saved notes, **When** Leader B opens Notes on the same deliverable, **Then** Leader B sees an empty notes area until they save their own content.
3. **Given** Leader A updates their notes, **When** Leader B reloads their Notes tab, **Then** Leader B's notes remain unchanged.
4. **Given** Leader A and Leader B are both authorized to read the same deliverable, **When** Leader A saves notes, **Then** Leader A's reviewed indicator auto-updates and Leader B's reviewed indicator remains unchanged until Leader B acts.

---

### User Story 4 - DAC enforcement for review notes (Priority: P2)

As the business owner, I need review notes accessible only through the same hierarchical authorization rules as deliverable read access, so coaching notes never leak outside the authorized management chain.

**Why this priority**: Notes contain sensitive coaching feedback; DAC enforcement is mandatory whenever organizational deliverable data is in scope.

**Automated Test Requirement**: Add tests at `tests/011-deliverable-review-notes/deliverable-review-notes-dac.us4.test.md` validating allow for authorized superiors in chain, deny for peers, deny for subordinates reading upward, deny for non-leaders, and deny for unauthenticated access on both read and write paths.

**Frontend Design**: Unauthorized users MUST NOT reach the Notes editor with data; denied API responses surface as consistent error states without exposing note content.

**Access Control Validation**: Read and write of review notes follow the same hierarchical visibility as deliverable detail read: owner self, superiors in chain to top, and subtree reads where already allowed for deliverables; peers, upward reads by subordinates, and other branches are denied.

**Acceptance Scenarios**:

1. **Given** any authorized leader is permitted to read a subordinate's deliverable, **When** they open Notes and save text, **Then** the operation succeeds and their reviewed indicator auto-updates for that deliverable.
2. **Given** a peer attempts to read or save notes for another peer's deliverable, **When** the request is processed, **Then** access is denied and no notes are returned or stored.
3. **Given** a deliverable owner (subordinate) opens their own deliverable detail, **When** they attempt to access leader review notes through any path, **Then** access is denied.
4. **Given** an unauthenticated request for review notes, **When** processed, **Then** the request is rejected.

---

### Edge Cases

- Leader saves empty or whitespace-only notes: system accepts clearing notes (notes area becomes empty after save) or rejects with guidance—implementation may trim; leader must always understand the outcome.
- Leader saves notes while offline or request fails: user sees error, prior saved notes remain unchanged, and unsaved edits are not silently discarded without feedback.
- Leader has Notes tab open and another session updates notes: last successful save wins; stale overwrite behavior is acceptable in v1 with updated-at not surfaced to users unless conflict detection is added later.
- Deliverable is deleted after notes were saved: notes are no longer accessible (cascade with deliverable removal).
- Leader loses leader role after saving notes: subsequent read/write attempts are denied; existing stored notes remain but are inaccessible until role is restored.
- Very long notes text: system enforces a reasonable maximum length with a clear validation message before save.
- Leader opens Notes before deliverable detail finishes loading: Notes tab shows appropriate loading or disabled state until deliverable context is available.
- Concurrent save from same leader: last write persists without corrupting content.
- Leader saves notes then manually unchecks reviewed in the table: manual toggle wins until the next successful notes save, which re-marks reviewed for that leader.
- Leader clears notes to empty: reviewed indicator is **not** automatically cleared; the leader must use the table toggle to unmark reviewed if desired.
- Leader marks deliverable reviewed from the table without opening Notes: allowed for all leaders; auto-reviewed on note save is additive and does not remove manual toggle capability.

## Requirements _(mandatory, with required test coverage)_

### Functional Requirements

_All functional requirements MUST be covered by automated tests. This feature stores leader coaching notes tied to deliverables and MUST enforce hierarchical DAC on every read and write path._

- **FR-001**: The system MUST implement the **Notes** tab inside the existing Team Deliverables **Review deliverable** modal (second tab after Details).
- **FR-002**: The Notes tab MUST provide a multiline editable area where an authorized leader can compose review notes for the currently selected deliverable.
- **FR-003**: The system MUST persist review notes per **reviewing leader and deliverable** pair, independent of other leaders' notes on the same deliverable.
- **FR-004**: The system MUST load and display the logged-in leader's saved notes when the Notes tab is opened for an authorized deliverable.
- **FR-005**: The system MUST provide an explicit **Save** action on the Notes tab that persists the current note text for the logged-in leader and deliverable.
- **FR-006**: The system MUST show clear success feedback after a successful save and clear error feedback when save fails, without silently losing user input.
- **FR-007**: The system MUST show a loading state while notes are being fetched and an empty state with brief guidance when no notes exist yet.
- **FR-008**: The system MUST allow a leader to update previously saved notes by editing and saving again.
- **FR-009**: The system MUST allow a leader to clear notes by saving empty content (after trimming whitespace), resulting in no stored note text for that leader–deliverable pair.
- **FR-010**: When any **authorized leader** successfully saves review notes, the system MUST automatically mark the deliverable as **reviewed** for **that saving leader** on the Team Deliverables table.
- **FR-011**: Auto-reviewed on notes save MUST apply uniformly to **any authorized leader** regardless of position in the reporting chain; reviewed state MUST remain scoped per `(reviewing leader, deliverable)` so one leader saving notes does not change another leader's reviewed indicator.
- **FR-012**: Toggling reviewed from the Team Deliverables table MUST remain available for all leaders and MUST NOT require or delete review notes; auto-reviewed on note save does not disable manual toggle.
- **FR-013**: The system MUST restrict read and write of review notes to users with the **leader** role who are authorized to read the target deliverable under existing hierarchical deliverables rules.
- **FR-014**: The system MUST deny read and write of review notes to non-leaders, unauthenticated users, deliverable owners viewing their own work, peers, users outside the authorized superior/subordinate relationship, and any user who cannot read the deliverable detail.
- **FR-015**: Review notes MUST NOT be visible to the deliverable owner or to any user other than the reviewing leader who authored them.
- **FR-016**: The system MUST enforce a reasonable maximum length on review notes with a user-facing validation message when exceeded.
- **FR-017**: When a deliverable is removed, associated review notes for all leaders MUST no longer be accessible.
- **FR-018**: The system MUST cover all functional requirements with automated tests, including authorization negative cases, per-leader isolation, persistence, per-leader auto-reviewed on notes save, and empty/clear scenarios.

### Access Control Matrix _(required when data visibility is in scope)_

Review notes follow the same hierarchical deliverable read authorization as deliverable detail. Notes are **leader-authored, leader-private**: even authorized superiors in the same chain cannot read another leader's notes—each leader sees and edits only their own.

| Actor                                     | Open Notes tab (authorized deliverable) | Read own notes     | Save/update own notes | Read another leader's notes | Deliverable owner reads notes |
| ----------------------------------------- | --------------------------------------- | ------------------ | --------------------- | --------------------------- | ----------------------------- |
| Leader authorized to read deliverable     | Allowed                                 | Allowed (own only) | Allowed (own only)    | Denied                      | N/A                           |
| Leader not authorized to read deliverable | Denied                                  | Denied             | Denied                | Denied                      | N/A                           |
| Collaborator (non-leader)                 | Denied                                  | Denied             | Denied                | Denied                      | Denied                        |
| Deliverable owner (subordinate)           | Denied via modal path                   | Denied             | Denied                | Denied                      | Denied                        |
| Peer (same level, not in chain)           | Denied                                  | Denied             | Denied                | Denied                      | Denied                        |
| Unauthenticated user                      | Denied                                  | Denied             | Denied                | Denied                      | Denied                        |

**Validation notes**: Automated tests MUST cover: authorized leader save/load allow; second leader isolation on same deliverable; per-leader auto-reviewed on notes save without cross-leader reviewed side effects; peer deny; subordinate-upward deny; non-leader deny; unauthenticated deny; out-of-subtree deliverable deny; owner cannot access notes.

### Key Entities _(include if feature involves data)_

- **Deliverable review (extended)**: A per-leader, per-deliverable record that already tracks reviewed status; extended in this feature to store optional private **review notes** text authored by the reviewing leader, with last-updated timestamp. One record per `(reviewing leader, deliverable)` pair. A successful notes save sets reviewed to true for that reviewing leader.
- **Review notes**: Free-form text content within a deliverable review, visible and editable only by the leader who wrote them; used for coaching feedback and follow-up context.
- **Deliverable (existing)**: The subordinate-owned work item being reviewed; provides context for the modal and scopes authorization.
- **Reviewing leader**: The authenticated leader saving or loading notes; distinct from the deliverable owner. Each reviewing leader maintains independent notes and reviewed state per deliverable.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of unauthorized read and write attempts for review notes are blocked in automated tests (non-leaders, peers, subordinates, unauthenticated, out-of-chain).
- **SC-002**: 100% of save-and-reload scenarios for an authorized leader persist identical note content in automated tests.
- **SC-003**: 100% of two-leader isolation scenarios show no cross-leader note leakage in automated tests.
- **SC-004**: 100% of authorized-leader note-save scenarios auto-mark reviewed for the saving leader only; 100% of multi-leader scenarios show no cross-leader reviewed side effects in automated tests.
- **SC-005**: Leaders with saved notes see their content when opening the Notes tab in under 3 seconds on a typical office network connection in validation tests.
- **SC-006**: 100% of successful saves show explicit confirmation feedback in UI tests; 100% of failed saves show error feedback without falsely indicating success.
- **SC-007**: Leaders can complete adding or updating review notes for a deliverable in under 2 minutes in usability validation with sample data (open modal, switch tab, type, save).

## Assumptions

- The Team Deliverables Review modal with Details and Notes tabs already exists; Details tab behavior is unchanged by this feature.
- **DeliverableReview** already persists per-leader reviewed state from feature 010; this feature extends that concept to include optional **review notes** text on the same leader–deliverable record. Any authorized leader who saves notes also sets reviewed for **that leader**; other leaders' reviewed state is unaffected.
- Notes are **private to the authoring leader** even when multiple leaders in the chain can read the same deliverable—this differs from shared deliverable content and matches the per-leader reviewed workflow.
- Hierarchical read authorization reuses existing deliverables rules (superiors in chain may read subordinate deliverables; peers and upward reads denied).
- Only users with the leader role may use the Notes tab; collaborators without leader role do not access Team Deliverables review notes workflow.
- A reasonable maximum note length (for example 4,000–8,000 characters) will be chosen during planning; exact limit is not business-critical for v1 as long as validation is clear.
- Rich text, attachments, @mentions, and note history/versioning are out of scope for v1—plain multiline text only.
- Manual reviewed toggle on the Team Deliverables table remains available for all leaders alongside auto-reviewed on notes save.
- Deliverable owners do not receive notifications when leaders save notes in v1.
