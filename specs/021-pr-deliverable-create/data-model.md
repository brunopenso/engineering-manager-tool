# Data Model: Create Deliverable from Pull Requests

**Feature**: `021-pr-deliverable-create`  
**Date**: 2026-08-11

## Overview

This feature introduces **no new persisted tables**. It reads existing imported pull requests, produces an ephemeral **DeliverableProposal**, and on confirmation persists a normal **Deliverable** via the existing create path (006).

## Existing entities (consumed / written)

### GithubImportedPullRequest (read)

| Field                                                          | Use in this feature                          |
| -------------------------------------------------------------- | -------------------------------------------- |
| `id` (UUID)                                                    | Selection key and analyze request identifier |
| `title`, `body`, `number`, `organization`, `repository`, `url` | Mock proposal text and optional links        |
| `authorGithubLogin`                                            | Role suggestion + authorization              |
| nested `comments` / `reviews`                                  | Authorization (involved eligibility)         |

### Deliverable (write on confirm)

Created with existing fields from 006:

| Field                                                                              | Source in this flow                                     |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `userId`                                                                           | Authenticated user (server-set on `POST /deliverables`) |
| `title`, `description`, `roleInDeliverable`, `businessImpact`, `improvementPoints` | From confirmed proposal                                 |
| `technicalDescription`, `userTags`, `systemTagIds`, `links`                        | From proposal (may be empty / sparse)                   |
| `id`, `createdAt`, `updatedAt`                                                     | Server-generated                                        |

No association row between deliverable and source PRs in v1.

### User (read)

| Field         | Use                                  |
| ------------- | ------------------------------------ |
| `id`          | Auth actor / deliverable owner       |
| `githubLogin` | Authorize PR involvement for analyze |

## Ephemeral / API models (not persisted)

### AnalyzeFromPullRequestsRequest

| Field            | Type   | Validation                                                           |
| ---------------- | ------ | -------------------------------------------------------------------- |
| `pullRequestIds` | UUID[] | Required; min 1; max 50 (practical UI/API guard); unique recommended |

### DeliverableProposal

Non-persisted preview returned by analyze. Field set mirrors `DeliverableCreateRequest`:

| Field                  | Required in proposal | Notes                                 |
| ---------------------- | -------------------- | ------------------------------------- |
| `title`                | yes                  | Mock-derived; ≤ 200                   |
| `description`          | yes                  | Mock-derived; ≤ 5000                  |
| `roleInDeliverable`    | yes                  | `Author` or `Contributor`             |
| `businessImpact`       | yes                  | Default `MEDIUM`                      |
| `improvementPoints`    | yes                  | Placeholder inviting edit             |
| `systemTagIds`         | yes (may be `[]`)    | Empty allowed by current create rules |
| `technicalDescription` | no                   | Optional                              |
| `userTags`             | no                   | Optional derived labels               |
| `links`                | no                   | PR URLs when present                  |

### CreateDeliverableSession (UI only)

| Phase      | Meaning                                         |
| ---------- | ----------------------------------------------- |
| `loading`  | Analyze in flight                               |
| `review`   | Proposal visible; Confirm/Cancel                |
| `creating` | `POST /deliverables` in flight                  |
| `success`  | Deliverable id available; complement link shown |
| `error`    | Recoverable failure; no success claim           |

## State transitions

```text
[idle]
  → user opens Create deliverable with selection
[loading] → analyze OK → [review]
[loading] → analyze fail → [error]
[review] → Cancel/dismiss → [idle] (no deliverable)
[review] → Confirm → [creating]
[creating] → create OK → [success]
[creating] → create fail → [error] (proposal may remain available to retry)
[success] → navigate to /app/deliverables/:id/edit → [idle], clear selection
```

## Validation rules (analyze)

1. Caller authenticated.
2. `pullRequestIds` non-empty and within max size.
3. Every ID must identify an imported PR the caller is authorized to use (author or involved via comment/review).
4. Mock output must satisfy create-time field length/enum constraints so Confirm can succeed without client-side editing in v1.

## Relationships

```text
User ──owns──► Deliverable (on confirm only)
User ──authorized over──► GithubImportedPullRequest[] (analyze input)
DeliverableProposal ──maps to──► DeliverableCreateRequest (no persistence)
```
