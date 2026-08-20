import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppDataSource } from '../../src/database/connection.js';
import { User } from '../../src/database/entities/User.js';
import { mapUserToAuthResponse } from '../../src/services/authUserMapper.js';
import * as roleService from '../../src/services/roleService.js';
import {
  DEFAULT_DATE_FORMAT_PREFERENCE,
  DEFAULT_LANGUAGE_PREFERENCE,
} from '../../src/types/profilePreferences.js';

vi.mock('../../src/services/roleService.js', () => ({
  loadRolesForUser: vi.fn(),
}));

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'user@example.com',
    fullName: 'Test User',
    themePreference: 'light',
    githubLogin: null,
    languagePreference: DEFAULT_LANGUAGE_PREFERENCE,
    dateFormatPreference: DEFAULT_DATE_FORMAT_PREFERENCE,
    firstLoginAt: new Date('2026-01-01T00:00:00.000Z'),
    lastLoginAt: new Date('2026-01-01T00:00:00.000Z'),
    leaderId: null,
    leader: null,
    ...overrides,
  } as User;
}

describe('mapUserToAuthResponse leader', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(roleService.loadRolesForUser).mockResolvedValue(['COLLABORATOR']);
  });

  it('returns leader summary when leaderId is set', async () => {
    const findOne = vi.fn().mockResolvedValue({ id: 'leader-1', fullName: 'Ada Lovelace' });
    vi.spyOn(AppDataSource, 'getRepository').mockReturnValue({ findOne } as never);

    const result = await mapUserToAuthResponse(buildUser({ leaderId: 'leader-1' }));

    expect(result.leader).toEqual({ id: 'leader-1', fullName: 'Ada Lovelace' });
    expect(findOne).toHaveBeenCalledWith({
      where: { id: 'leader-1' },
      select: { id: true, fullName: true },
    });
  });

  it('uses a preloaded leader relation without querying', async () => {
    const getRepository = vi.spyOn(AppDataSource, 'getRepository');

    const result = await mapUserToAuthResponse(
      buildUser({
        leaderId: 'leader-1',
        leader: { id: 'leader-1', fullName: 'Preloaded Leader' } as User,
      }),
    );

    expect(result.leader).toEqual({ id: 'leader-1', fullName: 'Preloaded Leader' });
    expect(getRepository).not.toHaveBeenCalled();
  });

  it('returns null when no leader is assigned without querying', async () => {
    const getRepository = vi.spyOn(AppDataSource, 'getRepository');

    const result = await mapUserToAuthResponse(buildUser({ leaderId: null }));

    expect(result.leader).toBeNull();
    expect(getRepository).not.toHaveBeenCalled();
  });

  it('returns null when the assigned leader row is missing', async () => {
    const findOne = vi.fn().mockResolvedValue(null);
    vi.spyOn(AppDataSource, 'getRepository').mockReturnValue({ findOne } as never);

    const result = await mapUserToAuthResponse(buildUser({ leaderId: 'missing-leader' }));

    expect(result.leader).toBeNull();
  });
});
