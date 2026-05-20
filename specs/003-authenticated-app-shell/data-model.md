# Data Model: Authenticated Application Shell

## Entity: AppShellSessionView (non-persistent)
- Purpose: Represents authenticated context required to render protected shell layout.
- Fields:
  - accessToken: string, required, non-empty.
  - userId: UUID/string, required.
  - email: string, required for shell header rendering.
  - fullName: string, optional for future profile menu labels.
- Validation rules:
  - accessToken must exist for any protected shell route.
  - email must be present; absence triggers redirect to login.

## Entity: NavigationOption (configuration)
- Purpose: Defines each selectable left-menu item and its route target.
- Fields:
  - key: string, unique option identifier.
  - label: string, required display text.
  - routePath: string, required absolute route path.
  - isDefault: boolean, exactly one option true for initial post-login landing.
  - availabilityState: enum (AVAILABLE, UNAVAILABLE).
- Validation rules:
  - routePath values must be unique.
  - exactly one option must be designated as default.
  - unavailable options must map to a defined unavailable-state content view.

## Entity: ShellLayoutState (client state)
- Purpose: Tracks visual behavior of shared shell elements.
- Fields:
  - isMenuExpanded: boolean.
  - activeRoutePath: string.
  - logoutConfirmVisible: boolean.
- Validation rules:
  - isMenuExpanded defaults to false on first shell load.
  - selecting a menu option sets isMenuExpanded to false.
  - logoutConfirmVisible is true only after first click on email action.

## Entity: HeaderIdentityAction (interaction model)
- Purpose: Describes user identity display and logout interaction in top-right header area.
- Fields:
  - displayEmail: string.
  - step: enum (IDLE, CONFIRM_VISIBLE).
  - confirmedLogout: boolean.
- Validation rules:
  - displayEmail derives from AppShellSessionView.email.
  - first click transitions step from IDLE to CONFIRM_VISIBLE without ending session.
  - confirm action terminates session and routes user to login.

## State Transitions
- Login success:
  - Session becomes authenticated with valid email.
  - User is routed to configured default shell route.
  - ShellLayoutState initializes with isMenuExpanded=false and logoutConfirmVisible=false.
- Menu toggle:
  - User toggles menu control to expand options.
- Menu option select:
  - activeRoutePath updates to selected option route.
  - Main content updates to selected route view.
  - isMenuExpanded resets to false.
- Logout flow:
  - First email click sets logoutConfirmVisible=true.
  - Confirm click clears session and redirects to /login.
  - Cancel click sets logoutConfirmVisible=false and keeps active route/session.
- Session integrity failure:
  - If email missing or session expires during protected access, session is treated invalid and user is redirected to /login.
