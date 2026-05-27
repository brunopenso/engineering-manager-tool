import { describe, expect, it } from 'vitest';
import { collaboratorLeaderRoles, collaboratorOnlyRoles } from '../src/test/fixtures/roles.js';
import { hasLeaderRole } from '../src/services/authorizationService.js';

describe('US4 DAC leader role gate', () => {
  it('requires leader role before leader-scoped capabilities', () => {
    expect(hasLeaderRole(collaboratorOnlyRoles)).toBe(false);
    expect(hasLeaderRole(collaboratorLeaderRoles)).toBe(true);
  });
});
