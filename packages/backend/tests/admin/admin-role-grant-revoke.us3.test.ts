import { describe, expect, it } from 'vitest';
import {
  allRoles,
  collaboratorAdminRoles,
  collaboratorLeaderRoles,
} from '../../src/test/fixtures/roles.js';
import {
  hasAdministratorRole,
  hasLeaderRole,
  hasRole,
} from '../../src/services/authorizationService.js';
import { USER_ROLE_TYPES } from '../../src/auth/types.js';

describe('US3 elevated role combinations', () => {
  it('supports collaborator plus leader', () => {
    expect(hasRole(collaboratorLeaderRoles, USER_ROLE_TYPES.COLLABORATOR)).toBe(true);
    expect(hasLeaderRole(collaboratorLeaderRoles)).toBe(true);
    expect(hasAdministratorRole(collaboratorLeaderRoles)).toBe(false);
  });

  it('supports collaborator plus administrator', () => {
    expect(hasRole(collaboratorAdminRoles, USER_ROLE_TYPES.COLLABORATOR)).toBe(true);
    expect(hasAdministratorRole(collaboratorAdminRoles)).toBe(true);
  });

  it('supports all three roles concurrently', () => {
    expect(hasRole(allRoles, USER_ROLE_TYPES.COLLABORATOR)).toBe(true);
    expect(hasLeaderRole(allRoles)).toBe(true);
    expect(hasAdministratorRole(allRoles)).toBe(true);
  });
});
