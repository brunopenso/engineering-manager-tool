import { describe, expect, it } from 'vitest';
import { collaboratorOnlyRoles } from '../src/test/fixtures/roles.js';
import {
  assertAdministrator,
  hasAdministratorRole,
} from '../src/services/authorizationService.js';

describe('US2 profile access control', () => {
  it('denies non-administrator access to user directory operations', () => {
    expect(hasAdministratorRole(collaboratorOnlyRoles)).toBe(false);
    expect(() => assertAdministrator(collaboratorOnlyRoles)).toThrow(
      'Administrator role is required',
    );
  });
});
