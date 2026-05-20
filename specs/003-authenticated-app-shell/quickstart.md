# Quickstart: Authenticated Application Shell

## Preconditions
- Node.js 24+ installed.
- Existing Google authentication flow from feature 001 is functional.
- Web and backend dependencies installed from repository root.

## 1. Install dependencies
From repository root:
- npm install

## 2. Start local development
From repository root:
- npm run dev

Expected startup:
- Backend starts and serves auth/session endpoints.
- Web app starts with login route and protected route guards.

## 3. Implement shell route model
In packages/web:
- Define a route configuration for menu options, including exactly one default route.
- Wrap protected routes in a shared shell layout component.
- Keep /login public and keep all shell routes protected.

## 4. Implement shell layout behavior
In packages/web:
- Add fixed top banner with system name.
- Show user email in top-right header area.
- Add left menu control with default collapsed state.
- Expand menu only on explicit user click.
- Auto-collapse menu after option selection.

## 5. Implement logout interaction
In packages/web:
- First click on email reveals inline confirmation action.
- Confirm logs user out and redirects to /login.
- Cancel preserves current route and authenticated session.

## 6. Implement session integrity guard
In packages/web:
- If session token is absent for protected route access, redirect to /login.
- If authenticated session exists but email is missing, redirect to /login before rendering shell content.

## 7. Validate route and menu behavior
- Successful login always lands on configured default shell route.
- Deep-linking directly to a menu option route works for authenticated users.
- Unauthenticated users are redirected to /login from any shell route.
- Selecting any menu option updates URL, updates content, and collapses menu.

## 8. Validate logout behavior
- First click on email does not end session.
- Confirm action ends session and blocks protected routes.
- Cancel action keeps session and current route unchanged.

## 9. Run verification checks
From repository root:
- npm run lint
- npm run build
- npm run test

Suggested automated tests:
- Route guard tests for /login, default route, and deep links.
- Shell layout tests for fixed banner and header identity rendering.
- Interaction tests for menu toggle, auto-collapse, and route updates.
- Session tests for missing-email redirect and inline two-step logout flow.

## 10. Final behavior verification matrix
| Scenario | Expected Result | Automated Coverage |
|---|---|---|
| Open `/` while unauthenticated | Login screen renders | `default-route.us1.test.tsx` |
| Open `/login` while unauthenticated | Login screen renders | `default-route.us1.test.tsx` |
| Open `/app` without token | Redirect to login | `auth-guard.us1.test.tsx` |
| Open `/app` with token but missing email | Redirect to login | `auth-guard.us1.test.tsx` |
| Open `/app` with valid session | Shell renders fixed banner and email | `shell-header.us1.test.tsx` |
| Open `/app/updates` with valid session | Team Updates content renders | `deep-link-routing.us2.test.tsx` |
| Toggle menu | Starts collapsed and expands on click | `menu-toggle.us2.test.tsx` |
| Select menu option | URL/content change and menu collapses | `menu-selection.us2.test.tsx` |
| Click header email once | Inline confirmation appears | `logout-confirm.us3.test.tsx` |
| Confirm logout | Session clears and user returns to login | `logout-confirm.us3.test.tsx` |
| Cancel logout | Session and route remain active | `logout-confirm.us3.test.tsx` |

## 11. Route validation notes
- `/` and `/login` are equivalent public login entry routes.
- `/app` is the fixed authenticated default route after successful login.
- `/app/welcome` is intentionally not exposed as a route; unknown nested `/app/*` paths resolve back to `/app`.
- Contract guard tests assert route invariants via `shell-route-contract.us1/2/3` test suites.

## 12. Final validation outcomes
- `npm run lint`: PASS (`@em-tool/backend`, `@em-tool/web`).
- `npm run build`: PASS (`@em-tool/backend`, `@em-tool/web`).
- `npm run test`: PASS (`@em-tool/web`, 10 test files, 16 tests).
