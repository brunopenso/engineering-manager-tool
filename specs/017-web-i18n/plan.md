# Implementation Plan: Web Internationalization (i18n)

**Branch**: `017-web-i18n` | **Date**: 2026-06-16 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/017-web-i18n/spec.md`

## Summary

Introduce **internationalization** to `@em-tool/web` with `en-US` (default) and `pt-BR` translation catalogs, migrate all in-scope screens to `react-i18next`, and wire **server-side profile preferences** (`languagePreference`, `dateFormatPreference`) already persisted by the backend — mirroring the theme bootstrap pattern (`AuthThemeSync`). Add profile controls for language and date format, centralize display date/number formatting, and cover all user stories with feature-scoped automated tests.

**Backend scope**: Web type alignment and profile PATCH usage only; migrations, validation, and session payloads already implemented.

## Technical Context

**Language/Version**: TypeScript (Node.js 24 backend, React 19 frontend)  
**Primary Dependencies**: Vite 8, React Router 7, Material UI 6, **i18next ^26**, **react-i18next ^17**, **i18next-browser-languagedetector ^8** (`frontend-design` skill)  
**Storage**: PostgreSQL `users.language_preference`, `users.date_format_preference` (existing); web JSON locale files under `packages/web/src/locales/`  
**Testing**: Vitest + Testing Library; `tests/017-web-i18n/` (acceptance docs); `packages/web/tests/web-i18n/` (executable)  
**Target Platform**: Browser SPA (`@em-tool/web`) with existing Fastify API  
**Project Type**: Monorepo web application (`packages/web` primary; `packages/backend` read/write profile fields only)  
**Performance Goals**: Locale switch visible within 2 seconds (SC-002); no full page reload on language change  
**Constraints**: Exactly two UI languages; date format independent of language; server profile is source of truth when authenticated; ISO `YYYY-MM-DD` preserved for API date inputs  
**Scale/Scope**: ~13 pages, ~20 component groups, 7 translation namespaces × 2 locales, 2 new profile controls, 2 formatting utilities

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Principle I (Type-Safe Monorepo Ownership): **PASS**. Shared `AuthUser` extended to match `AuthUserResponse`; locale types align with `packages/backend/src/types/profilePreferences.ts`.
- Principle II (Security-First): **PASS**. Locale preferences updated only via authenticated `PATCH /users/me` (self-scope); no new public endpoints.
- Principle III (Migration-Backed Data Integrity): **PASS** (N/A new migration). Existing migration `1779770000000-AddUserProfileLocalePreferences` already applied.
- Principle IV (API and UX Contract Fidelity): **PASS**. Contract delta in `contracts/web-i18n-profile-wiring.yaml`; merge into profile-settings OpenAPI at implement time.
- Principle V (Incremental Delivery): **PASS**. Phased string migration by area (shell → auth → deliverables → leader → admin); stories US1–US4 independently testable.
- Principle VI (Mandatory Automated Testing): **PASS**. Test plan in spec + `quickstart.md`; `packages/web/tests/web-i18n/` + `tests/017-web-i18n/` markdown specs.
- Principle VII (Hierarchical DAC): **PASS** (N/A). i18n does not change data visibility; existing DAC on leader/admin routes unchanged.
- Principle VIII (Frontend Design): **PASS**. Profile locale controls use MUI patterns consistent with appearance toggle; `@mui/material/locale` for pt-BR MUI internals.

**Post-Phase-1 Re-check**: **PASS**. Research, data model, contracts, and quickstart document server-side persistence, namespace layout, and formatting separation.

## Project Structure

### Documentation (this feature)

```text
specs/017-web-i18n/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── web-i18n-profile-wiring.yaml
├── checklists/
│   └── requirements.md
└── tasks.md             # Created by /speckit-tasks
```

### Source Code (repository root)

```text
packages/
├── backend/                                    # No new migrations; existing fields used
│   └── src/types/profilePreferences.ts         # Reference for web types
└── web/
    └── src/
        ├── i18n/
        │   ├── config.ts                       # i18next init
        │   └── index.ts
        ├── locales/
        │   ├── en-US/                          # common, shell, auth, profile, deliverables, leader, admin
        │   └── pt-BR/
        ├── auth/
        │   ├── AuthLocaleSync.tsx              # NEW — session language bootstrap
        │   └── AuthProvider.tsx                # extend AuthUser
        ├── utils/
        │   ├── formatDisplayDate.ts            # NEW
        │   └── formatDisplayNumber.ts          # NEW
        ├── services/
        │   ├── authApi.ts                      # extend AuthUser
        │   └── profileApi.ts                   # extend ProfileSettingsUpdate
        ├── pages/                              # All pages — migrate strings
        ├── components/                         # Shell, leader, admin, team-deliverables, etc.
        ├── routes/shellOptions.ts              # i18n keys for menu labels
        └── test/renderWithProviders.tsx        # i18n test wrapper

tests/017-web-i18n/                             # Acceptance test markdown (US1–US4)
packages/web/tests/web-i18n/                    # Vitest executable tests
```

**Structure Decision**: Web-only implementation surface; backend already exposes locale fields on auth/session and `PATCH /users/me`. Translation assets live in `packages/web/src/locales/` with feature namespaces.

## Complexity Tracking

| Item | Why Needed | Simpler Alternative Rejected Because |
|------|------------|-------------------------------------|
| `react-i18next` stack | 15+ screens, pluralization, interpolation, detection | Inline JSON + context does not scale; no standard fallback |
| Namespaced locale files | Large string surface | Monolithic JSON harms reviewability |
| `AuthLocaleSync` + detector | Pre-auth login vs post-auth profile | Single mechanism cannot satisfy FR-006 |
| Separate `dateFormatPreference` | Spec + backend model | Locale-only formatting ignores user date order choice |

No constitutional violations.

## Phase 0 & Phase 1 Outputs

- [research.md](./research.md) — library choice, file layout, bootstrap, formatting, test placement
- [data-model.md](./data-model.md) — profile fields, web types, namespace mapping
- [contracts/web-i18n-profile-wiring.yaml](./contracts/web-i18n-profile-wiring.yaml) — OpenAPI delta for web alignment
- [quickstart.md](./quickstart.md) — step-by-step implementation and verification

## Implementation Phases (for /speckit-tasks)

| Phase | User story | Deliverables |
|-------|------------|--------------|
| 1 | Setup | npm deps, `i18n/config`, locale dir scaffold, test harness |
| 2 | US3 (partial) + US2 | `AuthUser` types, `profileApi`, `AuthLocaleSync`, profile language/date controls |
| 3 | US1 | English catalogs complete; all screens use `t()` — no hard-coded chrome |
| 4 | US2 | `pt-BR` catalogs parity; shell + page spot checks |
| 5 | US4 | `formatDisplayDate` / `formatDisplayNumber`; replace `toLocaleDateString` usages |
| 6 | Polish | `tests/017-web-i18n/*.md`, `packages/web/tests/web-i18n/*`, contract merge, lint/test CI |

## End-to-End Regression Notes

- Anonymous login page: browser `pt-BR` → Portuguese login copy; unsupported `fr` → `en-US`.
- Profile: switch language → immediate UI update → `PATCH` persists → reload restores from `/auth/me`.
- Cross-browser: user with `pt-BR` on profile signs in on clean browser → Portuguese without manual toggle.
- Date format: `DMY` on profile → deliverables `createdAt` column shows day-first.
- Theme + language + date format saves fail independently with revert (mirror theme error handling).
- Missing pt-BR key → English fallback, no raw key visible.
- Leader/admin routes: DAC unchanged; only label language changes.
