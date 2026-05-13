<!--
Sync Impact Report
Version change: unversioned draft -> 1.0.0
Modified principles:
- 1. Code Quality & Type Safety -> I. Type-Safe Monorepo Ownership
- 2. Testing Standards -> V. Incremental Delivery with Verifiable Outcomes
- 3. Monorepo Structure & Conventions -> I. Type-Safe Monorepo Ownership
- 4. Backend Package Standards -> III. Migration-Backed Data Integrity
- 5. Web Package Standards -> IV. API and UX Contract Fidelity
- 8. Security & Data Handling -> II. Security-First Authentication and Data Handling
Added sections:
- Technical Standards
- Delivery Workflow
Removed sections:
- Numbered "Project Principles" list (replaced with constitutional principle model)
Templates requiring updates:
- ✅ .specify/templates/plan-template.md (reviewed, no updates required)
- ✅ .specify/templates/spec-template.md (reviewed, no updates required)
- ✅ .specify/templates/tasks-template.md (reviewed, no updates required)
- ✅ .specify/templates/commands/*.md (directory not present, no updates required)
- ✅ README.md (reviewed, no constitution reference drift)
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

### II. Security-First Authentication and Data Handling
Authentication decisions MUST be made server-side for protected resources. External
tokens MUST be validated for issuer, audience, expiration, and signature before access
is granted. Secrets MUST be provided through environment configuration and never stored
in source control. Error responses MUST avoid leaking sensitive details.

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
Work MUST be organized into independently deliverable user stories with clear
acceptance checks. Tasks MUST map to functional requirements and measurable success
criteria. Before merge, each changed package MUST pass build and lint checks, and
feature-critical behavior MUST be verified with repeatable validation steps.

Rationale: Incremental delivery reduces risk and ensures each release adds validated
value rather than partial, unverifiable changes.

## Technical Standards

- Runtime stack MUST remain Node.js + TypeScript for backend and Vite + React for web
	unless a documented amendment approves a change.
- PostgreSQL via TypeORM is the authoritative persistence stack for backend features.
- Operational endpoints used for health monitoring MUST be documented when exempt from
	product authentication behavior.
- New dependencies MUST be justified by feature need and reviewed for maintenance and
	security impact.

## Delivery Workflow

- Feature execution order MUST follow: specify -> clarify (as needed) -> plan -> tasks
	-> implement -> analyze.
- Each implementation plan MUST include a Constitution Check gate statement.
- Each tasks document MUST preserve story-based phases and explicit file paths.
- Pull requests MUST include evidence of requirement coverage and validation outcomes.

## Governance

This constitution overrides conflicting local conventions and guidance files for feature
delivery decisions. Amendments require:

1. A documented change proposal describing principle or section impact.
2. Synchronization of affected templates and operational guidance files.
3. A semantic version update using this policy:
	 - MAJOR: Principle removal/redefinition or governance breaking change.
	 - MINOR: New principle/section or materially expanded rule.
	 - PATCH: Clarifications and non-semantic wording improvements.

Compliance review is required during planning and before merge for feature branches.
Any temporary exception MUST be logged in the feature plan Complexity Tracking section
with rationale and explicit expiration criteria.

**Version**: 1.0.0 | **Ratified**: 2026-05-13 | **Last Amended**: 2026-05-13
