# Feature Specification: Collaborator Deliverables

**Feature Branch**: `006-collaborator-deliverables`  
**Created**: 2026-05-26  
**Status**: Draft  
**Input**: User description: "Create a new entity called Deliverable, migrations, apis and screens to list, edit or delete. A collaborator can have as many deliverables as he wants. It should have a screen to manage it. Required fields: title, description, role in deliverable, system tags (reference to current entity), business impact classification, personal performance improvement points. Optional: user tags, technical description, list of important links."

## Clarifications

### Session 2026-05-26

- Q: Who can read another collaborator's deliverables under the organizational hierarchy? → A: Peers cannot see each other's deliverables. Any user who is a direct or indirect superior in the reporting hierarchy—up to the top of the chain—can read deliverables for collaborators below them (read-only for non-owners). A user cannot read deliverables belonging to peers, superiors, or users outside their descendant subtree.

## User Scenarios & Testing _(mandatory, with required automated tests)_

### User Story 1 - Collaborator records a new deliverable (Priority: P1)

A signed-in collaborator opens the deliverables management screen, completes the required fields (title, description, their role, system tags, business impact classification, and personal improvement points), optionally adds user tags, technical description, and reference links, and saves a new deliverable that appears in their personal list.

**Why this priority**: Creating deliverables is the core value of the feature; without capture, there is no portfolio to review or grow over time.

**Automated Test Requirement**: Integration tests verify a collaborator can create a deliverable with all required fields and valid system tag references; persistence tests confirm the deliverable is stored with a stable identifier, associated to the owning user, and retrievable after save. Negative tests reject missing required fields, invalid system tag references, and invalid link formats.

**Frontend Design**: The deliverables management screen and create flow MUST use the `frontend-design` skill with Material UI best practices, including clear grouping of required vs optional fields, system tag multi-select tied to the organization tag catalog, and validation feedback inline.

**Access Control Validation**: Only the owning collaborator may create deliverables; creation always attributes ownership to the authenticated user. Superiors cannot create deliverables on behalf of subordinates in v1.

**Acceptance Scenarios**:

1. **Given** a collaborator on the deliverables management screen, **When** they submit a new deliverable with all required fields and at least one valid system tag, **Then** the deliverable is saved and appears in their list with title and business impact classification visible.
2. **Given** a collaborator saves a deliverable, **When** save succeeds, **Then** the system assigns a unique identifier that remains stable on later edits.
3. **Given** a collaborator omits a required field, **When** they attempt to save, **Then** the operation is rejected with a clear message identifying what is missing.
4. **Given** a collaborator selects a system tag identifier that does not exist in the catalog, **When** they attempt to save, **Then** the operation is rejected with a clear message.

---

### User Story 2 - Collaborator views their deliverable portfolio (Priority: P1)

A collaborator opens the deliverables management screen and sees all of their deliverables in one place so they can review, prioritize updates, or open an item to edit.

**Why this priority**: Listing is essential for ongoing portfolio management and is the entry point for edit and delete flows.

**Automated Test Requirement**: API and UI tests confirm collaborators receive their own deliverables on the management screen; negative tests confirm peers cannot list another collaborator's deliverables at the same hierarchy level. Tests cover empty state when no deliverables exist.

**Frontend Design**: The deliverables list on the management screen MUST use the `frontend-design` skill with Material UI best practices, showing title, business impact classification, system tag chips, and updated timestamp where available.

**Access Control Validation**: Collaborators see self-only lists on the management screen. Read access for another user's deliverables follows the organizational hierarchy: denied for peers and for anyone above the owner; allowed read-only for each direct and indirect superior up to the top of the chain once hierarchy resolution is available (validated via fixtures until persistence ships).

**Acceptance Scenarios**:

1. **Given** a collaborator has multiple deliverables, **When** they open the deliverables management screen, **Then** all of their deliverables are listed with enough summary detail to distinguish items.
2. **Given** a collaborator has no deliverables, **When** they open the management screen, **Then** they see an empty state that explains how to add the first deliverable.
3. **Given** two collaborators at the same hierarchy level (peers), **When** one requests the other's deliverables, **Then** access is denied and no peer data is returned.
4. **Given** a collaborator who is not in another user's superior chain, **When** they request that user's deliverables, **Then** access is denied.

---

### User Story 3 - Collaborator updates an existing deliverable (Priority: P2)

A collaborator selects one of their deliverables, changes any allowed fields (required or optional), and saves so the record reflects current reality.

**Why this priority**: Deliverables evolve as work completes or reflection deepens; update is secondary to initial capture and listing.

**Automated Test Requirement**: Integration tests cover successful updates to all field groups, validation failures, authorization denials when targeting another user's deliverable, and stable identifier after edit.

**Frontend Design**: Edit flows on the management screen MUST use the `frontend-design` skill with Material UI best practices, reusing the same field layout and validation patterns as create.

**Access Control Validation**: Only the owning collaborator may update a deliverable. Superiors may view but not edit subordinate deliverables in v1.

**Acceptance Scenarios**:

1. **Given** a collaborator opens an owned deliverable, **When** they change the description and business impact classification and save, **Then** the updated values appear on the next list or detail load.
2. **Given** a collaborator updates system tags, **When** they save with valid catalog references, **Then** the deliverable shows the new tag set.
3. **Given** a collaborator attempts to update another user's deliverable, **When** the save is requested, **Then** the operation is denied and no data changes.

---

### User Story 4 - Collaborator removes a deliverable (Priority: P3)

A collaborator deletes a deliverable they no longer want in their portfolio so their list stays accurate.

**Why this priority**: Deletion supports housekeeping but is less critical than capture and review.

**Automated Test Requirement**: Tests verify successful deletion by the owner, denial for non-owners, and predictable behavior when delete targets a deliverable that was already removed.

**Frontend Design**: Delete confirmation on the management screen MUST use the `frontend-design` skill with Material UI best practices to prevent accidental removal.

**Access Control Validation**: Only the owning collaborator may delete. Superiors cannot delete subordinate deliverables in v1.

**Acceptance Scenarios**:

1. **Given** a collaborator selects an owned deliverable, **When** they confirm deletion, **Then** the deliverable no longer appears in their list.
2. **Given** a deliverable was deleted, **When** the collaborator reloads the management screen, **Then** the deleted item does not reappear.
3. **Given** a user who is not the owner, **When** they attempt to delete a deliverable, **Then** the operation is denied.

---

### User Story 5 - Superior reviews subordinate deliverables (Priority: P3)

A user who is a direct or indirect superior in the organizational reporting chain opens a subordinate's deliverables for coaching and performance conversations. Every ancestor up to the top of the chain has the same read-only visibility into that subordinate's portfolio.

**Why this priority**: Upward-chain visibility supports engineering management use cases and depends on hierarchy resolution already planned in the platform.

**Automated Test Requirement**: Authorization tests with hierarchy fixtures validate read access for each superior in the chain from direct manager through top-of-tree; deny peer lateral access; deny upward access (a subordinate cannot read a superior's deliverables). Until hierarchy persistence ships, tests use the same fixture pattern as other DAC features to lock the contract.

**Frontend Design**: Superior read-only views MAY reuse list presentation from the management screen with clear indication of whose portfolio is shown; implementation MUST use the `frontend-design` skill with Material UI best practices.

**Access Control Validation**: Superior visibility is read-only in v1. Visibility is determined by reporting position in the hierarchy, not by optional role badges alone.

**Acceptance Scenarios**:

1. **Given** a direct manager and their report in the same chain, **When** the manager requests the report's deliverables, **Then** the report's deliverables are returned.
2. **Given** a top-of-chain superior and an indirect report several levels below, **When** the superior requests that report's deliverables, **Then** the report's deliverables are returned.
3. **Given** two collaborators at the same hierarchy level (peers), **When** one requests the other's deliverables, **Then** access is denied.
4. **Given** a subordinate and their manager, **When** the subordinate requests the manager's deliverables, **Then** access is denied.
5. **Given** a superior views a subordinate deliverable, **When** they attempt to edit or delete it, **Then** the operation is denied.

---

### Edge Cases

- A collaborator attempts to save without any system tag selected (must be rejected; at least one system tag is required).
- A collaborator references a system tag that was removed from the administrator catalog after assignment (must be rejected on save with guidance to pick current tags).
- A collaborator enters only whitespace in title or other required text fields (must be rejected after trimming).
- A collaborator adds optional links with invalid URLs or empty URL values (invalid entries rejected; valid entries stored).
- A collaborator adds many optional user tags or links (must remain within defined reasonable limits with clear validation messages).
- A collaborator has a very large number of deliverables (list remains usable without unacceptable delay for typical portfolio sizes).
- Concurrent edit or delete by the same owner in two sessions (second operation receives a clear, non-destructive error if the record changed or was removed).
- A peer bookmarks or deep-links to another peer's deliverable detail (must be denied consistently).
- A superior deep-links to a subordinate's deliverable detail (must be allowed read-only).
- A subordinate attempts to deep-link to a superior's deliverable (must be denied).
- A non-owner who is neither peer nor superior in the chain bookmarks another user's deliverable (must be denied consistently).
- An administrator without ownership attempts to mutate another user's deliverable (denied unless they are the owner; administrator role alone does not grant edit rights in v1).

## Requirements _(mandatory, with required test coverage)_

### Functional Requirements

- **FR-001**: The system MUST persist a **Deliverable** entity owned by exactly one user (the collaborator who created it), with no enforced upper limit on how many deliverables a user may own.
- **FR-002**: The system MUST require a non-empty **title** for every deliverable (trimmed, within a reasonable maximum length for display).
- **FR-003**: The system MUST require a non-empty **description** explaining the deliverable (trimmed, within a reasonable maximum length).
- **FR-004**: The system MUST require a non-empty **role in deliverable** field describing what the owner contributed (trimmed text, reasonable maximum length).
- **FR-005**: The system MUST require at least one **system tag** per deliverable, where each system tag references an existing tag from the organization tag catalog (the Tag entity from administrator tag management).
- **FR-006**: The system MUST require a **business impact classification** selected from a fixed, organization-wide set of values: `LOW`, `MEDIUM`, `HIGH`, and `TRANSFORMATIONAL`.
- **FR-007**: The system MUST require non-empty **personal performance improvement points** describing what the owner can improve (trimmed text, reasonable maximum length).
- **FR-008**: The system MAY store optional **user tags** as free-form labels owned by the user (not validated against the administrator tag catalog); zero or more allowed.
- **FR-009**: The system MAY store an optional **technical description** (trimmed text with reasonable maximum length).
- **FR-010**: The system MAY store zero or more **reference links**, each with a valid URL and an optional short label for display.
- **FR-011**: The system MUST provide a dedicated **deliverables management screen** in the authenticated application where collaborators can list, create, edit, and delete their own deliverables.
- **FR-012**: The system MUST allow the owning collaborator to list all of their deliverables with summary fields sufficient for portfolio review (at minimum: identifier, title, business impact classification, system tags, and last updated time).
- **FR-013**: The system MUST allow the owning collaborator to update any field on their deliverable while preserving the deliverable identifier and ownership.
- **FR-014**: The system MUST allow the owning collaborator to delete their deliverable with explicit confirmation in the user interface.
- **FR-015**: The system MUST deny create, update, and delete operations when the authenticated user is not the owner of the target deliverable.
- **FR-016**: The system MUST enforce hierarchical read access for deliverables from the viewer's position in the organizational reporting tree: (a) a user MAY read deliverables they own; (b) a user MAY read deliverables owned by any direct or indirect subordinate; (c) each direct or indirect superior of an owner, up to the top of the reporting chain, MAY read that owner's deliverables; (d) a user MUST NOT read deliverables owned by peers at the same hierarchy level; (e) a user MUST NOT read deliverables owned by anyone above them in the chain (their superiors); (f) a user MUST NOT read deliverables owned by users outside the owner's superior/subordinate relationship (other branches).
- **FR-017**: The system MUST restrict non-owner read access to deliverables to read-only in v1 (no create, update, or delete on behalf of subordinates or by superiors in the chain).
- **FR-018**: The system MUST validate system tag references against the current tag catalog on create and update.
- **FR-019**: The system MUST validate business impact classification against the allowed enum values on create and update.
- **FR-020**: The system MUST validate reference link URLs and reject malformed or empty URLs when links are provided.
- **FR-021**: The system MUST present user-friendly validation and error messages on the management screen when input is invalid.
- **FR-022**: The system MUST cover all functional requirements in this feature with automated tests, including authorization negative cases and DAC allow/deny scenarios.
- **FR-023**: The system MUST persist deliverable data reliably so records survive application restarts and remain associated with the correct owner after deployment.

### Access Control Matrix

Visibility is determined by **organizational reporting position**, not by role badges alone. "Superior" means any direct or indirect manager in the chain up to the top; "subordinate" means any direct or indirect report in the subtree below the viewer.

| Viewer position relative to owner                | List / read owner deliverables | Create / update / delete owner deliverables |
| ------------------------------------------------ | ------------------------------ | ------------------------------------------- |
| Owner (self)                                     | Allowed                        | Allowed                                     |
| Direct or indirect superior (up to top of chain) | Allowed (read-only)            | Denied in v1                                |
| Direct or indirect subordinate (viewing upward)  | Denied                         | Denied                                      |
| Peer (same hierarchy level)                      | Denied                         | Denied                                      |
| Unrelated branch (no reporting path)             | Denied                         | Denied                                      |

**Validation notes**: Automated tests MUST cover: peer deny; subordinate cannot read superior; direct manager allow; indirect manager at top of chain allow; unrelated branch deny; non-owner mutate deny. Until organizational hierarchy persistence is available, tests MUST use authorization fixtures that assert this matrix so implementation cannot regress when the hierarchy resolver ships.

### Key Entities

- **Deliverable**: A collaborator-owned record of meaningful work or outcome for portfolio and performance reflection. Required attributes: stable unique identifier, owning user reference, title, description, role in deliverable, one or more system tag references, business impact classification, personal performance improvement points. Optional attributes: user tags (free-form list), technical description, reference links (URL plus optional label). Timestamps for creation and last update support list ordering and audit of changes.
- **System tag reference**: Association between a deliverable and a tag from the organization catalog; references MUST point to existing catalog tags at save time.
- **User tag**: Optional free-form label supplied by the owner; not governed by the administrator tag catalog.
- **Reference link**: Optional URL with optional display label, representing material relevant to the deliverable (documentation, demos, tickets, etc.).
- **Business impact classification**: Single-valued category describing the deliverable's organizational impact (`LOW`, `MEDIUM`, `HIGH`, `TRANSFORMATIONAL`).
- **Tag** (existing): Administrator-managed catalog entry used only via system tag references on deliverables; deliverable management does not create or edit catalog tags.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A collaborator can create a deliverable with all required fields in under 3 minutes and see it in their portfolio on the next load of the management screen.
- **SC-002**: 100% of unauthorized peer and upward (subordinate-viewing-superior) read attempts, and 100% of non-owner mutate attempts, are blocked in automated regression tests; 100% of authorized superior-chain read attempts (direct and indirect, up to top) are allowed in read-only mode.
- **SC-003**: 100% of create or update attempts with invalid system tag references or invalid business impact values are rejected with clear messages in automated tests.
- **SC-004**: A collaborator with at least 50 deliverables can open the management list and identify any item by title and impact classification without unacceptable delay (validated by performance-oriented acceptance tests with realistic data volume).
- **SC-005**: After deployment, existing deliverables remain available to their owners with no data loss (verified by persistence tests).

## Assumptions

- "Collaborator" means an authenticated user with the collaborator role from user role profiles; deliverable ownership is always tied to that user's identity.
- System tags reference the existing administrator-managed Tag catalog; assigning tags to deliverables does not change how catalog tags are administered.
- User tags are intentionally separate from system tags: free-form, optional, and not deduplicated organization-wide in v1.
- Business impact classifications use the four fixed values listed in FR-006; expanding or customizing the set is out of scope for v1.
- The deliverables management screen is the primary surface for list, create, edit, and delete; separate admin-wide deliverable moderation is out of scope.
- Superiors in the reporting chain (direct or indirect, up to the top) gain read-only visibility into subordinate deliverables; peers and subordinates viewing upward cannot see others' deliverables outside the allowed directions above.
- Editing another person's deliverable requires ownership; superior read access does not imply edit rights in v1.
- Organizational reporting hierarchy persistence may follow this feature; DAC tests use fixtures until the subtree resolver is configured, consistent with user role profiles.
- Reasonable field length and link count limits follow platform-wide validation conventions (exact numbers defined during planning, not in this specification).
- Optional reference links open external destinations; the product does not embed or preview third-party content in v1 beyond displaying labels and URLs.
