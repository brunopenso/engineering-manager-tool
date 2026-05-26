# Quickstart: Collaborator Deliverables

## Preconditions

- Node.js 24+ and PostgreSQL configured (same as auth, roles, and tags features).
- Administrator tag catalog populated (`005-admin-tags`) so system tags exist for deliverable create flows.
- Authenticated test users: at least one collaborator (owner) and hierarchy fixtures for superior read tests (until org persistence ships).
- On branch `006-collaborator-deliverables`.

## 1. Install dependencies

From repository root:

```bash
npm install
```

## 2. Create and run migration

From repository root:

```bash
npm run db:migration:create --workspace @em-tool/backend -- AddDeliverables
```

Implement migration per `data-model.md`:

- `deliverables` table with owner FK and business impact column
- `deliverable_system_tags` junction (FK to `tags`, RESTRICT on tag delete)
- `deliverable_user_tags` and `deliverable_links` child tables
- Index on `(user_id, updated_at DESC)`

Run migrations:

```bash
npm run db:migration:run --workspace @em-tool/backend
```

## 3. Backend implementation checklist

In `packages/backend`:

- Add entities: `Deliverable`, `DeliverableSystemTag`, `DeliverableUserTag`, `DeliverableLink`
- Register entities in ORM config
- Add `deliverableValidation.ts` and `deliverableService.ts` (transactional CRUD, tag existence checks)
- Extend `authorizationService.ts` with `canReadDeliverablesForOwner` + hierarchy resolver hook
- Add `routes/deliverables.ts` and register in `src/index.ts`
- Add `GET /tags/catalog` (authenticated read) in `routes/tags.ts` or dedicated handler
- Add error codes as needed (e.g. `INVALID_SYSTEM_TAG`, `DELIVERABLE_FORBIDDEN`)
- Integration tests per user story: owner CRUD, validation, peer/superior deny, superior allow with fixtures, non-owner mutate deny

## 4. Web implementation checklist

In `packages/web`:

- Add `deliverablesApi.ts` aligned with `contracts/deliverables-api.yaml`
- Add `DeliverablesPage.tsx` (list, create/edit dialog, delete confirmation) using `frontend-design` skill
- Add read-only `DeliverablesViewPage.tsx` or mode for `/app/deliverables/view/:userId` (superior US5)
- Register routes in `App.tsx`; add `DELIVERABLES_ROUTE` to `shellOptions.ts` base menu
- Vitest: owner flows, validation errors, read-only superior view, peer 403

## 5. Run locally

```bash
npm run dev
```

## 6. Verify acceptance (manual)

### Owner portfolio (US1/US2)

1. Sign in as collaborator.
2. Open `/app/deliverables`.
3. Create deliverable with required fields and at least one system tag from catalog picker.
4. Expect item in list with title and business impact.

### Owner update/delete (US3/US4)

1. Edit description and save; expect updated values.
2. Delete with confirmation; expect removal from list.

### DAC (US5) — with hierarchy fixtures or seeded org data

1. As direct manager, open `/app/deliverables/view/{reportUserId}`.
2. Expect read-only list of report's deliverables.
3. As peer, request same URL or API `GET /users/{peerId}/deliverables`; expect 403.
4. As report, request manager's deliverables; expect 403.

### Tag catalog picker

1. As non-admin collaborator, call `GET /tags/catalog`; expect 200 with tags.
2. Confirm `POST /tags` still returns 403 for non-administrator.

## 7. Automated tests

```bash
npm test --workspace @em-tool/backend
npm test --workspace @em-tool/web
```

Expected: all deliverable and DAC tests pass; no regression on tags admin routes.
