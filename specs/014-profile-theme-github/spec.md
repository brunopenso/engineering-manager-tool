# Feature Specification: Profile Theme and GitHub Login

**Feature Branch**: `014-profile-theme-github`  
**Created**: 2026-06-04  
**Status**: Draft  
**Input**: User description: "lets change the user profile screen and APIs. Save user preference for dark or light theme in the backend; add a new field called github login to save the user data (screens, migrations, apis)."

## User Scenarios & Testing _(mandatory, with required automated tests)_

### User Story 1 - Persist appearance preference across sessions (Priority: P1)

A signed-in user selects light or dark appearance on the Profile screen (`/app/profile`). The system remembers that choice on their account so the same preference applies when they sign in again on any device or browser, without relying only on a local browser setting.

**Why this priority**: Theme preference is already offered on the profile screen but is lost when cookies are cleared or when the user switches devices; storing it on the account delivers the core value of this request.

**Automated Test Requirement**: Add tests under `tests/014-profile-theme-github/` covering: default appearance is light for a user with no saved preference; saving dark via profile update persists and returns on next session load; saving light after dark overwrites correctly; invalid appearance values are rejected; unauthenticated update attempts are denied; authenticated user receives saved preference in session identity responses.

**Frontend Design**: The existing Profile screen appearance control MUST use the `frontend-design` skill with Material UI best practices—keep the light/dark toggle group, show the current saved preference when the page loads, and reflect changes immediately in the UI while the save completes.

**Access Control Validation**: Only the signed-in user may read or change their own appearance preference; other users and non-administrators cannot read or modify another account's preference.

**Acceptance Scenarios**:

1. **Given** a user with no saved appearance preference, **When** they open the Profile screen, **Then** light appearance is shown as the active selection and applied to the app.
2. **Given** a signed-in user on the Profile screen, **When** they select dark appearance, **Then** the app switches to dark immediately and the preference is stored on their account.
3. **Given** a user previously saved dark appearance, **When** they sign in on a new browser without a local theme cookie, **Then** dark appearance is applied from their account preference.
4. **Given** a user previously saved dark appearance, **When** they select light on the Profile screen, **Then** light is stored and used on subsequent sessions.

---

### User Story 2 - View and maintain GitHub login on profile (Priority: P1)

A signed-in user can see and edit their GitHub login (username/handle) on the Profile screen so the organization can associate their product identity with their GitHub account for future workflows.

**Why this priority**: The new field is an explicit product requirement and belongs on the same self-service profile surface as name, email, and appearance.

**Automated Test Requirement**: Add tests under `tests/014-profile-theme-github/` covering: empty GitHub login is allowed; valid handle is saved and shown on reload; leading/trailing whitespace is trimmed before save; handles with invalid characters are rejected with a clear message; overlong values are rejected; unauthenticated save is denied; session identity responses include the saved value; other users cannot read or update another user's GitHub login through self-service APIs.

**Frontend Design**: The Profile screen MUST add a labeled editable field for GitHub login using the `frontend-design` skill with Material UI best practices—helper text clarifying it is the GitHub username (not a full URL), inline validation feedback, and a save action consistent with profile editing patterns.

**Access Control Validation**: GitHub login is part of the user's own profile data; only the account owner may view or update it via self-service profile flows. Administrator user directory screens are unchanged in this feature unless separately specified.

**Acceptance Scenarios**:

1. **Given** a user with no GitHub login stored, **When** they open the Profile screen, **Then** the GitHub login field is empty and editable.
2. **Given** a signed-in user enters a valid GitHub handle, **When** they save their profile, **Then** the value is stored and displayed on the next visit to the Profile screen.
3. **Given** a user clears the GitHub login field, **When** they save, **Then** the stored value is removed (empty is allowed).
4. **Given** a user enters characters that are not allowed for a GitHub handle, **When** they save, **Then** the system does not persist the value and shows which input is invalid.

---

### User Story 3 - Session identity includes profile preferences (Priority: P2)

After sign-in or when refreshing session identity, the signed-in user receives their saved appearance preference and GitHub login together with existing identity fields (name, email, roles) so the application can initialize the UI without an extra profile-only round trip when possible.

**Why this priority**: Keeps login and shell bootstrap consistent with other profile fields already exposed after authentication.

**Automated Test Requirement**: Add tests under `tests/014-profile-theme-github/` covering: login response includes appearance preference and GitHub login when set; session identity endpoint returns the same fields; fields reflect the latest saved values after a profile update.

**Access Control Validation**: Session identity responses include these fields only for the authenticated user themselves, not for arbitrary user identifiers.

**Acceptance Scenarios**:

1. **Given** a user with saved dark appearance and GitHub login `acme-dev`, **When** they complete sign-in, **Then** the session identity includes appearance `dark` and GitHub login `acme-dev`.
2. **Given** a user updates GitHub login on the Profile screen, **When** session identity is loaded again in the same session, **Then** the updated GitHub login is returned.

---

### Edge Cases

- User changes appearance rapidly: last successful save wins; UI shows the latest selected mode.
- Save fails due to network or server error: user sees an error message and the UI reverts to the last known saved preference (or default light if none saved).
- GitHub login differs only by letter case: stored and compared in a consistent case-normalized form for uniqueness checks if enforced, but displayed as the user entered after trim (normalization rules documented in assumptions).
- Existing users before this feature: appearance defaults to light; GitHub login is empty until set.
- Local browser theme cookie disagrees with server preference on sign-in: server preference takes precedence for signed-in experience; local cookie may be updated to match after load.
- Profile page opened while not signed in: user is redirected or blocked by existing authentication guards; no preference is exposed.

## Requirements _(mandatory, with required test coverage)_

### Functional Requirements

_All functional requirements MUST be covered by automated tests. This feature extends the existing Profile screen and authenticated user identity; it does not change role grant/revoke or administrator user directory behavior._

- **FR-001**: The system MUST store each user's appearance preference as exactly one of **light** or **dark** on their account record.
- **FR-002**: The system MUST default appearance preference to **light** when no value has been saved for that user.
- **FR-003**: The system MUST allow a signed-in user to update their own appearance preference from the Profile screen (`/app/profile`).
- **FR-004**: The system MUST reject appearance values other than light or dark with a clear validation outcome.
- **FR-005**: The system MUST include the user's current appearance preference in authenticated session identity responses (sign-in and current-user identity).
- **FR-006**: The system MUST store an optional **GitHub login** text field per user account, representing the user's GitHub username/handle (not a full profile URL).
- **FR-007**: The system MUST allow a signed-in user to view and update their own GitHub login from the Profile screen.
- **FR-008**: The system MUST treat an empty GitHub login as valid (cleared / unset).
- **FR-009**: The system MUST validate GitHub login format before save: non-empty values MUST match GitHub username rules (alphanumeric ASCII characters and hyphens, reasonable length limit, no spaces or URL schemes).
- **FR-010**: The system MUST trim leading and trailing whitespace from GitHub login before validation and storage.
- **FR-011**: The system MUST include GitHub login in authenticated session identity responses when the user is signed in.
- **FR-012**: The system MUST expose a self-service API for the signed-in user to update their own appearance preference and GitHub login; other users MUST NOT use this API to modify another account.
- **FR-013**: The system MUST deny unauthenticated requests to read or update these profile fields.
- **FR-014**: When a signed-in user has a server-stored appearance preference, the product MUST apply that preference on session start before or as the main shell renders, superseding a conflicting anonymous local default for the authenticated session.
- **FR-015**: The Profile screen MUST continue to show existing read-only identity fields (name, email, active roles) and MUST add GitHub login as an editable field without removing current capabilities.
- **FR-016**: Existing user accounts MUST receive the new stored fields without data loss to name, email, roles, or login history.

### Access Control Matrix _(required when data visibility is in scope)_

| Actor                                    | Allowed                                                                                      | Explicitly denied                                                                | Validation notes                                         |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Signed-in user (any role)                | Read and update own appearance preference and GitHub login via Profile and self-service APIs | Reading or updating another user's appearance or GitHub login                    | Tests for self-only update success and cross-user denial |
| Unauthenticated                          | None                                                                                         | All profile preference and GitHub login access                                   | 401/403 on API and no profile screen access              |
| Administrator (via admin user directory) | Unchanged: manage roles on other users as today                                              | Editing another user's GitHub login or theme via admin directory in this feature | Out of scope; no new admin columns required              |

### Key Entities

- **User account**: Existing person record; gains **appearance preference** (light or dark) and optional **GitHub login** (username/handle).
- **Profile settings (logical)**: The subset of user account fields the owner may view and edit on the Profile screen—appearance preference and GitHub login in this feature.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 95% of profile appearance changes complete successfully (saved and reflected on reload) within 3 seconds under normal conditions in acceptance testing.
- **SC-002**: 100% of users who saved dark or light appearance see the same mode after signing in again in automated cross-session tests.
- **SC-003**: 100% of invalid GitHub login submissions are blocked in automated validation tests with user-visible feedback.
- **SC-004**: Signed-in users can set or clear GitHub login from the Profile screen in under 1 minute without support, verified by end-to-end acceptance tests.
- **SC-005**: Zero unauthorized cross-user updates to appearance or GitHub login in security regression tests.

## Assumptions

- **GitHub login** means the public GitHub username (handle), e.g. `octocat`, not OAuth linkage to GitHub and not a full `https://github.com/...` URL.
- GitHub login is **optional**; no requirement to verify ownership against GitHub in this feature.
- **Uniqueness** of GitHub login across users is not required unless product later needs it; duplicate handles may exist across accounts.
- **Administrators** do not need to view or edit other users' GitHub login or theme on the Admin Users screen in this release; only self-service Profile and session identity are in scope.
- Appearance preference applies to the web application shell only; exported reports or email are out of scope.
- Local browser cookie may remain as a fast cache, but the **account record is the source of truth** for signed-in users.
- Default appearance **light** matches current product behavior for users without a saved preference.
- Name and email remain read-only on the Profile screen as today; only appearance and GitHub login are user-editable here.
- Database migration adds nullable or defaulted columns for existing rows without requiring users to sign in again for defaults to apply.
