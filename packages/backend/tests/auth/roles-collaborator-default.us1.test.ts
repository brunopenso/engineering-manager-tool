import { describe, expect, it } from 'vitest';
import { USER_ROLE_TYPES } from '../../src/auth/types.js';
import { sortRoles } from '../../src/services/roleService.js';

describe('US1 default collaborator role model', () => {
  it('sorts roles with collaborator first', () => {
    const sorted = sortRoles([
      USER_ROLE_TYPES.ADMINISTRATOR,
      USER_ROLE_TYPES.LEADER,
      USER_ROLE_TYPES.COLLABORATOR,
    ]);

    expect(sorted).toEqual([
      USER_ROLE_TYPES.COLLABORATOR,
      USER_ROLE_TYPES.LEADER,
      USER_ROLE_TYPES.ADMINISTRATOR,
    ]);
  });

  it('defaults to collaborator-only shape for new users', () => {
    expect(sortRoles([USER_ROLE_TYPES.COLLABORATOR])).toEqual([
      USER_ROLE_TYPES.COLLABORATOR,
    ]);
  });
});
