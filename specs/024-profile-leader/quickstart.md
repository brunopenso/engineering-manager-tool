# Quickstart: Profile Assigned Leader

## Prerequisites

- Feature branch `024-profile-leader`
- Node 26, `npm install` from repo root
- Backend and web test commands from workspace `package.json`

## Validation

1. Mapper returns `{ id, fullName }` when `leaderId` points at a user.
2. Mapper returns `null` when `leaderId` is null or the leader row is missing.
3. Profile shows the leader name for a session user with `leader` set.
4. Profile shows “No leader assigned” when `leader` is null.
5. Portuguese catalog includes matching keys (`fields.leader`, `fields.leaderNone`).
6. Leader row is not an input; save still only covers existing editable fields.

## Commands

```bash
npm run test --workspace @em-tool/backend -- tests/024-profile-leader
npm run test --workspace @em-tool/web -- tests/024-profile-leader
```

## Manual check (optional)

1. Sign in as a seeded report (has `leader_id`).
2. Open `/app/profile` — Leader shows the manager’s full name.
3. Sign in as a top-of-org user (`leader_id` null).
4. Open `/app/profile` — Leader shows “No leader assigned”.
