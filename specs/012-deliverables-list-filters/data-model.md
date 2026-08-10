# Data Model: Deliverables Portfolio Filters

No new database tables or migrations. Extends the **owner list query** with server-side filter parameters and UI filter state.

## Existing entities (unchanged persistence)

### Deliverable

| Field                     | Type        | Notes                                      |
| ------------------------- | ----------- | ------------------------------------------ |
| `created_at`              | timestamptz | **Date filter axis**                       |
| `business_impact`         | enum        | Optional filter (OR when multiple)         |
| `deliverable_system_tags` | join        | Optional filter (OR when multiple tag ids) |

## API: GET /deliverables query parameters

| Parameter        | Required | Default            | Notes                                                    |
| ---------------- | -------- | ------------------ | -------------------------------------------------------- |
| `startDate`      | no*      | last 30 days start | `YYYY-MM-DD`; *server defaults if omitted                |
| `endDate`        | no*      | today              | `YYYY-MM-DD`; inclusive end day                          |
| `businessImpact` | no       | —                  | Repeatable or comma-separated; OR semantics              |
| `systemTagIds`   | no       | —                  | Repeatable UUIDs; OR semantics; validate against catalog |

**Combined filter**: AND across provided dimensions. Owner scope: `user_id = authenticated user`.

### Response

`{ deliverables: DeliverableSummary[] }` — each item includes `createdAt`, `businessImpact`, `systemTags`, `updatedAt`.

### Errors

| Condition              | Response        |
| ---------------------- | --------------- |
| `endDate < startDate`  | 400 validation  |
| Unknown `systemTagIds` | 400 invalid tag |

## UI filter state (session-local)

| Field                   | Default      | Notes                                           |
| ----------------------- | ------------ | ----------------------------------------------- |
| `startDate` / `endDate` | Last 30 days | Pre-filled on mount; sent on every list request |
| `selectedImpacts`       | `[]`         | Empty = omit from query                         |
| `selectedTagIds`        | `[]`         | Empty = omit from query                         |

## State transitions

```text
[Load page] --> dates = last 30 days --> GET /deliverables?startDate&endDate

[Change any filter] --> validate dates --> GET /deliverables?...

[Clear all filters] --> reset to last 30 days + clear impact/tags --> GET /deliverables?...

[Delete deliverable] --> refresh with current filter query params
```

## DAC

Unchanged: only owner's rows returned; filter parameters cannot target another user.
