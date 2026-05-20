# Research: Authenticated Application Shell

## Decision 1: Use route-based navigation for menu options
- Decision: Each left-menu option maps to a dedicated route and updates browser location on selection.
- Rationale: Deep-linkable routes support refresh recovery, direct linking, and deterministic route guard testing.
- Alternatives considered:
  - In-memory panel switching only: rejected due to poor deep-link and reload behavior.
  - Hybrid major-route plus local panels: rejected for initial scope complexity.

## Decision 2: Use a fixed post-login default route
- Decision: All successful logins redirect to one configured default shell route.
- Rationale: Predictable first-load behavior simplifies acceptance tests and user orientation.
- Alternatives considered:
  - Last visited route restore: rejected for v1 due to additional persistence/state handling.
  - Role-first option landing: rejected because role-specific menu visibility is not yet in scope.

## Decision 3: Keep menu collapsed by default and auto-collapse after selection
- Decision: Navigation starts collapsed on initial shell load and collapses again after each option click.
- Rationale: Matches clarified product intent of a menu that is generally closed while preserving intentional discoverability.
- Alternatives considered:
  - Persist open/closed state across navigation: rejected because it conflicts with clarified default behavior.
  - Keep menu open until manual close: rejected for reduced content focus on smaller screens.

## Decision 4: Implement logout as inline two-step confirmation in header
- Decision: Clicking user email reveals inline logout confirmation controls, and only explicit confirm signs out.
- Rationale: Reduces accidental logouts while avoiding modal interruption and preserving route context.
- Alternatives considered:
  - Blocking modal confirmation: rejected based on clarified interaction preference.
  - Single-click logout from dropdown: rejected due to higher accidental sign-out risk.

## Decision 5: Treat missing authenticated email as invalid session state
- Decision: If authenticated session exists but email is missing, redirect immediately to login before rendering shell content.
- Rationale: Email is a required identity element in this shell; missing identity indicates unusable or stale session state.
- Alternatives considered:
  - Fallback account label: rejected by explicit clarification.
  - Display raw user id: rejected as user-unfriendly and inconsistent with shell contract.

## Decision 6: Build shell as reusable layout wrapper around protected routes
- Decision: Introduce a shared shell layout component that renders fixed banner, menu toggle/menu panel, identity actions, and nested route outlet content.
- Rationale: Centralized shell behavior avoids duplication and keeps future menu-option growth incremental.
- Alternatives considered:
  - Duplicating header/menu across pages: rejected due to maintainability risk.
  - Single monolithic page component without nested routes: rejected because route-level composition is cleaner for growth.
