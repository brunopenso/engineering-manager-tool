# Research: Web Internationalization (i18n)

## Decision 1: i18n library stack

- **Decision**: Use `i18next` + `react-i18next` + `i18next-browser-languagedetector` in `@em-tool/web`.
- **Rationale**: De-facto standard for React SPAs; hooks (`useTranslation`) integrate cleanly with functional components; detector handles pre-auth login screen locale from `navigator.language`; `supportedLngs` + `fallbackLng: 'en-US'` satisfy FR-008.
- **Alternatives considered**:
  - `react-intl` (FormatJS): strong formatting but heavier migration for MUI-heavy app; less common in this codebase.
  - Custom context + JSON maps: rejected — reinvents pluralization, interpolation, and detection.

**Target versions** (latest stable at planning time): `i18next@^26`, `react-i18next@^17`, `i18next-browser-languagedetector@^8`. Pin exact versions in `package.json` after `npm install` and verify `npm run lint` / `npm run test` for `@em-tool/web`.

## Decision 2: Translation resource layout

- **Decision**: Directory-per-locale under `packages/web/src/locales/`:
  - `en-US/common.json`, `en-US/shell.json`, `en-US/deliverables.json`, … (namespaced by feature area)
  - `pt-BR/` mirror with identical key structure
  - Register namespaces in `packages/web/src/i18n/config.ts` (`defaultNS: 'common'`, `ns: [...]`).
- **Rationale**: User request for `en-US` and `pt-BR` files; namespaces keep large surface area maintainable and enable incremental migration PRs by area.
- **Alternatives considered**:
  - Single monolithic JSON per locale (rejected: hard to review diffs across ~15 screens).
  - TypeScript translation modules (rejected: no runtime lazy-load benefit for two locales).

## Decision 3: Locale bootstrap and persistence

- **Decision**: Mirror theme bootstrap:
  - **Authenticated**: `AuthLocaleSync` reads `user.languagePreference` from session (`AuthProvider` / `authApi`) and calls `i18n.changeLanguage()` on sign-in, refresh, and profile save — server profile is source of truth (spec clarification 2026-06-16).
  - **Unauthenticated**: `i18next-browser-languagedetector` with `supportedLngs: ['en-US', 'pt-BR']`, `fallbackLng: 'en-US'`, `lookupLocalStorage: false` (no client persistence of language).
- **Rationale**: Matches existing `AuthThemeSync` + `themePreference` pattern; cross-device restore via backend profile (SC-004).
- **Alternatives considered**:
  - `localStorage` for language (rejected by clarification).
  - Cookie cache for language (rejected: theme cookie is display cache only; server wins when authenticated — same rule applies).

## Decision 4: Profile settings API (web wiring)

- **Decision**: Extend web `AuthUser` and `ProfileSettingsUpdate` to include `languagePreference` and `dateFormatPreference`; reuse existing `PATCH /users/me` — **no new backend migration or routes**.
- **Rationale**: Backend entity, migration (`1779770000000-AddUserProfileLocalePreferences`), validation (`userProfileValidation.ts`), mapper (`authUserMapper.ts`), and integration tests already exist (`packages/backend/tests/profile-theme-github/profile-settings-locale.test.ts`). Web types lag behind API.
- **Alternatives considered**:
  - New dedicated locale endpoint (rejected: duplicates profile PATCH semantics).

## Decision 5: Date and number formatting

- **Decision**:
  - Add `packages/web/src/utils/formatDisplayDate.ts` accepting `(date, dateFormatPreference)` → `MDY` | `DMY` | `YMD` order with separators from `Intl` / `languagePreference` (`en-US` vs `pt-BR`).
  - Add `formatDisplayNumber(value, languagePreference)` using `Intl.NumberFormat`.
  - Replace ad-hoc `toLocaleDateString()` / `toLocaleString()` in deliverables, team deliverables, analytics, and review modal.
  - Keep `formatDateInput` in `dateRange.ts` as ISO `YYYY-MM-DD` for API payloads (unchanged).
- **Rationale**: Spec FR-009 separates UI language from date component order; ISO inputs must stay API-stable.
- **Alternatives considered**:
  - Derive date order from `languagePreference` only (rejected: spec requires independent `dateFormatPreference`).

## Decision 6: Material UI localization

- **Decision**: Wrap app with MUI locale from `@mui/material/locale` (`enUS`, `ptBR`) inside `AppThemeProvider` (or sibling provider) driven by active `languagePreference`.
- **Rationale**: Ensures MUI-internal strings (pagination, date pickers if added later) respect UI language; aligns with Principle VIII.
- **Alternatives considered**:
  - English-only MUI internals (rejected: incomplete pt-BR experience for built-in MUI labels).

## Decision 7: String migration strategy

- **Decision**: Phased migration by user story:
  1. i18n infrastructure + profile controls + shell navigation (enables US2/US3).
  2. Login + welcome + profile strings.
  3. Deliverables cluster (list, form, view, filters).
  4. Leader cluster (team deliverables, analytics, hierarchy).
  5. Admin cluster (users, tags, GitHub).
  6. Shared components (modals, empty states, route guards).
- **Rationale**: Each phase is independently testable; avoids one giant PR; satisfies Principle V incremental delivery.
- **Alternatives considered**:
  - Big-bang single PR (rejected: review burden and regression risk).

## Decision 8: Test placement

- **Decision**:
  - Markdown acceptance specs: `tests/017-web-i18n/*.md` (per spec user stories).
  - Executable tests: `packages/web/tests/web-i18n/` (Vitest + Testing Library); extend `renderWithProviders` with `I18nextProvider` / initialized i18n instance.
  - Backend: smoke assertion only that session payloads include locale fields (existing tests); no new backend feature tests unless web wiring reveals a gap.
- **Rationale**: Matches repository convention (`packages/web/tests/<feature>/`) while honoring constitution feature folder under `tests/017-web-i18n/`.
