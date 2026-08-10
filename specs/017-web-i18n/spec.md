# Feature Specification: Web Internationalization (i18n)

**Feature Branch**: `017-web-i18n`  
**Created**: 2026-06-16  
**Status**: Draft  
**Input**: User description: "lets introduce i18n to the web package. we should install all the packages that we need, change all screens, create files en-US and pt-BR."

## Clarifications

### Session 2026-06-16

- Q: Where should language and date-format preferences be persisted? → A: Server-side user profile attributes (`languagePreference`, `dateFormatPreference`) via the same self-service profile API used for theme preference — not client-side storage.

## User Scenarios & Testing _(mandatory, with required automated tests)_

### User Story 1 - English baseline across the entire web app (Priority: P1)

As any user of the web application, I see every screen, navigation label, button, form field label, validation message, empty state, confirmation dialog, and chart title in **English (United States)** when no other language preference is set, so the product has a consistent default experience.

**Why this priority**: Migrating all existing user-facing copy into a translation system is the foundation; without complete English coverage, no second locale can be validated.

**Automated Test Requirement**: Add tests at `tests/017-web-i18n/english-baseline.us1.test.md` (and corresponding UI tests under `tests/017-web-i18n/`) that render each primary route with a default English locale and assert that no hard-coded user-visible strings remain outside the translation catalog. Coverage MUST include: login, welcome/home, profile, deliverables list/create/edit/view, leader team deliverables, leader team analytics, leader hierarchy management, admin users, admin tags, admin GitHub integration, unavailable option page, and application shell navigation (including role-gated menu sections).

**Frontend Design**: All screens MUST continue to use Material UI layout and accessibility patterns; translated text MUST not break responsive layouts on common desktop widths.

**Acceptance Scenarios**:

1. **Given** a user opens the login screen with the default locale, **When** the page renders, **Then** all visible labels, headings, helper text, and actions are shown in English (United States).
2. **Given** an authenticated collaborator navigates through home, profile, and deliverables flows, **When** each page loads, **Then** every user-visible string on those pages comes from the English translation catalog.
3. **Given** an authenticated leader opens leader-only pages (team deliverables, team analytics, hierarchy management), **When** each page loads, **Then** tab labels, table headers, filters, chart titles, legends, and action buttons are shown in English.
4. **Given** an authenticated administrator opens admin pages (user roles, tags, GitHub integration), **When** each page loads, **Then** all admin UI copy is shown in English.
5. **Given** a user triggers a validation error or empty-state message on any in-scope screen, **When** the message appears, **Then** it is shown in English from the translation catalog rather than as an inline hard-coded string.

---

### User Story 2 - Switch to Brazilian Portuguese (Priority: P1)

As a user who prefers Portuguese, I can choose **Brazilian Portuguese (pt-BR)** and see the same screens and flows fully translated, so I can use the product in my preferred language without missing sections.

**Why this priority**: Delivering pt-BR is an explicit product goal; partial translation would undermine trust and usability for Portuguese-speaking users.

**Automated Test Requirement**: Add tests at `tests/017-web-i18n/portuguese-locale.us2.test.md` validating that switching the active locale to pt-BR updates navigation, page titles, form labels, buttons, table headers, chart labels, modal copy, and common error/empty states across the same route set covered in User Story 1. Tests MUST verify that English and Portuguese catalogs contain matching keys (no missing translations for required UI strings).

**Frontend Design**: Language selection MUST be discoverable from the profile/settings area (alongside existing appearance preferences). Selected language MUST apply immediately across the shell without requiring a full page reload.

**Acceptance Scenarios**:

1. **Given** a logged-in user on the profile page, **When** they select Brazilian Portuguese, **Then** the application shell and current page re-render with Portuguese copy.
2. **Given** the active locale is pt-BR, **When** the user navigates to deliverables, leader, and admin screens they are authorized to access, **Then** all in-scope user-visible strings appear in Portuguese.
3. **Given** the active locale is pt-BR, **When** the user opens dialogs, tabs, and filter controls on leader analytics and team deliverables screens, **Then** labels and helper text appear in Portuguese.
4. **Given** a translation key exists in the English catalog, **When** the Portuguese catalog is loaded, **Then** a Portuguese equivalent is present for every user-facing key required by in-scope screens (no fallback gaps for primary UI).

---

### User Story 3 - Profile preferences persist across visits and devices (Priority: P2)

As a returning user, my language and date-format choices are remembered on my account so I do not have to re-select them every time I sign in, including from a different browser or device.

**Why this priority**: Persistence makes localization practical for daily use; it follows the same expectation users already have for appearance preferences on the profile page.

**Automated Test Requirement**: Add tests at `tests/017-web-i18n/locale-persistence.us3.test.md` covering: first-visit default locale for unauthenticated users, saving `pt-BR` from profile via the self-service profile API, restored `languagePreference` after reload, restored preferences after sign-out and sign-in on the same browser, and restored preferences after sign-in on a fresh browser session (simulating another device).

**Acceptance Scenarios**:

1. **Given** a user has never set a language preference on their account, **When** they open the application before authentication, **Then** the locale defaults to English (United States), or to the browser's preferred language when it is one of the supported locales (`en-US` or `pt-BR`).
2. **Given** a user selects Brazilian Portuguese on the profile page, **When** the change is saved, **Then** the server stores `languagePreference = pt-BR` on the user profile (same persistence model as theme preference).
3. **Given** a user has `languagePreference = pt-BR` on their profile, **When** they reload the application or sign in again later (including from another browser), **Then** the interface loads in pt-BR without requiring another manual selection.
4. **Given** a user changes language from Portuguese back to English on the profile page, **When** they return in a new session, **Then** English is the active locale based on the updated profile value.

---

### User Story 4 - Profile-driven date formatting (Priority: P3)

As a user viewing deliverables, analytics, and filters, I see dates formatted according to my saved **date format preference** (`MDY`, `DMY`, or `YMD`) so date pickers and chart labels match how I expect to read dates, independent of UI language.

**Why this priority**: Translation alone is insufficient; the backend already models date format as a separate profile attribute and users may prefer a format that does not strictly follow their UI language.

**Automated Test Requirement**: Add tests at `tests/017-web-i18n/locale-formatting.us4.test.md` verifying that the same underlying date renders with the correct order for each `dateFormatPreference` value on at least the deliverables date fields, analytics date filter, and chart axis or legend labels that expose dates. Tests MUST also verify that changing date format on the profile page updates formatting after save without stale values.

**Frontend Design**: Date format selection MUST be available on the profile page alongside language and appearance preferences, using the same immediate-apply and save pattern as theme.

**Acceptance Scenarios**:

1. **Given** a user's `dateFormatPreference` is `MDY`, **When** they view a date on deliverables or analytics screens, **Then** the date is shown in month-day-year order.
2. **Given** a user's `dateFormatPreference` is `DMY`, **When** they view the same underlying date, **Then** the date is shown in day-month-year order.
3. **Given** a user's `dateFormatPreference` is `YMD`, **When** they view the same underlying date, **Then** the date is shown in year-month-day order.
4. **Given** the user changes date format on the profile page, **When** the save succeeds, **Then** `dateFormatPreference` is persisted on the user profile and subsequent screens use the new format.
5. **Given** numeric counts appear in charts or tables, **When** the active `languagePreference` is `pt-BR`, **Then** number grouping and decimal separators follow Brazilian conventions; when `en-US`, United States conventions apply.

---

### Edge Cases

- What happens when a translation key is missing in pt-BR? The system MUST fall back to the English string for that key and MUST NOT show raw key names or blank labels to the user.
- How does the app behave for an unsupported browser language (e.g., French)? The system MUST default to English (United States) until the user authenticates; after sign-in, the saved `languagePreference` on the profile takes precedence.
- What happens on the login page before authentication? The login screen uses the browser-matched supported locale or `en-US` default; profile-stored `languagePreference` applies only after sign-in.
- How are dynamic values (user names, emails, tag names, deliverable titles) handled? User-generated and server-provided entity names MUST NOT be translated; only surrounding UI chrome and system labels use the translation catalog.
- What happens when translated text is longer than English (common in Portuguese)? Layout MUST remain usable without clipped primary actions on standard desktop widths.
- Are API error messages translated? Server-generated error text MAY remain in English in v1; only client-owned messages and known error mappings exposed in the UI MUST be localized.
- What happens if saving a profile preference fails? The UI MUST show an error, revert the optimistic change, and keep the last known good profile values (same behavior as theme preference save failures).

## Requirements _(mandatory, with required test coverage)_

### Functional Requirements

- **FR-001**: The web application MUST support exactly two UI languages in v1: **English (United States)** (`en-US`) as the default fallback and **Brazilian Portuguese** (`pt-BR`).
- **FR-002**: The web application MUST maintain separate translation resources for `en-US` and `pt-BR` that contain equivalent keys for all in-scope user-visible strings.
- **FR-003**: Every in-scope screen and shared shell component MUST source user-visible copy from the translation system rather than hard-coded literals. In-scope surfaces include:
  - Authentication: login
  - Collaborator: welcome/home, profile, deliverables list, deliverable create/edit form, deliverable read-only view
  - Leader: team deliverables, team analytics (filters, charts, widgets, legends), hierarchy management (view, assign users, create user tabs and panels)
  - Administration: user roles, tags, GitHub integration
  - Shared: application shell header and navigation (including section titles), unavailable-option page, role-gated empty/denied states shown by the web app, modals, validation messages, buttons, placeholders, and table column headers
- **FR-004**: Users MUST be able to change `languagePreference` from the profile page; the change MUST apply immediately across the shell and MUST be saved to the user profile via the existing self-service profile update API (same pattern as `themePreference`).
- **FR-005**: Users MUST be able to change `dateFormatPreference` (`MDY`, `DMY`, `YMD`) from the profile page; the change MUST apply immediately to date displays and MUST be saved to the user profile via the same self-service profile update API.
- **FR-006**: On sign-in and session refresh, the web application MUST initialize UI language from the authenticated user's `languagePreference` profile attribute; unauthenticated users MUST use `en-US` unless the browser's primary language maps to a supported locale (`en-US` or `pt-BR`).
- **FR-007**: On sign-in and session refresh, the web application MUST initialize date formatting from the authenticated user's `dateFormatPreference` profile attribute.
- **FR-008**: When a pt-BR string is unavailable for a key, the system MUST display the `en-US` string for that key.
- **FR-009**: Dates shown in deliverables and leader analytics flows MUST be formatted using the active `dateFormatPreference`; numeric values MUST use separators appropriate to the active `languagePreference`.
- **FR-010**: Automated tests MUST verify English baseline coverage, Portuguese translations, profile preference persistence, and date/number formatting behavior for the routes listed in FR-003.
- **FR-011**: Backend profile API integration for reading and writing `languagePreference` and `dateFormatPreference` is in scope (fields and validation already exist). Translating backend API error payloads, database content, and external notifications remains out of scope for v1.

### Key Entities

- **Language preference** (`languagePreference`): The user's chosen UI language (`en-US` or `pt-BR`), stored on the user profile and returned in auth/session user payloads.
- **Date format preference** (`dateFormatPreference`): The user's chosen date component order (`MDY`, `DMY`, or `YMD`), stored on the user profile independently of UI language.
- **Locale**: The active UI language derived from `languagePreference` that controls which translation catalog is loaded.
- **Translation catalog**: The collection of named messages for a locale, organized so each user-visible string has a stable key shared across locales.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of in-scope primary routes listed in FR-003 render all user-visible chrome from translation catalogs in both `en-US` and `pt-BR` during automated UI test runs.
- **SC-002**: A user can switch between English and Portuguese on the profile page and see the active screen update in under 2 seconds without a manual browser refresh.
- **SC-003**: 95% of usability test participants who prefer Portuguese can complete core tasks (sign in, open deliverables, open leader analytics, change profile settings) using pt-BR without encountering English-only chrome on those flows.
- **SC-004**: After setting `languagePreference` on the profile, 100% of new authenticated sessions in automated tests restore the saved locale before the first in-app screen is shown, including sessions on a different browser profile simulating another device.
- **SC-005**: Locale-related regression test suite runs as part of standard web package CI and passes on every change touching user-visible copy.

## Assumptions

- The backend user profile already exposes `languagePreference` (`en-US` | `pt-BR`) and `dateFormatPreference` (`MDY` | `DMY` | `YMD`) on auth/session user objects and accepts updates via the self-service profile PATCH endpoint alongside `themePreference`.
- `en-US` is the canonical fallback locale and the source of truth for translation message keys.
- Language and date format are independent profile settings; changing one does not automatically change the other.
- User-generated content (deliverable titles, descriptions, review notes, tag names, person names) remains in the language the author entered; only system UI is translated.
- Initial release supports exactly two UI languages; adding more languages is out of scope for v1.
- Translation files are maintained as parallel `en-US` and `pt-BR` resources checked into the web package repository.
- Pluralization and gendered grammar requirements follow standard library conventions for the two locales; no custom plural rules beyond typical "zero/one/other" patterns are required unless discovered during implementation of specific screens.
