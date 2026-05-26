# Quickstart: Administrator Tag Management

## Preconditions

- Node.js 24+ and PostgreSQL configured (same as existing auth and roles features).
- Backend running with Google authentication and at least one user with `ADMINISTRATOR` role (see user role profiles quickstart / `BOOTSTRAP_ADMIN_EMAILS`).
- On branch `005-admin-tags` (or feature worktree).

## 1. Install dependencies

From repository root:

```bash
npm install
```

## 2. Create and run migration

From repository root:

```bash
npm run db:migration:create --workspace @em-tool/backend -- AddTags
```

Implement migration in `packages/backend/database/migrations` per `data-model.md`:

- Create `tags` table (`id`, `name`, `color`, `created_at`, `updated_at`).
- Add unique index on `lower(name)`.

Run migrations:

```bash
npm run db:migration:run --workspace @em-tool/backend
```

## 3. Backend implementation checklist

In `packages/backend`:

- Add `Tag` entity under `src/database/entities/Tag.ts`.
- Register entity in TypeORM data source / connection config.
- Add `tagService.ts` (create, list, update, delete, validation, duplicate checks).
- Add `routes/tags.ts` with administrator guard on all handlers.
- Register routes in `src/index.ts`.
- Extend `auth/types.ts` with `DUPLICATE_TAG_NAME` if not already present.
- Add integration tests: admin CRUD success, validation failures, duplicate name, non-admin `403`, not-found update/delete.

## 4. Web implementation checklist

In `packages/web`:

- Add `tagsApi.ts` client aligned with `contracts/tags-api.yaml`.
- Add `AdminTagsPage.tsx` (list, create form, inline edit, delete confirmation) using `frontend-design` skill.
- Add route `/app/admin/tags` wrapped in `AdminRoute` in `App.tsx`.
- Add `ADMIN_TAGS_ROUTE` and shell menu entry in `shellOptions.ts` (visible only for administrators).
- Add Vitest tests: admin page loads catalog, non-admin redirected, create/update/delete flows (mock API).

## 5. Run locally

```bash
npm run dev
```

## 6. Verify acceptance (manual)

### List and create (US1/US2)

1. Sign in as administrator.
2. Open `/app/admin/tags`.
3. Create tag `Platform` with color `#1976D2`.
4. Expect tag appears in list with color swatch.

### Update (US3)

1. Edit tag color to `#E91E63` and save.
2. Expect same tag id with updated color in list.

### Delete (US4)

1. Confirm delete on a tag.
2. Reload page; tag absent.

### Authorization

1. Sign in as collaborator-only user.
2. Navigate to `/app/admin/tags` → redirected away from admin screen.
3. `GET http://localhost:3001/tags` without admin role → `403`.

Example create via API:

```bash
curl -X POST "http://localhost:3001/tags" \
  -H "Authorization: Bearer {adminToken}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Platform","color":"#1976D2"}'
```

## 7. Automated test expectations

- Backend: full CRUD happy path, duplicate name, invalid color, empty name, admin-only guards, persistence after restart (migration + entity round-trip).
- Web: admin route guard, list empty state, form validation messages, delete confirmation.

## 8. Build verification

```bash
npm run build
npm run lint
npm test
```

## 9. UI verification references

- Admin Tags screen path: `/app/admin/tags`
- Expected states to capture in manual QA evidence:
  - Empty catalog state
  - Successful create with color swatch preview
  - Successful inline update
  - Delete confirmation dialog and post-delete empty/list refresh
