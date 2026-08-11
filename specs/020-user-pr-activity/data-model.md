# Data Model: User Pull Request Activity

**Feature**: `020-user-pr-activity`  
**Date**: 2026-08-11

## Overview

This feature introduces **no new persisted tables**. It reads imported GitHub pull request entities from 018/019 and presents a **view model** for the logged-in user’s personal activity screen.

## Existing entities (consumed)

### User

| Field         | Notes                                              |
| ------------- | -------------------------------------------------- |
| `id`          | Actor identity from auth session                   |
| `githubLogin` | Nullable; required for activity load (FR-011)      |

### GithubImportedPullRequest

Imported merged PR (018/019). Key fields used by the screen:

| Field               | Screen use                          |
| ------------------- | ----------------------------------- |
| `organization`      | Detail / repo identity              |
| `repository`        | Filter, table, detail               |
| `repositoryId`      | Stable repo key for filter options  |
| `title` / `body`    | Detail modal                        |
| `number`            | Detail                              |
| `changedFilesCount` / `additionsCount` / `deletionsCount` | Detail |
| `sourceBranch` / `targetBranch` | Detail                    |
| `authorGithubLogin` | Owner role + authored chart         |
| `mergedAt`          | Period filter (“PR date”), sort     |
| `url`               | Detail (optional link)              |
| nested `comments`   | Involvement + card counts + modal   |
| nested `reviews`    | Involvement + card counts + modal   |

Natural key / identity rules remain as defined in 019 (repository + PR number / GitHub id). This feature does not change persistence.

### GithubPullRequestComment / GithubPullRequestReview

Used to:

1. Include a PR in the activity set when the actor’s login matches comment author or review reviewer (and they are not the PR author).
2. Count actor-authored comments and actor-submitted reviews for summary cards.
3. Render nested detail in the modal.

## View / API models (not persisted)

### MyActivityQuery

| Field       | Type   | Validation                                      |
| ----------- | ------ | ----------------------------------------------- |
| `startDate` | date   | `YYYY-MM-DD`; inclusive UTC day                 |
| `endDate`   | date   | `YYYY-MM-DD`; must be ≥ `startDate`             |

Login is **not** a request field; it is resolved from the authenticated user.

### MyActivityPullRequest (response item)

Extends the existing imported PR DTO shape with:

| Field              | Type                    | Rules                                                                 |
| ------------------ | ----------------------- | --------------------------------------------------------------------- |
| `involvementRole`  | `owner` \| `involved`   | `owner` if actor login matches author; else `involved`                |
| (all PR fields)    | as 018/019 DTO          | Including nested `comments` and `reviews`                             |

**Inclusion rule** (server): PR is returned iff `mergedAt` day ∈ [startDate, endDate] **and** actor login matches author **or** any comment author **or** any review reviewer (case-insensitive normalize).

### Client-derived aggregates (not API contracts)

| Concept                 | Derivation                                                                 |
| ----------------------- | -------------------------------------------------------------------------- |
| Repository options      | Distinct `organization/repository` (or `repositoryId`) from period results |
| Repository filter       | Client filter of the activity list                                         |
| Authored weekly series  | Count PRs with `involvementRole === 'owner'` bucketed by UTC week of `mergedAt` |
| Comment card            | Count comments where comment author login = actor                          |
| Review card             | Count reviews where reviewer login = actor                                 |
| Table rows              | Filtered list sorted by `mergedAt` descending                              |

## Validation rules

- Unauthenticated → deny.
- Authenticated without `githubLogin` → empty activity / guidance state (no cross-user fallback).
- Invalid date range → 400.
- Self-only: never accept another user’s login; never return PRs solely because a subordinate authored them unless the actor is also involved via author/comment/review match on **their** login.

## State transitions

None. Read-only view over imported data.
