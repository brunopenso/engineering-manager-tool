import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLE_TYPES } from '../../src/auth/types.js';
import * as deliverableService from '../../src/services/deliverableService.js';
import * as userService from '../../src/services/userService.js';
import {
  buildTeamDeliverablesTestApp,
  registerTeamDeliverablesTestRoutes,
} from '../team-deliverables/team-deliverables-test-app.js';

vi.mock('../../src/services/deliverableService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/deliverableService.js')>();
  return { ...actual, listTeamDeliverablesForReview: vi.fn() };
});

vi.mock('../../src/services/userService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/userService.js')>();
  return {
    ...actual,
    assertUserInLeaderSubtree: vi.fn(),
    resolveScopedOwnerUserIds: vi.fn(),
  };
});

describe('US1 team deliverables subtree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves subtree owners and returns scoped deliverables payload', async () => {
    const app = buildTeamDeliverablesTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerTeamDeliverablesTestRoutes(app);

    vi.mocked(userService.assertUserInLeaderSubtree).mockResolvedValue(undefined);
    vi.mocked(userService.resolveScopedOwnerUserIds).mockResolvedValue({
      ownerUserIds: ['alice', 'bob', 'carol'],
      filteredUserId: 'alice',
      scope: 'subtree',
    });
    vi.mocked(deliverableService.listTeamDeliverablesForReview).mockResolvedValue([
      {
        id: 'd1',
        title: 'From Bob',
        description: 'desc',
        reviewed: false,
        systemTags: [],
        ownerUserId: 'bob',
        ownerDisplayName: 'Bob',
      },
    ]);

    const response = await app.inject({
      method: 'GET',
      url: '/users/leader/team-deliverables?userId=alice&startDate=2026-07-01&endDate=2026-08-12&scope=subtree',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      ownerUserId: 'alice',
      scope: 'subtree',
    });
    expect(userService.resolveScopedOwnerUserIds).toHaveBeenCalledWith(
      'leader-1',
      'alice',
      'subtree',
    );
    expect(deliverableService.listTeamDeliverablesForReview).toHaveBeenCalledWith(
      ['alice', 'bob', 'carol'],
      'leader-1',
      '2026-07-01',
      '2026-08-12',
    );

    await app.close();
  });
});
