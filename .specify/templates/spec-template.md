# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`  
**Created**: [DATE]  
**Status**: Draft  
**Input**: User description: "$ARGUMENTS"

## User Scenarios & Testing _(mandatory, with required automated tests)_

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Automated Test Requirement**: [Describe the automated test(s) and exact file path(s) that will verify this story. Tests MUST live under `tests/<feature-name>/...` and cover all acceptance criteria.]

**Frontend Design**: [If this story includes screen, page, form, or dashboard creation, the implementation MUST use the `frontend-design` skill with Material UI best practices.]

**Internationalization**: [If this story includes user-visible web UI strings, all copy MUST be externalized to `en-US` and `pt-BR` translation catalogs via the established i18n configuration. Tests MUST verify both locales and key parity.]

**Access Control Validation**: [If this story exposes collaborator or organizational data, define explicit allow/deny visibility outcomes for self, direct/indirect subordinates, peers, and superiors.]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Frontend Design**: [If this story includes screen, page, form, or dashboard creation, the implementation MUST use the `frontend-design` skill with Material UI best practices.]

**Internationalization**: [If this story includes user-visible web UI strings, all copy MUST be externalized to `en-US` and `pt-BR` translation catalogs via the established i18n configuration. Tests MUST verify both locales and key parity.]

**Access Control Validation**: [If this story exposes collaborator or organizational data, define explicit allow/deny visibility outcomes for self, direct/indirect subordinates, peers, and superiors.]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 3 - [Brief Title] (Priority: P3)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Frontend Design**: [If this story includes screen, page, form, or dashboard creation, the implementation MUST use the `frontend-design` skill with Material UI best practices.]

**Internationalization**: [If this story includes user-visible web UI strings, all copy MUST be externalized to `en-US` and `pt-BR` translation catalogs via the established i18n configuration. Tests MUST verify both locales and key parity.]

**Access Control Validation**: [If this story exposes collaborator or organizational data, define explicit allow/deny visibility outcomes for self, direct/indirect subordinates, peers, and superiors.]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- What happens when [boundary condition]?
- How does system handle [error scenario]?

## Requirements _(mandatory, with required test coverage)_

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

_All functional requirements MUST be covered by automated tests. Define the test(s) for each requirement below._

_For features that expose collaborator or organizational data, requirements MUST define a hierarchical DAC matrix that allows only self + descendants (recursive) and denies peer/superior visibility for every API endpoint, report, and visualization in scope._

- **FR-001**: System MUST [specific capability, e.g., "allow users to create accounts"]
- **FR-002**: System MUST [specific capability, e.g., "validate email addresses"]
- **FR-003**: Users MUST be able to [key interaction, e.g., "reset their password"]
- **FR-004**: System MUST [data requirement, e.g., "persist user preferences"]
- **FR-005**: System MUST [behavior, e.g., "log all security events"]

_Example of marking unclear requirements:_

- **FR-006**: System MUST authenticate users via [NEEDS CLARIFICATION: auth method not specified - email/password, SSO, OAuth?]
- **FR-007**: System MUST retain user data for [NEEDS CLARIFICATION: retention period not specified]

### Access Control Matrix _(required when data visibility is in scope)_

| Actor                          | Allowed Data Visibility     | Explicitly Denied Visibility       | Validation Notes  |
| ------------------------------ | --------------------------- | ---------------------------------- | ----------------- |
| [e.g., Top leader]             | [self + all descendants]    | [all non-descendants]              | [tests/scenarios] |
| [e.g., Mid leader]             | [self + descendant subtree] | [superiors, peers, other branches] | [tests/scenarios] |
| [e.g., Individual contributor] | [self only]                 | [all other users]                  | [tests/scenarios] |

### Key Entities _(include if feature involves data)_

- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

## Success Criteria _(mandatory)_

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: [Measurable metric, e.g., "Users can complete account creation in under 2 minutes"]
- **SC-002**: [Measurable metric, e.g., "System handles 1000 concurrent users without degradation"]
- **SC-003**: [User satisfaction metric, e.g., "90% of users successfully complete primary task on first attempt"]
- **SC-004**: [Business metric, e.g., "Reduce support tickets related to [X] by 50%"]

## Assumptions

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right assumptions based on reasonable defaults
  chosen when the feature description did not specify certain details.
-->

- [Assumption about target users, e.g., "Users have stable internet connectivity"]
- [Assumption about scope boundaries, e.g., "Mobile support is out of scope for v1"]
- [Assumption about data/environment, e.g., "Existing authentication system will be reused"]
- [Dependency on existing system/service, e.g., "Requires access to the existing user profile API"]
