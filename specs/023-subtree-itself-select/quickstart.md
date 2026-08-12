# Quickstart: Hierarchy Subtree and Itself Selection

**Feature**: `023-subtree-itself-select`  
**Date**: 2026-08-12

## Prerequisites

- Node.js 26, dependencies installed (`npm install`)
- PostgreSQL running with migrations applied
- Dev auth enabled (or Google OAuth) with a **leader** user who has a multi-level reporting tree (e.g. Alice → Bob, Carol → Dave)

## What this validates

1. Selecting a person with reports includes their **full subtree** on Team Deliverables, Team Analytics, and Team PR Performance.
2. **"Itself"** limits scope to that person only.
3. Leaf selection remains person-only; cleared selection restores full-team behavior where supported.
4. Out-of-subtree `userId` is denied; peers/superiors never appear.

See [data-model.md](./data-model.md) and [contracts/hierarchy-selection-scope-api.yaml](./contracts/hierarchy-selection-scope-api.yaml) for scope resolution and API shape.

## Local run

```bash
npm run dev
```

- Web: http://localhost:3000
- API: http://localhost:3001

Sign in as a leader with nested reports.

## Manual validation checklist

### Team Deliverables (`/app/leader/team-deliverables`)

1. Open the hierarchy picker — tree still expands/collapses by person.
2. Select **Alice** (has reports) — results include deliverables for Alice **and** all descendants in range.
3. Choose Alice’s **Itself** — results include **only** Alice.
4. Select a leaf (Eve) — only Eve; no separate Itself required.
5. Confirm closed picker label distinguishes Alice team vs Alice Itself.

### Team Analytics (`/app/leader/team-analytics`)

1. With no member selected — full actor team (unchanged).
2. Select Alice (subtree) — charts/aggregates cover Alice + descendants.
3. Switch to Alice Itself — aggregates cover Alice only.
4. Clear selection — returns to full team; no stale `scope`.

### Team PR Performance (`/app/leader/team-pr-performance`)

1. Repeat analytics steps for cards, comparison table, and weekly classification chart.
2. Confirm developer rows only include people in the resolved owner set.

### Access control

1. Request any of the three endpoints with a `userId` outside the leader’s tree → **403**.
2. Non-leader → route/API denied as today.

## Automated tests (after implementation)

```bash
# Backend resolver + endpoint scope behavior
npx vitest run tests/023-subtree-itself-select --workspace @em-tool/backend

# Picker UI, scope labels, i18n parity, consumer wiring
npx vitest run tests/023-subtree-itself-select --workspace @em-tool/web
```

Feature test docs live under `tests/023-subtree-itself-select/` (`subtree-select.us1`, `itself-option.us2`, `scope-feedback.us3`).

## Expected outcomes

| Action                    | Expected owner set                |
| ------------------------- | --------------------------------- |
| Clear / no userId         | All actor descendants             |
| Alice + subtree (default) | Alice, Bob, Carol, Dave (example) |
| Alice + itself            | Alice                             |
| Eve (leaf)                | Eve                               |
| Foreign userId            | 403, no data                      |
