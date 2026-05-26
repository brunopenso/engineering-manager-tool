import { describe, expect, it } from 'vitest';
import { collaboratorLeaderRoles, collaboratorOnlyRoles } from '../test/fixtures/roles.js';
import {
  assertAdministrator,
  isElevatedRole,
  rejectCollaboratorRoleChange,
} from '../services/authorizationService.js';

describe('US3 admin role management guards', () => {
  it('blocks collaborator-only actors from admin operations', () => {
    expect(() => assertAdministrator(collaboratorOnlyRoles)).toThrow();
    expect(() => assertAdministrator(collaboratorLeaderRoles)).toThrow();
  });

  it('rejects invalid collaborator role changes', () => {
    expect(() => rejectCollaboratorRoleChange('COLLABORATOR')).toThrow();
  });

  it('accepts only elevated role identifiers', () => {
    expect(isElevatedRole('LEADER')).toBe(true);
    expect(isElevatedRole('ADMINISTRATOR')).toBe(true);
    expect(isElevatedRole('COLLABORATOR')).toBe(false);
  });
});
