<!--
Sync Impact Report
Version change: 1.1.0 -> 1.2.0
Modified principles:
- II. Security-First Authentication and Data Handling -> II. Security-First Authentication, Authorization, and Data Handling
- VI. Mandatory Automated Testing -> VI. Mandatory Automated Testing
Added sections:
- VII. Hierarchical Data Access Control (new principle)
Removed sections:
- None
Templates requiring updates:
- ✅ .specify/templates/plan-template.md (Constitution Check now includes mandatory DAC constraints and tests)
- ✅ .specify/templates/spec-template.md (story and requirement scaffolding now includes access-control coverage)
- ✅ .specify/templates/tasks-template.md (test tasks are mandatory across all stories, including US3)
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

### VI. Mandatory Automated Testing
All new features and changes MUST include automated tests that cover all acceptance
criteria and critical paths. No code may be merged without passing tests for all
affected areas. Test coverage MUST be enforced at the pull request level, and test
failures MUST block merges.

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
- Pull requests MUST include evidence of requirement coverage and validation outcomes,
	including DAC allow/deny evidence when hierarchical data visibility is in scope.

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

**Version**: 1.2.0 | **Ratified**: 2026-05-13 | **Last Amended**: 2026-05-13
