# engineering-manager-tool
Software for managing the day by day of the engineering manager 

## Authentication Setup (Google-only)

This project uses Google-only authentication with a web login flow and a backend
token validation endpoint.

### Prerequisites

- Node.js 24+
- PostgreSQL instance
- Google OAuth Client ID

### Environment Files

Create local environment files from examples:

- `packages/backend/.env.example`
- `packages/web/.env.example`

Required backend values:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
- `GOOGLE_CLIENT_ID`
- `APP_AUTH_SECRET`
- `APP_AUTH_TOKEN_TTL`

Required web values:

- `VITE_API_BASE_URL`
- `VITE_GOOGLE_CLIENT_ID`

### Install and Run

```bash
npm install
npm run dev
```

### Migrations

```bash
npm run db:migration:run --workspace @em-tool/backend
```

### Expected Auth Behavior

- `/login` is the only public web page.
- `/app` and other non-login web routes require authentication.
- `/healthcheck` and `/healthcheck/complete` remain public for operational checks.
- Successful login redirects to `Welcome to the system`.
