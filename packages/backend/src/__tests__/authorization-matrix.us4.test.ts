import { describe, expect, it } from 'vitest';
import {
  allRoles,
  collaboratorAdminRoles,
  collaboratorLeaderRoles,
  collaboratorOnlyRoles,
} from '../test/fixtures/roles.js';
import {
  hasAdministratorRole,
  hasLeaderRole,
} from '../services/authorizationService.js';

describe('US4 authorization matrix', () => {
  it('allows admin scope check only for administrators', () => {
    expect(hasAdministratorRole(collaboratorOnlyRoles)).toBe(false);
    expect(hasAdministratorRole(collaboratorLeaderRoles)).toBe(false);
    expect(hasAdministratorRole(collaboratorAdminRoles)).toBe(true);
    expect(hasAdministratorRole(allRoles)).toBe(true);
  });

  it('allows leader scope check only when leader role is present', () => {
    expect(hasLeaderRole(collaboratorOnlyRoles)).toBe(false);
    expect(hasLeaderRole(collaboratorLeaderRoles)).toBe(true);
    expect(hasLeaderRole(collaboratorAdminRoles)).toBe(false);
    expect(hasLeaderRole(allRoles)).toBe(true);
  });
});
