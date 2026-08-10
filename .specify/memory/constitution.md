<!--
Sync Impact Report
Version change: 1.4.0 -> 1.5.0
Modified principles:
- None
Added sections:
- Principle IX: Internationalized User Interface (i18n)
- Technical Standards: i18n stack requirement for web UI
Removed sections:
- None
Templates requiring updates:
- ✅ .specify/templates/plan-template.md (Constitution Check now requires i18n for user-visible web UI)
- ✅ .specify/templates/spec-template.md (user stories now include Internationalization requirement)
- ✅ .specify/templates/tasks-template.md (Internationalization Standards section added)
- ⚠ pending .specify/templates/commands/*.md (directory not present in repository; no command templates to update)
- ✅ README.md (no constitution-reference updates required)
Follow-up TODOs:
- None
-->

# engineering-manager-tool Constitution

## Core Principles

### I. Type-Safe Monorepo Ownership

All production code MUST be TypeScript with strict typing enabled at package level.
Each workspace package MUST own its build, lint, and runtime boundaries, and package
dependencies MUST NOT introduce circular references. Shared contracts between backend
and web MUST be explicit and versioned through feature artifacts.

Rationale: Strong typing and explicit ownership prevent hidden coupling in a Lerna
monorepo and keep refactors safe as the codebase grows.

### II. Security-First Authentication, Authorization, and Data Handling

Authentication decisions MUST be made server-side for protected resources. External
tokens MUST be validated for issuer, audience, expiration, and signature before access
is granted. Secrets MUST be provided through environment configuration and never stored
in source control. Authorization checks MUST be explicit at service and route boundaries.
Error responses MUST avoid leaking sensitive details.

Rationale: The product handles identity and operational data, so security controls must
be non-optional and testable.

### III. Migration-Backed Data Integrity

Persistent schema changes MUST be delivered via migration files under
`packages/backend/database/migrations`, paired with corresponding entity updates in backend source.
Critical identity data (for example user records and login audits) MUST enforce unique
and relational integrity at the database level.

Rationale: Database migrations provide reproducible deployments and protect data quality
across local, staging, and production environments.

### IV. API and UX Contract Fidelity

Feature behavior MUST match approved specification outcomes and contract documents.
Backend endpoints, response payloads, and frontend route behavior MUST remain aligned
with the active feature spec clarifications before implementation closes.

Rationale: Keeping contracts and UX behavior synchronized prevents regressions and
misaligned expectations between backend and web changes.

### V. Incremental Delivery with Verifiable Outcomes

Work MUST be organized into independently deliverable user stories with clear acceptance
checks. Tasks MUST map to functional requirements and measurable success criteria.
Before merge, each changed package MUST pass build, lint, and test checks.
Feature-critical behavior MUST be verified with repeatable validation steps, and
automated tests MUST be present for all new or changed functionality.

Rationale: Incremental delivery reduces risk and ensures each release adds validated
value. Automated tests guarantee that each increment is verifiable and regression-free.

### VI. Mandatory Automated Testing and Feature-Based Test Organization

All new features and changes MUST include automated tests that cover all acceptance
criteria and critical paths. No code may be merged without passing tests for all
affected areas. Test coverage MUST be enforced at the pull request level, and test
failures MUST block merges.

Automated tests MUST be stored under a `tests/` directory and organized by feature
folder (for example `tests/<feature-name>/...`). Flat test layouts that mix unrelated
features in a single directory are not allowed. Refactors that move tests to
feature-scoped directories are explicitly compliant and encouraged.

Rationale: Automated tests are essential for preventing regressions, ensuring
requirements are met, and enabling safe, rapid iteration. Mandatory testing discipline
is foundational for quality and maintainability as the codebase evolves.

### VII. Hierarchical Data Access Control

All collaborator and organizational data access MUST enforce a strict top-down
hierarchical visibility model. A user MUST only be allowed to access data for self and
direct or indirect subordinates. Access to peer or superior data MUST be denied.
This restriction MUST be applied uniformly across API endpoints, reports, and data
visualizations with no exceptions.

Where hierarchical reporting chains are used, visibility inheritance MUST be recursive
to any subordinate depth. Feature definitions and tests MUST include explicit allow/deny
cases that validate recursive descendant access and prohibition of peer/superior access.

Rationale: A mandatory downward-only model protects sensitive collaborator information,
prevents lateral data leakage, and provides a consistent, auditable authorization rule
for all product surfaces.

### VIII. Consistent Frontend Design Standards

Every screen, page, form, dashboard, or UI component created for the frontend MUST use
the `frontend-design` skill. Screen implementation MUST follow Material UI best practices
including responsive design, accessibility standards, and modern visual hierarchy.
Before any new screen is merged, design MUST be reviewed for consistency with the
established Material UI design system.

Rationale: A unified skill-driven approach ensures consistent user experience, reduces
design-to-implementation friction, and guarantees accessibility and responsiveness
across all frontend surfaces.

### IX. Internationalized User Interface (i18n)

All user-visible web UI copy MUST be externalized through the established i18n
configuration in `@em-tool/web`. The default locale MUST be `en-US` with a complete
English (United States) translation catalog. A matching `pt-BR` (Brazilian Portuguese)
catalog MUST be maintained for every user-facing key in scope. Hard-coded user-visible
strings in React components, pages, or shared UI utilities are not allowed.

Locale resources MUST live under `packages/web/src/locales/` using the project's
namespace layout. Components MUST resolve copy through `react-i18next` (or the
project's configured i18n wrapper) rather than inline literals. When authenticated,
the server-side user profile `languagePreference` MUST be the source of truth for the
active locale; unauthenticated sessions MUST default to `en-US` or a supported browser
locale (`en-US` or `pt-BR` only). Display formatting for dates and numbers MUST use
centralized formatting utilities so presentation respects profile preferences
independently of UI language.

New or changed frontend features MUST add or update translation keys in both `en-US`
and `pt-BR` before merge. Automated tests MUST verify locale behavior for affected
screens, including key parity between catalogs and absence of hard-coded strings on
in-scope routes.

Rationale: Mandatory i18n configuration ensures the product serves English and
Brazilian Portuguese audiences consistently, prevents translation drift, and keeps
locale behavior testable across the full web surface.

## Technical Standards

- Runtime stack MUST remain Node.js + TypeScript for backend and Vite + React for web
  unless a documented amendment approves a change.
- PostgreSQL via TypeORM is the authoritative persistence stack for backend features.
- Operational endpoints used for health monitoring MUST be documented when exempt from
  product authentication behavior.
- Web user interface internationalization MUST use `i18next` and `react-i18next` with
  locale catalogs under `packages/web/src/locales/` for `en-US` (default) and `pt-BR`.
- Dependencies MUST target the latest stable versions available at implementation time,
  provided compatibility across the repository is preserved. Version selection MUST be
  validated against peer dependencies, runtime constraints, and build/test outcomes.
- New dependencies MUST be justified by feature need and reviewed for maintenance,
  security impact, and compatibility with existing stack constraints.

## Delivery Workflow

- Feature execution order MUST follow: specify -> clarify (as needed) -> plan -> tasks
  -> implement -> analyze.
- Each implementation plan MUST include a Constitution Check gate statement.
- Each tasks document MUST preserve story-based phases and explicit file paths.
- Pull requests MUST include evidence of requirement coverage and validation outcomes,
  including DAC allow/deny evidence when hierarchical data visibility is in scope.
- Pull requests that change user-visible web UI MUST include evidence of `en-US` and
  `pt-BR` translation coverage and locale validation for affected screens.

## Governance

This constitution overrides conflicting local conventions and guidance files for feature
delivery decisions. Amendments require:

1. A documented proposal describing the amendment and its impact on delivery workflow.
2. Synchronization of affected templates and operational guidance files.
3. A semantic version update using this policy:
   - MAJOR: Principle removal/redefinition or governance breaking change.
   - MINOR: New principle/section or materially expanded rule.
   - PATCH: Clarifications and non-semantic wording improvements.

Compliance review is required during planning and before merge for feature branches.
Any temporary exception MUST be logged in the feature plan Complexity Tracking section
with rationale and explicit expiration criteria.

**Version**: 1.5.0 | **Ratified**: 2026-05-13 | **Last Amended**: 2026-06-16
