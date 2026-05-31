# Research: Deliverable Review Notes

## Decision 1: Notes storage on existing `deliverable_reviews` row

- **Decision**: Add nullable `notes` column (`text`) to `deliverable_reviews` via migration. One row per `(deliverable_id, reviewer_user_id)` holds both `reviewed` boolean and optional `notes` text.
- **Rationale**: Feature 010 already introduced this table for per-leader reviewed state; spec extends the same entity; upsert on save keeps reviewed + notes atomic.
- **Alternatives considered**:
  - Separate `deliverable_review_notes` table (rejected: redundant join; same uniqueness key).
  - Notes in client session/localStorage (rejected: fails cross-session persistence FR-004).

## Decision 2: Review notes API surface

- **Decision**:
  - `GET /deliverables/{deliverableId}/review-notes` → `{ deliverableId, notes: string | null, reviewed: boolean, updatedAt: ISO8601 }` for logged-in reviewer only.
  - `PUT /deliverables/{deliverableId}/review-notes` body `{ notes: string }` → same response shape after save.
- **Rationale**: Dedicated endpoints keep notes out of generic deliverable detail payload; explicit leader workflow; easy DAC tests.
- **Alternatives considered**:
  - Extend `PUT /deliverables/{id}/reviewed` with optional notes field (rejected: couples toggle and notes; unclear partial-update semantics).
  - PATCH on deliverable detail (rejected: deliverable detail is read-only for superiors).

## Decision 3: Authorization for review notes

- **Decision**: Require bearer auth, `assertLeaderRole`, load deliverable by id, then `assertCanReadDeliverables(actorUserId, deliverable.userId)`. Return 404 when deliverable missing; 403 on auth deny. Query notes with `WHERE deliverable_id = ? AND reviewer_user_id = actor`.
- **Rationale**: Matches spec FR-013/FR-014 and deliverable detail read path; any authorized superior in chain may read/write own notes uniformly.
- **Alternatives considered**:
  - Reuse `assertUserInLeaderSubtree` only (rejected: narrower than spec deliverable read rules; inconsistent with `GET /deliverables/:id`).
  - Return empty notes without 403 for unauthorized (rejected: information leak about deliverable existence).

## Decision 4: Save semantics and auto-reviewed

- **Decision**: Trim notes input. If trimmed length > 8000 → 400 validation error. On save:
  - Upsert `deliverable_reviews` row for `(deliverableId, reviewerUserId)`.
  - Set `notes` to trimmed string, or `null` when empty after trim.
  - If trimmed notes non-empty → set `reviewed = true`.
  - If trimmed notes empty → do **not** change `reviewed` (preserve existing or default false).
- **Rationale**: Satisfies FR-010/FR-011 (any leader auto-reviewed on writing notes), FR-009 (clear notes), and edge case “clearing notes does not clear reviewed”.
- **Alternatives considered**:
  - Always set reviewed on any save including empty (rejected: conflates clear with review completion).
  - Never auto-reviewed (rejected: contradicts clarified spec).

## Decision 5: Notes tab UX and load timing

- **Decision**: Lazy-load notes when user switches to Notes tab (`activeTab === 1`), not on modal open. Show `CircularProgress` while fetching; multiline MUI `TextField` (minRows 6) with Save button; `Alert` for success/error; preserve draft text on load failure with retry.
- **Rationale**: Avoids extra API call when leaders only view Details tab; meets FR-007 and SC-005.
- **Alternatives considered**:
  - Load notes with deliverable detail in one request (rejected: would require changing deliverable detail contract).
  - Auto-save on blur (rejected: spec requires explicit Save FR-005).

## Decision 6: Table reviewed sync after save

- **Decision**: `TeamDeliverableReviewModal` accepts optional `onReviewedChange?: (deliverableId: string, reviewed: boolean) => void`. `LeaderTeamDeliverablesPage` updates local `deliverables` state when save response includes `reviewed: true`.
- **Rationale**: Immediate table feedback without re-running full team search; satisfies SC-004 UI validation.
- **Alternatives considered**:
  - Re-run `searchTeamDeliverables` after save (acceptable fallback but heavier).
  - Optimistic reviewed only in modal (rejected: table stale until reload).

## Decision 7: Notes max length

- **Decision**: 8000 characters after trim (server-enforced; client mirrors with `inputProps.maxLength` and helper text).
- **Rationale**: Within spec assumption range (4000–8000); sufficient for coaching paragraphs; bounded DB payload.
- **Alternatives considered**:
  - 4000 chars (acceptable but tighter than needed for v1).
  - Unlimited text (rejected: no validation FR-016).

## Decision 8: Reviewed toggle must preserve notes (FR-012)

- **Decision**: Refactor `setDeliverableReviewed(false)` to set `reviewed = false` on the row when `notes` is non-null; delete row only when both `reviewed` would be false and `notes` is null/empty. `setDeliverableReviewed(true)` preserves existing notes.
- **Rationale**: Feature 010 deleted the entire row on unreviewed toggle; spec FR-012 forbids deleting notes when toggling reviewed off.
- **Alternatives considered**:
  - Always delete row on unreviewed (rejected: violates FR-012 once notes column exists).
  - Separate notes table decoupled from reviewed row (rejected: Decision 1).

## Decision 9: Test layout

- **Decision**: Acceptance mapping markdown under `tests/011-deliverable-review-notes/`; executable tests in `packages/backend/tests/deliverable-review-notes/` and `packages/web/tests/deliverable-review-notes/` following feature 010 pattern.
- **Rationale**: Constitution VI feature-based organization.
- **Alternatives considered**:
  - Extend `packages/backend/tests/team-deliverables/` only (rejected: mixes distinct feature scope).
