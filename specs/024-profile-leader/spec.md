# Feature Specification: Profile Assigned Leader

**Feature Branch**: `024-profile-leader`  
**Created**: 2026-08-20  
**Status**: Draft  
**Input**: User description: "in the profile page please show the leader of the people that are logged in"

## User Scenarios & Testing _(mandatory, with required automated tests)_

### User Story 1 - See assigned leader on own profile (Priority: P1)

A signed-in person opens their profile and sees who their assigned leader is, by name, so they know who they report to without opening hierarchy management.

**Why this priority**: This is the core request—identity on profile is incomplete without the reporting relationship that already exists in the organization.

**Automated Test Requirement**: Add tests under `tests/024-profile-leader/` covering: session identity for a user with an assigned leader includes that leader’s identity; the Profile screen displays the leader’s name as a read-only field; another user’s leader is not shown on this screen.

**Frontend Design**: The existing Profile screen MUST use the `frontend-design` skill with Material UI best practices. Present Leader with the same read-only identity layout as Name and Email (labeled subtitle plus body text), placed after email and before GitHub login.

**Internationalization**: Leader label and related copy MUST be externalized to `en-US` and `pt-BR` translation catalogs. Tests MUST verify both locales and key parity.

**Access Control Validation**: A signed-in user may see only **their own** assigned leader’s public identity (name). They MUST NOT use Profile to view another person’s leader. Leader assignment remains read-only here; changing who leads whom stays in existing hierarchy-management flows. This is the user’s own reporting assignment, not a browse of the leader’s private records.

**Acceptance Scenarios**:

1. **Given** a signed-in user whose account has an assigned leader named “Team Leader”, **When** they open their profile, **Then** they see a Leader field showing “Team Leader”.
2. **Given** a signed-in user with an assigned leader, **When** they view the Leader field, **Then** it is not editable (no input or save control for leader).
3. **Given** a signed-in user, **When** they open their own profile, **Then** they do not see other people’s leaders.

---

### User Story 2 - Empty state when no leader is assigned (Priority: P1)

A signed-in person with no assigned leader (for example they sit at the top of the organization) still sees the Leader field, with a clear empty state so they are not left wondering if the information failed to load.

**Why this priority**: Without an empty state, people with no leader would appear to have a missing or broken profile field.

**Automated Test Requirement**: Add tests under `tests/024-profile-leader/` covering: session identity has no leader when none is assigned; the Profile screen shows the empty-state copy instead of a name.

**Frontend Design**: Keep the same labeled Leader row. Empty-state text MUST use the same body typography as other identity values so the layout does not jump.

**Internationalization**: Empty-state copy MUST be externalized (`en-US`: “No leader assigned”; `pt-BR`: “Nenhum líder atribuído”) with key parity tests.

**Access Control Validation**: Absence of a leader is the signed-in user’s own assignment state. The empty state MUST NOT reveal whether any other account has a leader.

**Acceptance Scenarios**:

1. **Given** a signed-in user with no assigned leader, **When** they open their profile, **Then** the Leader field shows “No leader assigned” (or the Portuguese equivalent when that language is active).
2. **Given** a signed-in user with no assigned leader, **When** they open their profile, **Then** the Leader row is still visible (not hidden).

---

### Edge Cases

- If the stored leader reference cannot be resolved (for example the leader account no longer exists), treat it the same as no leader assigned and show the empty state.
- Leader name is display-only; a later hierarchy reassignment is reflected after the next session load (login, refresh, or profile save that returns updated identity).
- Profile save of other settings (GitHub, theme, language, date format) MUST leave the Leader field unchanged and still display the current assignment.

## Requirements _(mandatory, with required test coverage)_

### Functional Requirements

_All functional requirements MUST be covered by automated tests._

- **FR-001**: After sign-in or session refresh, the signed-in user’s identity MUST include their assigned leader’s identity when a leader is assigned.
- **FR-002**: When no leader is assigned, the signed-in user’s identity MUST indicate that no leader is present (not an error).
- **FR-003**: The Profile screen MUST show a read-only Leader field for every signed-in user.
- **FR-004**: When a leader is assigned, the Leader field MUST display that person’s full name.
- **FR-005**: When no leader is assigned (or the assignment cannot be resolved), the Leader field MUST display the empty-state message.
- **FR-006**: Users MUST NOT change their leader from the Profile screen.
- **FR-007**: Users MUST NOT see another user’s leader on their own Profile screen.
- **FR-008**: Leader label and empty-state copy MUST be available in `en-US` and `pt-BR`.

### Access Control Matrix _(required when data visibility is in scope)_

| Actor              | Allowed Data Visibility                                      | Explicitly Denied Visibility                         | Validation Notes                                      |
| ------------------ | ------------------------------------------------------------ | ---------------------------------------------------- | ----------------------------------------------------- |
| Signed-in user     | Own assigned leader’s public name (or empty state)           | Other users’ leaders; leader’s private records       | Profile and session identity for `request.auth` only  |
| Unauthenticated    | None                                                         | All leader assignment data                           | Profile requires an authenticated session             |
| Administrator      | Directory payloads may include each listed user’s leader     | Not a Profile browse of arbitrary leaders via `/app/profile` | Admin directory already lists users; no new Profile ACL |
| Leader (hierarchy) | Unchanged existing hierarchy management                      | Profile is not an alternate assignment editor        | Assignment stays in hierarchy management              |

### Key Entities

- **User account**: already has an optional assigned leader relationship.
- **Leader summary**: public identity of that assigned leader (identifier plus full name), or none.
- **Profile identity**: read-only name, email, and leader shown to the signed-in user.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A signed-in user with an assigned leader can see that leader’s name on Profile without extra navigation.
- **SC-002**: A signed-in user with no assigned leader sees a clear empty state on the same Leader field (not a blank gap or error).
- **SC-003**: 100% of automated acceptance scenarios for US1 and US2 pass, including both language catalogs for the new copy.
- **SC-004**: Users cannot edit leader assignment from Profile (no control is offered).

## Assumptions

- “The people that are logged in” means the currently signed-in user, not a live directory of who is online.
- Leader assignment already exists in the organization; this feature only displays it.
- Showing the assigned leader’s name is the user’s own reporting relationship, not access to that leader’s private work data.
- Displaying name (not email) is sufficient to recognize the leader.
- Existing Profile save behavior for other fields remains unchanged.
