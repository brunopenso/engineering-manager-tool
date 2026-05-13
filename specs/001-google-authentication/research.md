# Research: Google-only Authentication

## Decision 1: Validate Google ID tokens server-side with Google public keys and audience checks
- Decision: Backend will validate Google ID tokens by verifying signature, issuer, expiration, and audience against the configured Google client ID before granting access.
- Rationale: This is the required trust boundary for a backend-authenticated system and prevents forged or replayed tokens from being accepted.
- Alternatives considered:
  - Frontend-only validation: rejected because trust cannot rely on browser-side checks.
  - Introspection through custom auth proxy only: rejected for unnecessary new infrastructure at this stage.

## Decision 2: Keep login page as the only public web route and guard all other routes via auth state
- Decision: Web app will expose a public login route and require authenticated state for every other route, redirecting unauthenticated users to login.
- Rationale: Matches clarified feature scope and minimizes accidental public surface.
- Alternatives considered:
  - Multiple semi-public informational routes: rejected by clarified requirement.
  - Backend-only protection without web route guards: rejected because UX and navigation would still expose protected pages briefly.

## Decision 3: Persist user lifecycle and login audit in PostgreSQL using TypeORM migrations
- Decision: Add User and LoginAudit tables through migrations under database/migrations and map entities in backend source.
- Rationale: Existing backend already uses TypeORM + PostgreSQL; migrations are the existing operational mechanism.
- Alternatives considered:
  - In-memory persistence: rejected because audit and login history must be durable.
  - Separate audit store: rejected as premature complexity for first feature.

## Decision 4: Issue backend session token after successful Google login
- Decision: On successful Google login, backend returns a signed application token representing authenticated session context for protected API calls.
- Rationale: Avoids sending raw Google ID token on every API call and allows consistent authorization checks across backend routes.
- Alternatives considered:
  - Re-validate Google token on every request: rejected due to repeated external key checks and increased latency.
  - Cookie-only session with server-side store: rejected for initial scope because stateless token flow is simpler to ship in this architecture.

## Decision 5: Refactor existing monorepo packages in-place instead of creating new services
- Decision: Implement auth by refactoring existing packages/web and packages/backend with new modules and routes, keeping Lerna workspace boundaries unchanged.
- Rationale: User explicitly requested adapting the existing application and current repo already separates web/backend concerns adequately.
- Alternatives considered:
  - Creating new auth microservice/package: rejected due to unnecessary operational overhead for first feature.
