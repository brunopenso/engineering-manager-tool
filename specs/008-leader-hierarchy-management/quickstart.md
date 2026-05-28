# Quickstart: Leader Hierarchy Management

## Preconditions

- Node.js 24+ and PostgreSQL configured.
- Authentication flow is operational.
- At least one leader account and one orphan user account exist.
- Current branch: `008-leader-hierarchy-management`.

## 1. Install dependencies

From repository root:

```bash
npm install
```

## 2. Backend implementation checklist

In `packages/backend`:

- Add leader-only orphan-user search endpoint (`GET /users/orphans`) aligned with `contracts/hierarchy-management-api.yaml`.
- Add leader-only assignment endpoint (`POST /users/{userId}/assign-leader`) that sets `leaderId` to authenticated leader.
- Enforce role authorization in route/service boundary.
- Ensure assignment re-validates orphan status at write time.
- Persist assignment audit event on successful assignment.
- Add migration only if audit persistence requires schema changes.

## 3. Frontend implementation checklist

In `packages/web`:

- Create `LeaderHierarchyManagementPage.tsx` using `frontend-design` skill and Material UI best practices.
- Add route registration and leader-only navigation visibility.
- Implement search input supporting partial/full name or email queries.
- Render orphan users list with assignment action and success/error feedback.
- Deny or redirect non-leader direct route access.

## 4. Run locally

```bash
npm run dev
```

## 5. Manual verification

### Leader happy path

1. Sign in as leader.
2. Open hierarchy management page.
3. Search by partial name and verify orphan user appears.
4. Search by partial email and verify orphan user appears.
5. Assign selected orphan user.
6. Confirm assigned user is no longer listed as orphan.

### Unauthorized access deny

1. Sign in as non-leader.
2. Attempt to open hierarchy management page or call orphan search/assign endpoints.
3. Confirm access is denied and no hierarchy change occurs.

### Concurrency safety

1. Open same orphan user in two sessions.
2. Complete assignment in first session.
3. Attempt assignment in second session.
4. Confirm second attempt fails due to no longer orphan.

## 6. Automated tests

```bash
npm test --workspace @em-tool/backend
npm test --workspace @em-tool/web
```

Expected:
- Backend tests pass for leader allow, non-leader deny, and orphan-only assignment enforcement.
- Web tests pass for leader page behavior, search matching expectations, assignment feedback, and non-leader guard behavior.

## 7. Verification Log

- 2026-05-27: Verified implementation scope excludes transfer-leadership and includes only orphan-user search + assignment.
- 2026-05-27: Verified test suites:
  - `npm run test --workspace @em-tool/backend -- tests/hierarchy-management`
  - `npm run test --workspace @em-tool/web -- tests/hierarchy-management`
