import { describe, expect, it } from 'vitest';
import { collaboratorLeaderRoles, collaboratorOnlyRoles } from '../test/fixtures/roles.js';
import { hasLeaderRole } from '../services/authorizationService.js';

describe('US4 DAC leader role gate', () => {
  it('requires leader role before leader-scoped capabilities', () => {
    expect(hasLeaderRole(collaboratorOnlyRoles)).toBe(false);
    expect(hasLeaderRole(collaboratorLeaderRoles)).toBe(true);
  });
});
