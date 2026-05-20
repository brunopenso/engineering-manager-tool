---
name: Testing Standards
description: Rules for generating unit and integration tests.
applyTo: **/*.test.ts
---

# Testing Guidelines

## Framework & Tools
- Use **Jest** and **ts-jest** for all unit tests.
- Use **React Testing Library** for component tests.
- Use **NSubstitute** or **Jest Mocks** for mocking external dependencies; avoid manual fakes.

## Test Structure
- Follow the **Arrange-Act-Assert (AAA)** pattern for all test cases.
- Name test files using the pattern `<filename>.test.ts`.
- Place tests in a `tests/` directory that mirrors the `src/` directory structure.

## Naming Conventions
- Test method names should follow the pattern: `MethodName_StateUnderTest_ExpectedBehavior`.
- Example: `validatePrice_NegativeValue_ThrowsValueError`.

## Edge Cases & Quality
- Always include tests for **edge cases** like null inputs, empty strings, and boundary values.
- Do not generate tests that rely on the output of other tests; ensure isolation.
- For UI tests (e.g., Playwright or Cypress), use **Page Objects** instead of hardcoded selectors.
