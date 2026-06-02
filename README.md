# Engineering Manager Tool

Software for the day-to-day work of engineering managers and their teams.

## What it does

Engineering managers and their teams use this tool to capture deliverables, track
impact and growth, and understand team structure in one place.

Every user is a **collaborator** who manages their own deliverables and profile.
**Leaders** additionally review team deliverables and manage the reporting
hierarchy. **Administrators** configure user roles and the shared tag catalog.

You only see menu options and data your role allows. Leaders read subordinate
deliverables read-only; peers cannot see each other's work; administrators
govern organization-wide settings.

## Capabilities by role

### Collaborator

- Home and profile
- Create, edit, and delete personal deliverables (title, description, role, system tags, business impact, improvement points, and optional metadata)

### Leader

- View and manage reporting hierarchy
- Browse team members' deliverables with date filters and reviewed status

### Administrator

- Manage users and role assignments
- Maintain the organization-wide system tag catalog

## Architecture

TypeScript monorepo (Lerna + npm workspaces):

| Package | Stack | Port |
|---------|-------|------|
| `@em-tool/web` | React 19, Vite 8 | 3000 |
| `@em-tool/backend` | Fastify 5 REST API | 3001 |

PostgreSQL stores application data. Sign-in uses Google OAuth in production; see
the technical docs for local development options.

## Getting started

See [doc/getting-started.md](doc/getting-started.md) for prerequisites, environment
setup, migrations, and running the dev servers. The [doc/](doc/) folder also covers
[development login](doc/development-login.md) for local testing without Google accounts.
