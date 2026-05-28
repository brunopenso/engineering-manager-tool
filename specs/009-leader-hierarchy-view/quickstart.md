# Quickstart: Leader Hierarchy View

## Preconditions

- Node.js 24+ and PostgreSQL configured.
- Authentication flow operational.
- Test data: at least one leader with a direct manager, multi-level reports, and one leader with no manager.
- Branch: `009-leader-hierarchy-view`.

## 1. Install dependencies

From repository root:

```bash
npm install
```

Tree UI uses Material UI `Collapse` + `List` (no `@mui/x-tree-view` dependency; peer resolution conflict with workspace MUI versions).

## 2. Backend checklist

In `packages/backend`:

- Add `getLeaderHierarchyView(actorUserId)` in `userService.ts` (manager hop + recursive descendant CTE + `displayName` fallback).
- Add DTO types in `types/hierarchyView.ts`.
- Register `GET /users/leader/hierarchy-view` in `routes/users.ts` with `assertLeaderForHierarchyManagement`.
- Add tests in `packages/backend/tests/hierarchy-view/` and/or `src/__tests__/hierarchy-view.test.ts`.

## 3. Frontend checklist

In `packages/web`:

- Add `fetchLeaderHierarchyView` to `usersApi.ts`.
- Create `HierarchyTree.tsx` and `LeaderHierarchyViewPage.tsx` using `frontend-design` skill + MUI + `SimpleTreeView`.
- Register route `/app/leader/hierarchy/view` behind `LeaderRoute`.
- Add shell nav entry `leader-hierarchy-view` in `shellOptions.ts` (leaders only).
- Ensure page has no assign/search controls (read-only; management stays on `/app/leader/hierarchy`).
- Initial `expandedItems`: only `self.id`.
- Highlight current position (`isCurrentPosition`).
- Add tests under `packages/web/tests/hierarchy-view/`.

## 4. Run locally

```bash
npm run dev
```

## 5. Manual verification

### Leader with manager and team

1. Sign in as leader with `leaderId` set and nested reports.
2. Open **Hierarchy view** from shell.
3. Confirm manager name appears in “Your manager” section (one person only).
4. Confirm your name is marked as current position.
5. Confirm direct reports visible under you; deeper levels collapsed until expanded.
6. Expand a report with their own team; only their direct reports appear.

### Leader without manager

1. Sign in as top-level leader (`leaderId` null).
2. Open hierarchy view.
3. Confirm no manager section; tree starts at your position.

### Unauthorized

1. Sign in as non-leader collaborator.
2. Navigate to `/app/leader/hierarchy/view`.
3. Confirm redirect/deny with no tree data.
4. Call `GET /users/leader/hierarchy-view` without leader role → 403.

### Read-only

1. On hierarchy view page, confirm no orphan search or assign actions.
2. Management actions remain on `/app/leader/hierarchy` only.

## 6. Automated tests

```bash
npm test --workspace @em-tool/backend -- tests/hierarchy-view
npm test --workspace @em-tool/web -- tests/hierarchy-view
```

Feature test plans (markdown) live under `tests/009-leader-hierarchy-view/`.

Expected coverage:

- Manager limited to one level; no peers or other branches in API/UI.
- Full descendant subtree present.
- `displayName` on every node; email fallback when name blank.
- Initial expand state: only self node expanded.
- Non-leader and unauthenticated deny (SC-001).

## 7. Verification log

- 2026-05-27: Plan aligned to spec FR-001–FR-009; constitution exception documented for single-level manager visibility.
- 2026-05-27: Automated tests passed:
  - `npm test --workspace @em-tool/backend -- tests/hierarchy-view` (7 tests)
  - `npm test --workspace @em-tool/web -- tests/hierarchy-view` (6 tests)
  - `npm run build --workspace @em-tool/web`
