# Implementation Plan: Profile Assigned Leader

**Branch**: `024-profile-leader` | **Date**: 2026-08-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/024-profile-leader/spec.md`

## Summary

Show the signed-in user’s assigned leader on `/app/profile` as a read-only identity field. Extend session `UserProfile` / `AuthUser` with `leader: { id, fullName } | null`, resolved in `mapUserToAuthResponse` from existing `users.leader_id`. Profile displays the leader’s full name or “No leader assigned” / “Nenhum líder atribuído”. No migration; assignment remains in hierarchy management.

## Technical Context

**Language/Version**: TypeScript (Node.js 26 backend, React 19 frontend)
**Primary Dependencies**: Fastify 5, TypeORM, PostgreSQL, React Router, Vite 8, Material UI (`frontend-design` skill), react-i18next
**Storage**: Existing `users.leader_id` (nullable UUID FK); no schema change
**Testing**: Vitest; `packages/backend/tests/024-profile-leader/`; `packages/web/tests/024-profile-leader/`
**Target Platform**: Linux-hosted backend + browser SPA
**Project Type**: Monorepo web application (`packages/backend`, `packages/web`)
**Performance Goals**: Leader name visible when Profile renders from session identity (no extra user-facing wait beyond existing page load)
**Constraints**: Self-only Profile visibility; read-only; mapper must not import `userService` (cycle); empty state when `leader_id` is null or leader row missing
**Scale/Scope**: Mapper + AuthUser types + Profile row + i18n + fixture updates

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Principle I (Type-Safe Monorepo Ownership): **PASS**. Shared `leader` summary on backend `AuthUserResponse` and web `AuthUser`.
- Principle II (Security-First): **PASS**. Leader is loaded server-side for the authenticated user; Profile does not accept a target user id.
- Principle III (Migration-Backed Data Integrity): **PASS**. Reuses existing `leader_id` FK; no new columns.
- Principle IV (API and UX Contract Fidelity): **PASS**. Contract delta extends `UserProfile.leader`; Profile UX matches spec.
- Principle V (Incremental Delivery): **PASS**. US1 name display; US2 empty state; independently testable.
- Principle VI (Mandatory Automated Testing): **PASS**. Mapper tests + Profile UI tests + i18n key parity under feature folders.
- Principle VII (Hierarchical DAC): **PASS**. Users see only their own assigned leader’s public name (self-owned reporting assignment). Profile MUST NOT expose other users’ leaders. Admin `GET /users` already lists users and may include the same identity field as a byproduct of the shared mapper.
- Principle VIII (Frontend Design): **PASS**. Profile Leader row uses existing MUI `Stack`/`Typography` identity pattern via `frontend-design`.
- Principle IX (i18n): **PASS**. `en-US` and `pt-BR` keys for label and empty state; tests cover parity.

**Post-Phase-1 Re-check**: **PASS**. Data model, contract, and quickstart document self-only leader display, null empty state, and no assignment editor on Profile.

## Project Structure

### Documentation (this feature)

```text
specs/024-profile-leader/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── profile-leader-api.yaml
└── tasks.md
```

### Source Code (repository root)

```text
packages/backend/src/services/authUserMapper.ts
packages/web/src/services/authApi.ts
packages/web/src/auth/AuthProvider.tsx
packages/web/src/pages/ProfilePage.tsx
packages/web/src/locales/en-US/profile.json
packages/web/src/locales/pt-BR/profile.json
packages/web/src/test/renderWithProviders.tsx
packages/backend/tests/profile-theme-github/profile-settings.setup.ts
packages/backend/tests/024-profile-leader/
packages/web/tests/024-profile-leader/
specs/004-user-role-profiles/contracts/user-roles-api.yaml
```

**Structure Decision**: Extend the existing session identity mapper rather than a new GET. Profile already renders from `useAuth().user`.

## Complexity Tracking

No constitutional violations.

| Item                         | Why Needed                                      | Simpler Alternative Rejected Because        |
| ---------------------------- | ----------------------------------------------- | ------------------------------------------- |
| Leader lookup in mapper      | Session payloads used by Profile have no extra fetch | Profile-only GET adds a round trip and a new route |
| Shared mapper on admin list  | One identity shape                | Dual mappers would drift `UserProfile`                     |

## Phase 0 & Phase 1 Outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/profile-leader-api.yaml](./contracts/profile-leader-api.yaml)
- [quickstart.md](./quickstart.md)
