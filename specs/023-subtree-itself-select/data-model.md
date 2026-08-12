# Data Model: Hierarchy Subtree and Itself Selection

**Feature**: `023-subtree-itself-select`  
**Date**: 2026-08-12

## Overview

No new database tables or migrations. This feature adds a **selection scope** dimension on top of the existing organizational hierarchy (`users.leader_id`) and applies it when resolving which people are included in leader team queries.

## Conceptual entities

### HierarchySelection

| Field    | Type                  | Description                                                                             |
| -------- | --------------------- | --------------------------------------------------------------------------------------- |
| `userId` | UUID (nullable)       | Selected person in actor’s descendant tree; omit = full actor team (screens that allow) |
| `scope`  | `subtree` \| `itself` | How to expand `userId`; ignored when `userId` absent                                    |

**Validation**:

- If `userId` present → must be a descendant of the authenticated leader (not self, not peer, not superior, not other branch).
- If `userId` absent → `scope` MUST be ignored/cleared.
- If `userId` present and `scope` omitted → default `subtree`.
- `scope` values outside the enum → 400 validation error.

### ResolvedOwnerSet

| Field            | Type   | Description                                    |
| ---------------- | ------ | ---------------------------------------------- |
| `ownerUserIds`   | UUID[] | Concrete people whose data is included         |
| `filteredUserId` | UUID?  | Echo of selected root when filtering by person |
| `scope`          | enum?  | Echo of effective scope when `userId` present  |

**Resolution rules**:

| Input                          | `ownerUserIds`                                 |
| ------------------------------ | ---------------------------------------------- |
| no `userId`                    | All descendants of actor                       |
| `userId` + `itself`            | `[userId]`                                     |
| `userId` + `subtree` (default) | `[userId]` ∪ recursive descendants of `userId` |
| leaf `userId` + either scope   | `[userId]`                                     |

Intersection invariant: every ID in `ownerUserIds` MUST be in the actor’s authorized descendant set.

### Shared picker selection (UI)

| Field    | Type                  | Description                |
| -------- | --------------------- | -------------------------- |
| `userId` | string                | Selected hierarchy node id |
| `scope`  | `subtree` \| `itself` | Mode chosen in picker      |

Leaf selection always uses `itself` or `subtree` equivalently; UI may omit showing Itself and still send `subtree` or `itself`.

## Relationships

```text
Leader (actor)
  └── reports… (descendant tree)
        └── Selected person (userId)
              ├── scope=itself  → { person }
              └── scope=subtree → { person + all nested reports }
```

Existing entities unchanged: Deliverable, GitHub PR aggregates, DeliverableReview, etc. Only the **filter set of owner user IDs** changes.

## Team Deliverables row attribution (recommended)

When `ownerUserIds.length > 1`, each result row SHOULD expose:

| Field              | Type   | Description                |
| ------------------ | ------ | -------------------------- |
| `ownerUserId`      | UUID   | Deliverable owner          |
| `ownerDisplayName` | string | Display name for the table |

Single-owner / Itself responses MAY omit these fields for backward compatibility, or always include them for consistency.

## State transitions (picker)

```text
[cleared] --select person with children--> [subtree]
[subtree] --choose Itself--> [itself]
[itself]  --choose person name (team)--> [subtree]
[any]     --clear (if allowed)--> [cleared]
[cleared] --select leaf--> [itself-equivalent single person]
```

## Persistence

None beyond existing `users.leader_id` hierarchy. Scope is request-time only (not stored on the user profile).
