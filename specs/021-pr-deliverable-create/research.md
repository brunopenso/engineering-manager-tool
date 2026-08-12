# Research: Create Deliverable from Pull Requests

## Decision 1: Two-step flow — analyze (mock) then reuse existing create

- **Decision**: Add `POST /deliverables/from-pull-requests/analyze` that validates selected PR UUIDs against the authenticated user’s authorized imported PR set and returns a non-persisted **proposal** shaped like `DeliverableCreateRequest`. On Confirm, the web client calls existing `POST /deliverables` with that proposal body. Do **not** call a live LLM; analysis is a deterministic mock service.
- **Rationale**: Spec requires review-before-persist (FR-006) and mocked analysis (FR-005). Reusing create keeps validation, ownership attribution, and DAC mutate rules in one place (006) and avoids a second create path.
- **Alternatives considered**:
  - Dedicated confirm endpoint that creates in one shot (rejected: duplicates create validation/ownership logic).
  - Client-only mock without backend analyze (rejected: FR-010 requires server-side rejection of foreign PR IDs; analysis must be authoritative).
  - Live LLM now (rejected: explicit out of scope).

## Decision 2: Authorization for selected pull requests

- **Decision**: For analyze, load each `GithubImportedPullRequest` by UUID and assert the actor’s GitHub login (from `auth.userId`) matches **author OR any nested comment author OR any nested review reviewer** (same inclusion rule as `my-activity`). If any ID is missing or unauthorized → `403` (or `404` if preferred for existence hiding — use `403` with generic message for consistency with other mutate denials, without leaking foreign PR existence details beyond “not allowed”). Empty `pullRequestIds` → `400`.
- **Rationale**: Matches FR-010 / DAC matrix (self-only PR input). Aligns with 020 involvement semantics so involved PRs remain valid selection inputs per Assumptions.
- **Alternatives considered**:
  - Authored-only eligibility (rejected: Assumptions allow authored or involved).
  - Trust client without server re-check (rejected: security).

## Decision 3: Mock proposal generation rules

- **Decision**: Deterministic mock builds:
  - `title`: from first PR title, truncated to 200; if multiple, suffix like ` (+N more)` within limit.
  - `description`: short summary listing selected PR titles/repos (and truncated bodies when present), max 5000.
  - `roleInDeliverable`: `Author` if any selected PR has actor as author; else `Contributor`.
  - `businessImpact`: `MEDIUM` default.
  - `improvementPoints`: fixed placeholder string inviting the user to complement on edit.
  - `technicalDescription`: optional concatenation of repo names / branch hints when available.
  - `systemTagIds`: `[]` (allowed by current create validation).
  - `userTags`: optional short tags derived from repository names (sanitized).
  - `links`: selected PR `url` values when present (`http`/`https`), labels from `#number title` truncated.
- **Rationale**: Always produces a create-valid payload (FR assumption); empty system tags match current deliverable validation (implementation of 006 allows `[]`).
- **Alternatives considered**:
  - Require seeding a default catalog tag into every proposal (rejected: unnecessary given empty tags are valid today; fixtures stay simpler).
  - Random/varied mock output (rejected: flaky tests).

## Decision 4: Extend existing My Pull Requests selection UI

- **Decision**: Reuse existing `selectedIds: Set<string>` and table checkboxes from the reclassify work on `MyPullRequestsPage`. Add a **Create deliverable** button enabled when `selectedIds.size > 0` (same enablement rule as Change Classification). Open a new `CreateDeliverableFromPrsModal` on click.
- **Rationale**: Spec US1/FR-001–FR-002; checkboxes already ship — do not rebuild selection.
- **Alternatives considered**:
  - Separate selection mode for deliverable vs reclassify (rejected: one selection set is clearer).
  - New page for the flow (rejected: spec extends My Pull Requests).

## Decision 5: Modal lifecycle (loading → proposal → success)

- **Decision**: Single MUI `Dialog` with phases: `loading` | `review` | `creating` | `success` | `error`. Loading calls analyze; review shows proposal fields (read-only summary) + Confirm/Cancel; Confirm calls `POST /deliverables` then shows success with link to `/app/deliverables/:id/edit`; Cancel/dismiss closes without create. Clear `selectedIds` on successful create. Guard Confirm against double-submit (`creating` phase disables actions).
- **Rationale**: Matches US2/US3 and ChangeClassificationModal patterns; edit route is the established complement surface (`DeliverableFormPage` mode=edit).
- **Alternatives considered**:
  - Navigate immediately on create without success step (rejected: FR-009 requires complement link first).
  - Navigate to list only (rejected: user asked to open the deliverable).

## Decision 6: No PR↔deliverable persistence in v1

- **Decision**: Do not add a join table or FK from deliverable to imported PRs. Selected PRs are analyze input only; PR URLs may appear as deliverable `links`.
- **Rationale**: Spec Assumptions; Principle III avoids speculative schema.
- **Alternatives considered**:
  - Many-to-many association table (deferred; useful later for analytics).

## Decision 7: No schema migration

- **Decision**: No new columns/tables. Create uses existing `deliverables` (+ tags/links) persistence.
- **Rationale**: Proposal is ephemeral; create reuses 006 schema.
- **Alternatives considered**:
  - Draft deliverable status column (rejected: no draft entity in product; proposal is modal-only).

## Decision 8: API placement and OpenAPI contract

- **Decision**: Place analyze under deliverables routes (`packages/backend/src/routes/deliverables.ts`) with service `deliverableFromPrsService` (or similar) that loads PRs + runs mock. Contract file: `specs/021-pr-deliverable-create/contracts/pr-deliverable-create-api.yaml`. Document that create remains `POST /deliverables` from 006.
- **Rationale**: Outcome is a deliverable proposal; keeps GitHub PR routes focused on import/query/reclassify.
- **Alternatives considered**:
  - Nested under `/github-pull-requests/...` (acceptable but weaker domain fit).

## Decision 9: i18n

- **Decision**: Extend `prActivity` namespace with a `createDeliverable` key group (button, modal phases, field labels, errors, success CTA) in `en-US` and `pt-BR`. Reuse shared Cancel/Confirm patterns where keys already exist only if semantically identical; prefer feature-local keys for clarity.
- **Rationale**: Constitution IX; feature lives on the PR activity screen.
- **Alternatives considered**:
  - New `prDeliverable` namespace (rejected: extra registration for a modal on the same page).

## Decision 10: Testing layout

- **Decision**: Feature docs under `tests/021-pr-deliverable-create/`; backend Vitest under `packages/backend/tests/021-pr-deliverable-create/`; web Vitest under `packages/web/tests/021-pr-deliverable-create/`. Cover analyze DAC, mock shape, cancel/no-create, confirm→create→edit link, button enablement, i18n parity.
- **Rationale**: Constitution VI.
- **Alternatives considered**:
  - Fold into 020 test folders (rejected: different feature number and deliverable create scope).

## Decision 11: Frontend design skill

- **Decision**: Implement modal and toolbar button with the `frontend-design` skill and Material UI `Dialog` / `Button` / `CircularProgress` / read-only field layout consistent with `ChangeClassificationModal` and deliverable form field naming.
- **Rationale**: Constitution VIII; page already MUI-based.
