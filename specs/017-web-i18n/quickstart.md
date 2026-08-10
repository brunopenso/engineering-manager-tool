# Quickstart: Web Internationalization (i18n)

## Preconditions

- Node.js 24+, PostgreSQL, branch `017-web-i18n`.
- Backend migration `1779770000000-AddUserProfileLocalePreferences` applied (`npm run db:migration:run --workspace @em-tool/backend`).
- Existing profile PATCH and auth session tests pass (`packages/backend/tests/profile-theme-github/profile-settings-locale.test.ts`).

## 1. Dependencies (web)

From repo root:

```bash
npm install i18next react-i18next i18next-browser-languagedetector --workspace @em-tool/web
```

Verify with:

```bash
npm run lint --workspace @em-tool/web
```

## 2. i18n infrastructure

Create under `packages/web/src/`:

| File                           | Purpose                                                        |
| ------------------------------ | -------------------------------------------------------------- |
| `i18n/config.ts`               | `i18next.init` — resources, `fallbackLng: 'en-US'`, namespaces |
| `i18n/index.ts`                | Re-export initialized instance                                 |
| `locales/en-US/*.json`         | English catalogs (start with `common`, `shell`, `profile`)     |
| `locales/pt-BR/*.json`         | Portuguese mirrors                                             |
| `auth/AuthLocaleSync.tsx`      | Apply `user.languagePreference` on authenticated session       |
| `utils/formatDisplayDate.ts`   | `MDY` / `DMY` / `YMD` display formatting                       |
| `utils/formatDisplayNumber.ts` | `Intl.NumberFormat` by `languagePreference`                    |

Wire in `main.tsx`:

```text
AppThemeProvider
  → I18nextProvider (or import './i18n/config' side-effect before render)
  → BrowserRouter → AuthProvider → App
```

Add `<AuthLocaleSync />` beside `<AuthThemeSync />` in `App.tsx`.

Optional: MUI locale in `AppThemeProvider` from `@mui/material/locale` (`enUS` / `ptBR`).

## 3. Auth and profile API types

Extend web types to match backend:

- `packages/web/src/services/authApi.ts` — `AuthUser.languagePreference`, `dateFormatPreference`
- `packages/web/src/auth/AuthProvider.tsx` — same fields on local `AuthUser`
- `packages/web/src/services/profileApi.ts` — `ProfileSettingsUpdate` optional locale fields

Update test fixtures (`renderWithProviders`, auth mocks) with defaults `en-US` / `MDY`.

## 4. Profile page controls

In `packages/web/src/pages/ProfilePage.tsx`:

- **Language**: `ToggleButtonGroup` or `Select` for `en-US` / `pt-BR`; optimistic `i18n.changeLanguage` + `patchMyProfile`; revert on error (mirror theme handler).
- **Date format**: `ToggleButtonGroup` for `MDY` / `DMY` / `YMD`; `patchMyProfile`; optimistic context or rely on refreshed `user` from `setSession`.

All new labels via `useTranslation('profile')`.

## 5. Migrate user-visible strings

Replace hard-coded strings with `t('key')` by area (see `data-model.md` namespace table):

1. `shellOptions.ts` + shell components
2. `LoginPage`, `WelcomePage`
3. Deliverables pages + related components
4. Leader pages + `components/leader-*`, `team-deliverables/*`
5. Admin pages
6. Remaining shared components

Replace date/number display calls:

- `DeliverablesPage.tsx`, `DeliverablesViewPage.tsx`
- `TeamDeliverableReviewModal.tsx`
- Leader analytics chart labels (where dates shown)

Keep `formatDateInput` for API-bound date fields.

## 6. Tests

### Feature docs

`tests/017-web-i18n/`:

- `english-baseline.us1.test.md`
- `portuguese-locale.us2.test.md`
- `locale-persistence.us3.test.md`
- `locale-formatting.us4.test.md`

### Executable (web)

`packages/web/tests/web-i18n/`:

| Test file                         | Covers                                             |
| --------------------------------- | -------------------------------------------------- |
| `i18n-setup.test.ts`              | i18n init, fallback, namespace load                |
| `profile-locale.us2-us3.test.tsx` | language/date PATCH, session restore, error revert |
| `shell-locale.us1.test.tsx`       | menu labels en vs pt-BR                            |
| `format-display-date.test.ts`     | MDY/DMY/YMD + pt-BR separators                     |
| `login-detector.test.tsx`         | pre-auth browser language detection                |

Extend `packages/web/src/test/renderWithProviders.tsx` to wrap i18n.

## 7. Verify

```bash
npm run lint
npm run test --workspace @em-tool/web
npm run test --workspace @em-tool/backend
npm run dev
```

Manual smoke:

1. Login → profile → switch to **pt-BR** → navigate shell (Portuguese labels).
2. Set date format **DMY** → deliverables list shows day-first dates.
3. Sign out, sign in from another browser profile → language and date format restored from server.

## 8. Contract merge

Merge `contracts/web-i18n-profile-wiring.yaml` fields into `specs/014-profile-theme-github/contracts/profile-settings-api.yaml` `UserProfile` and `ProfileSettingsUpdate` schemas.
