# Research: Hierarchy Subtree and Itself Selection

**Feature**: `023-subtree-itself-select`  
**Date**: 2026-08-12

## R1 — How should subtree vs person-only be represented on the API?

**Decision**: Add optional query parameter `scope` with enum values `subtree` | `itself`, used together with existing `userId`.

**Rationale**: All three leader endpoints already accept optional or required `userId` and assert subtree membership. A second dimension is required because the same person can mean “team under them” or “only them.” An explicit `scope` keeps URLs readable, stays backward-compatible (see defaults below), and avoids inventing synthetic IDs.

**Defaults**:

- When `userId` is omitted: unchanged — full actor team (analytics / PR performance) or validation error (team deliverables still requires a selection).
- When `userId` is present and `scope` is omitted: treat as `subtree` (matches product default: selecting a name includes the structure below).
- When `userId` is present and `scope=itself`: owner set is `[userId]` only.
- Leaf people: `subtree` and `itself` both resolve to `[userId]`.

**Alternatives considered**:

| Alternative                             | Why rejected                                                             |
| --------------------------------------- | ------------------------------------------------------------------------ |
| Separate endpoint per mode              | Triple surface area; no shared semantics                                 |
| Comma-separated `userIds` from UI       | Moves DAC expansion to the client; easy to under/over-include            |
| Encode mode in path (`/users/:id/team`) | Breaks existing query-style filters; inconsistent with analytics/PR APIs |

## R2 — Where should owner-ID expansion live?

**Decision**: Shared backend helper `resolveScopedOwnerUserIds(actorUserId, userId?, scope?)` used by Team Deliverables, Team Analytics, and Team PR Performance after `assertUserInLeaderSubtree` (when `userId` present).

**Behavior**:

1. No `userId` → all descendant member IDs of the actor (existing `getLeaderTeamMembers` behavior).
2. `userId` + `itself` → `[userId]` (already asserted in actor subtree).
3. `userId` + `subtree` (or default) → `[userId, ...descendantsOf(userId)]` intersected with actor’s authorized descendants (equivalently: descendants of `userId` fetched via the same recursive CTE pattern rooted at `userId`, which are necessarily under the actor once membership is asserted).

**Rationale**: Today analytics and PR performance `resolveOwnerUserIds` collapses any `userId` to a singleton. Centralizing the new logic avoids three divergent implementations and makes DAC tests one place.

**Alternatives considered**:

- Expand only on the frontend and pass many IDs — rejected (DAC and consistency).
- Root expansion always at actor and filter client-side tree — rejected (backend must enforce).

## R3 — Team Deliverables multi-owner listing

**Decision**: Extend `listTeamDeliverablesForReview` to accept one or many owner user IDs (`In(ownerUserIds)`) while preserving date range and per-leader reviewed state.

**Rationale**: Spec requires combined results for a subtree selection. The current function filters `userId: ownerUserId` (singular). Multi-owner is the minimal change; response can keep `ownerUserId` as the selected root (plus optional `scope` echo) or introduce `ownerUserIds` / `scope` in the payload for clarity—contract chooses echoing `userId` + `scope` and returning a flat deliverable list (owners remain identifiable via existing row fields if present, or rows stay unscoped by owner in current DTO—current rows do not include owner id; for subtree UX, adding `ownerDisplayName`/`ownerUserId` on each row is recommended if the table would otherwise mix people without attribution).

**Follow-up product default for mixed table**: Include `ownerUserId` and `ownerDisplayName` on each team-deliverable row when scope may be multi-person so leaders can tell whose deliverable they are reviewing. If existing UI already assumes one owner, show a column only when `scope=subtree` and the resolved set size > 1.

**Alternatives considered**:

- N parallel single-user fetches from the client — rejected.
- Force leaders to open each leaf — rejected (contradicts FR-001).

## R4 — Picker UX for "Itself"

**Decision**: Keep the hierarchy tree; selecting the person’s primary row means **subtree**. For nodes with children, show a nested or adjacent **"Itself"** selectable row/action labeled via i18n. Closed input shows person name plus a short scope suffix/chip (team vs itself).

**Rationale**: Spec keeps hierarchy browsing intact and requires discoverable Itself without forcing leaf users through an extra step. Primary-row = subtree matches the stated default.

**Alternatives considered**:

| Alternative              | Why rejected                                     |
| ------------------------ | ------------------------------------------------ |
| Toggle after selection   | Easy to miss; two-step for the common team case  |
| Itself as default        | Contradicts “select top level → see entire team” |
| Dual radio on every leaf | Noise; leaves have only one meaningful scope     |

## R5 — Cleared selection / “all my team”

**Decision**: Clearing the picker (where supported: analytics, PR performance) clears both `userId` and `scope` and restores full-actor-team behavior. Do not send a stale `scope` without `userId`.

**Rationale**: Spec edge case; matches current optional-filter UX.

## R6 — Authorization edge cases

**Decision**:

- Always `assertUserInLeaderSubtree(actor, userId)` before expansion.
- Subtree expansion rooted at `userId` cannot escape actor tree (descendants of a descendant remain descendants of the actor).
- Out-of-subtree `userId` → 403, empty body semantics unchanged.
- Actor cannot select self via this picker (picker lists reports only)—unchanged.

## R7 — i18n

**Decision**: Add keys under `leader.picker.*` (and any screen-specific empty-state tweaks if needed) in both `en-US` and `pt-BR`. English label **"Itself"**; Portuguese natural equivalent (e.g. **"Somente esta pessoa"** or **"Apenas a pessoa"**—finalize in implementation to match product tone).

**Rationale**: Constitution Principle IX; avoid hard-coded strings in the picker.

## Resolved clarifications

No open `NEEDS CLARIFICATION` items remain after research. Spec assumptions (default subtree, leaf = single select, shared-picker consumers only) are adopted as decisions above.
