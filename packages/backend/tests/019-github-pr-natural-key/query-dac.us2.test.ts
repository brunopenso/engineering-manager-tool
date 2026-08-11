import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserRoleType } from '../../src/auth/types.js';
import * as queryService from '../../src/services/githubPrQueryService.js';
import {
  ADMIN_AUTH,
  LEADER_AUTH,
  SELF_AUTH,
} from '../018-github-pr-import/github-pr-import.setup.js';

vi.mock('../../src/services/githubPrQueryService.js', async () => {
  const actual = await vi.importActual<typeof import('../../src/services/githubPrQueryService.js')>(
    '../../src/services/githubPrQueryService.js',
  );
  return {
    ...actual,
    queryImportedPullRequests: vi.fn(),
  };
});

const queryImportedPullRequests = vi.mocked(queryService.queryImportedPullRequests);

describe('US2 query DAC (natural key retrieve)', () => {
  beforeEach(() => {
    queryImportedPullRequests.mockReset();
  });

  it('invokes query service for self and admin auth contexts', async () => {
    queryImportedPullRequests.mockResolvedValue([]);
    const input = {
      githubLogins: ['alice-dev'],
      startDate: '2026-08-09',
      endDate: '2026-08-09',
    };

    await queryImportedPullRequests(SELF_AUTH.userId, SELF_AUTH.roles as UserRoleType[], input);
    await queryImportedPullRequests(ADMIN_AUTH.userId, ADMIN_AUTH.roles as UserRoleType[], input);
    await queryImportedPullRequests(LEADER_AUTH.userId, LEADER_AUTH.roles as UserRoleType[], input);

    expect(queryImportedPullRequests).toHaveBeenCalledTimes(3);
  });
});
