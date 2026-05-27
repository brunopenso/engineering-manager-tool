import { describe, expect, it, vi } from 'vitest';
import { AUTH_ERROR_CODES } from '../../src/auth/types.js';
import { createUserByLeader } from '../../src/services/userService.js';
import { AppDataSource } from '../../src/database/connection.js';

describe('duplicate email create guard', () => {
  it('throws validation error when email already exists', async () => {
    const getRepositorySpy = vi.spyOn(AppDataSource, 'getRepository').mockImplementation(
      (_entity) =>
        ({
          findOne: async () => ({ id: 'existing-user' }),
        }) as never,
    );

    await expect(
      createUserByLeader('leader-1', {
        fullName: 'Duplicate',
        email: 'duplicate@example.com',
        role: 'COLLABORATOR',
      }),
    ).rejects.toMatchObject({ name: AUTH_ERROR_CODES.VALIDATION_ERROR });

    getRepositorySpy.mockRestore();
  });
});
