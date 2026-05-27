import { describe, expect, it } from 'vitest';
import { USER_ROLE_TYPES } from '../../src/auth/types.js';
import { rejectCollaboratorRoleChange } from '../../src/services/authorizationService.js';

describe('US1 collaborator immutability', () => {
  it('rejects grant or revoke targeting collaborator', () => {
    expect(() => rejectCollaboratorRoleChange(USER_ROLE_TYPES.COLLABORATOR)).toThrow(
      'Collaborator role cannot be granted or revoked',
    );
  });

  it('allows elevated role change validation paths', () => {
    expect(() => rejectCollaboratorRoleChange(USER_ROLE_TYPES.LEADER)).not.toThrow();
    expect(() =>
      rejectCollaboratorRoleChange(USER_ROLE_TYPES.ADMINISTRATOR),
    ).not.toThrow();
  });
});
