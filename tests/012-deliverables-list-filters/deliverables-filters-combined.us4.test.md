# US4: Combined filters and reset (backend)

**Automated coverage**: `packages/backend/tests/deliverables/`, `packages/web/tests/deliverables-portfolio-filters/`

## Scenarios

- Date + impact + tags combine with AND on server
- No matches → filtered empty state
- Clear all filters → last 30 days + cleared impact/tags; backend returns default slice
