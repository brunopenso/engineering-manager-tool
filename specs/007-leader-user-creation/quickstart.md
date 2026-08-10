# Quickstart: Leader User Creation

## Preconditions

- Node.js 24+ and PostgreSQL configured.
- Existing authentication flow is operational.
- At least one leader test account and one non-leader account are available.
- Current branch: `007-leader-user-creation`.

## 1. Install dependencies

From repository root:

```bash
npm install
```

## 2. Backend implementation checklist

In `packages/backend`:

- Add/extend leader-only create user route in `src/routes/users.ts`.
- Enforce `isLeader` authorization in route/service boundary.
- In `userService`, set created user's leader relationship to authenticated creator id.
- Ignore/reject conflicting `leaderId` from request payload.
- Persist audit metadata (`createdByUserId` or equivalent audit row) for each successful create.
- If new audit storage is needed, add migration in `database/migrations`.
- Align request/response payloads with `contracts/leader-user-creation-api.yaml`.

## 3. Frontend implementation checklist

In `packages/web`:

- Create leader-only page `LeaderCreateUserPage.tsx` using `frontend-design` skill and Material UI best practices.
- Register route in `App.tsx` and expose it in shell navigation only for leaders.
- Show leader assignment as automatic informational text (not editable field).
- Submit create request through `usersApi.ts` and show success/error feedback states.
- Add guard behavior for non-leader direct route access.

## 4. Run locally

```bash
npm run dev
```

## 5. Manual verification

### Leader happy path

1. Sign in as leader.
2. Open leader-only create user page.
3. Submit valid user data.
4. Confirm created user exists and leader is set to creator leader identity.

### Non-leader deny

1. Sign in as non-leader.
2. Attempt to open create page or call create API.
3. Confirm access is denied and no user is created.

### Assignment integrity

1. As leader, submit create payload containing a different `leaderId` (if API tool is available).
2. Confirm persisted leader is still creator leader (or request is rejected), never the conflicting value.

## 6. Automated tests

```bash
npm test --workspace @em-tool/backend
npm test --workspace @em-tool/web
```

Expected:

- Backend tests pass for leader allow, non-leader deny, and creator-as-leader enforcement.
- Web tests pass for leader screen visibility, submit success, and non-leader guard behavior.
