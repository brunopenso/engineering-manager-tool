# engineering-manager-tool Constitution

## Project Principles

### 1. Code Quality & Type Safety
- **TypeScript**: All code must be written in TypeScript with strict mode enabled (`"strict": true` in tsconfig.json)
- **Type Completeness**: No `any` types without `// @ts-ignore` comments with justification
- **Linting**: All code passes ESLint rules defined in the monorepo
- **Formatting**: Code is formatted with Prettier (if configured) before commits

### 2. Testing Standards
- **Test location**: Inside each package in the `/tests/` folder following the same structure of the `/src` folder
- **Unit Tests**: Minimum 70% code coverage for critical paths
- **Integration Tests**: Backend API endpoints and web components with cross-package dependencies must have integration tests
- **Test Framework**: Use Jest for unit/integration tests; Vitest for Vite-based web tests
- **Test Naming**: Descriptive test names following `should_<action>_when_<condition>` pattern

### 3. Monorepo Structure & Conventions
- **Package Ownership**: Each package (`packages/backend`, `packages/web`) owns its own tests, build, and lint configuration
- **Shared Code**: Minimize shared code between packages; use explicit API contracts if sharing is necessary
- **Dependency Management**: Use Lerna for version management; avoid circular dependencies between packages
- **Build Artifacts**: Generated files go to `dist/` within each package; commit to `.gitignore`

### 4. Backend Package Standards
- **Framework**: Node.js/TypeScript; pinned to Node 24+
- **API Design**: RESTful endpoints with clear request/response schemas
- **Error Handling**: Structured error responses with error codes and messages
- **Documentation**: not need. Use names that have meaning.
- **Database**: postgres with sequelize

### 5. Web Package Standards
- **Framework**: Vite + React/vanilla HTML+CSS+JS depending on requirements
- **Accessibility**: WCAG 2.1 AA minimum compliance
- **Browser Support**: Modern browsers (last 2 versions)
- **Performance**: Lighthouse score 90+ for Performance and Best Practices
- **Component Patterns**: Props are typed; components are functional; side effects use hooks responsibly

### 6. Git & CI/CD Workflow
- **Branching**: Feature branches from `main`; merge via PR with passing checks
- **Commit Messages**: Clear, descriptive; reference issue numbers when applicable
- **Pre-merge Checks**: All linting, tests, and builds must pass before merge
- **Release Process**: Version bumps follow semantic versioning; changelog is updated

### 7. Documentation
- **README**: Each package has a README with setup, build, and run instructions
- **API Docs**: Backend routes documented with request/response examples
- **Architecture Decisions**: Significant architectural choices recorded in ADRs or comments
- **Inline Comments**: Code is self-documenting; comments explain "why" not "what"

### 8. Security & Data Handling
- **No Secrets**: Environment variables for sensitive config; never commit secrets
- **Input Validation**: All external inputs validated before processing
- **Error Messages**: No sensitive information in error responses

### 9. Performance & Scale
- **Backend**: API response time targets <200ms for standard queries
- **Web**: Page load time target <3s on 4G; minimal blocking JavaScript
- **Dependencies**: Minimize bundle size; audit dependencies for security and size

### 10. Engineer Experience
- **Local Development**: `npm install` + `npm run dev` should work with no extra setup
- **Clear Errors**: Build/lint/test failures include actionable error messages
- **Debugging**: Source maps and dev tools enabled in development mode
