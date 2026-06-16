# Feature Specification: Web Internationalization (i18n)

**Feature Branch**: `017-web-i18n`  
**Created**: 2026-06-16  
**Status**: Draft  
**Input**: User description: "lets introduce i18n to the web package. we should install all the packages that we need, change all screens, create files en-US and pt-BR."

## User Scenarios & Testing *(mandatory, with required automated tests)*

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

### User Story 3 - Language preference persists across visits (Priority: P2)

As a returning user, my language choice is remembered so I do not have to re-select Portuguese or English every time I sign in.

**Why this priority**: Persistence makes localization practical for daily use; it follows the same expectation users already have for appearance preferences on the profile page.

**Automated Test Requirement**: Add tests at `tests/017-web-i18n/locale-persistence.us3.test.md` covering: first-visit default locale, saving pt-BR from profile, restored locale after reload, and restored locale after sign-out and sign-in on the same browser.

**Acceptance Scenarios**:

1. **Given** a user has never set a language preference, **When** they open the application, **Then** the locale defaults to English (United States), or to the browser's preferred language when it is one of the supported locales (en-US or pt-BR).
2. **Given** a user selects Brazilian Portuguese on the profile page, **When** they reload the application or sign in again later, **Then** the interface loads in pt-BR without requiring another manual selection.
3. **Given** a user changes language from Portuguese back to English, **When** they return in a new session, **Then** English is the active locale.

---

### User Story 4 - Locale-aware formatting for dates and numbers (Priority: P3)

As a user viewing deliverables, analytics, and filters, I see dates and numeric summaries formatted according to my active locale so charts and date pickers feel natural in my region.

**Why this priority**: Translation alone is insufficient for Brazilian users; week labels, date ranges, and count formatting should respect locale conventions.

**Automated Test Requirement**: Add tests at `tests/017-web-i18n/locale-formatting.us4.test.md` verifying that the same underlying date or count renders with locale-appropriate formatting in en-US versus pt-BR on at least the deliverables date fields, analytics date filter, and chart axis or legend labels that expose dates or counts.

**Acceptance Scenarios**:

1. **Given** the active locale is en-US, **When** a user views a date on deliverables or analytics screens, **Then** the date is formatted using United States conventions.
2. **Given** the active locale is pt-BR, **When** a user views the same date, **Then** the date is formatted using Brazilian conventions.
3. **Given** the user switches locale on the profile page, **When** they navigate to a screen that shows formatted dates or counts, **Then** formatting updates to match the newly selected locale without stale formatting from the previous locale.

---

### Edge Cases

- What happens when a translation key is missing in pt-BR? The system MUST fall back to the English string for that key and MUST NOT show raw key names or blank labels to the user.
- How does the app behave for an unsupported browser language (e.g., French)? The system MUST default to English (United States).
- What happens on the login page before authentication? The user MUST still be able to read the login screen in the default or browser-matched supported locale; after sign-in, the saved profile preference takes precedence.
- How are dynamic values (user names, emails, tag names, deliverable titles) handled? User-generated and server-provided entity names MUST NOT be translated; only surrounding UI chrome and system labels use the translation catalog.
- What happens when translated text is longer than English (common in Portuguese)? Layout MUST remain usable without clipped primary actions on standard desktop widths.
- Are API error messages translated? Server-generated error text MAY remain in English in v1; only client-owned messages and known error mappings exposed in the UI MUST be localized.

## Requirements *(mandatory, with required test coverage)*

### Functional Requirements

- **FR-001**: The web application MUST support exactly two locales in v1: **English (United States)** (`en-US`) as the default fallback and **Brazilian Portuguese** (`pt-BR`).
- **FR-002**: The web application MUST maintain separate translation resources for `en-US` and `pt-BR` that contain equivalent keys for all in-scope user-visible strings.
- **FR-003**: Every in-scope screen and shared shell component MUST source user-visible copy from the translation system rather than hard-coded literals. In-scope surfaces include:
  - Authentication: login
  - Collaborator: welcome/home, profile, deliverables list, deliverable create/edit form, deliverable read-only view
  - Leader: team deliverables, team analytics (filters, charts, widgets, legends), hierarchy management (view, assign users, create user tabs and panels)
  - Administration: user roles, tags, GitHub integration
  - Shared: application shell header and navigation (including section titles), unavailable-option page, role-gated empty/denied states shown by the web app, modals, validation messages, buttons, placeholders, and table column headers
- **FR-004**: Users MUST be able to change the active locale from the profile page; the change MUST apply immediately to the shell and subsequent navigation.
- **FR-005**: The system MUST persist each user's locale preference across browser sessions using durable client-side storage (consistent with how appearance preferences survive reloads today).
- **FR-006**: On first visit without a saved preference, the system MUST activate `en-US` unless the browser's primary language maps to a supported locale (`en-US` or `pt-BR`), in which case that supported locale is used.
- **FR-007**: When a pt-BR string is unavailable for a key, the system MUST display the `en-US` string for that key.
- **FR-008**: Dates and numeric values shown in deliverables and leader analytics flows MUST be formatted according to the active locale.
- **FR-009**: Automated tests MUST verify English baseline coverage, Portuguese translations, locale switching, persistence, and formatting behavior for the routes listed in FR-003.
- **FR-010**: Scope is limited to the web user interface package; backend API responses, database content, and email or external notifications are out of scope for v1.

### Key Entities

- **Locale**: A supported language-region identifier (`en-US`, `pt-BR`) that controls which translation resource is active and how dates and numbers are formatted.
- **Translation catalog**: The collection of named messages for a locale, organized so each user-visible string has a stable key shared across locales.
- **Language preference**: The user's chosen locale, stored in durable client-side storage and used to initialize the interface on subsequent visits.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of in-scope primary routes listed in FR-003 render all user-visible chrome from translation catalogs in both `en-US` and `pt-BR` during automated UI test runs.
- **SC-002**: A user can switch between English and Portuguese on the profile page and see the active screen update in under 2 seconds without a manual browser refresh.
- **SC-003**: 95% of usability test participants who prefer Portuguese can complete core tasks (sign in, open deliverables, open leader analytics, change profile settings) using pt-BR without encountering English-only chrome on those flows.
- **SC-004**: After setting a language preference, 100% of returning visits in automated tests restore the saved locale before the first in-app screen is shown (including after sign-out and sign-in on the same browser).
- **SC-005**: Locale-related regression test suite runs as part of standard web package CI and passes on every change touching user-visible copy.

## Assumptions

- Only the web frontend is in scope; backend fields, API error payloads, and third-party authentication widget text are unchanged unless the provider localizes them automatically.
- `en-US` is the canonical fallback locale and the source of truth for message keys.
- Language preference is stored in durable client-side storage for v1 so the web package can ship without mandatory backend API changes; syncing locale to the server-side user profile is optional follow-up work.
- User-generated content (deliverable titles, descriptions, review notes, tag names, person names) remains in the language the author entered; only system UI is translated.
- Initial release supports exactly two locales; adding more languages is out of scope for v1.
- Translation files are maintained as parallel `en-US` and `pt-BR` resources checked into the web package repository.
- Pluralization and gendered grammar requirements follow standard library conventions for the two locales; no custom plural rules beyond typical "zero/one/other" patterns are required unless discovered during implementation of specific screens.
