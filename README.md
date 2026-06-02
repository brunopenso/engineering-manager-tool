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

## Documentation

- [Technical documentation](doc/README.md) — doc index and fast-path setup commands
- [Getting started](doc/getting-started.md) — prerequisites, environment setup, migrations, and dev servers
- [Database](doc/database.md) — creating migrations and seed files
- [Architecture](doc/architecture.md) — monorepo layout, components, and request flow
- [Lerna](doc/lerna.md) — test, lint, migrations, and seeds per package or for the whole monorepo
- [Development login](doc/development-login.md) — local testing without Google accounts
