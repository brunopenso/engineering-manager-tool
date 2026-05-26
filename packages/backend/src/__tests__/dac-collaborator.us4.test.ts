import { describe, expect, it } from 'vitest';
import { collaboratorOnlyRoles } from '../test/fixtures/roles.js';
import { canAccessOrganizationalDataForTarget } from '../services/authorizationService.js';

describe('US4 DAC collaborator self-only', () => {
  it('denies organizational data access without leader role context', () => {
    const allowed = canAccessOrganizationalDataForTarget(
      collaboratorOnlyRoles,
      'peer-user-id',
      'self-user-id',
    );

    expect(allowed).toBe(false);
  });
});
