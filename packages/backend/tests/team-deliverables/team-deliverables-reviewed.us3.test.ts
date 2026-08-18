import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLE_TYPES } from '../../src/auth/types.js';
import * as deliverableReviewService from '../../src/services/deliverableReviewService.js';
import * as deliverableService from '../../src/services/deliverableService.js';
import * as userService from '../../src/services/userService.js';
import {
  buildTeamDeliverablesTestApp,
  registerTeamDeliverablesTestRoutes,
} from './team-deliverables-test-app.js';

vi.mock('../../src/services/userService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/userService.js')>();
  return {
    ...actual,
    assertUserInLeaderSubtree: vi.fn(),
    resolveScopedOwnerUserIds: vi.fn(async (_actor, userId, scope) => {
      if (!userId) {
        return { ownerUserIds: [] };
      }
      return {
        ownerUserIds: [userId],
        filteredUserId: userId,
        scope: scope ?? 'subtree',
      };
    }),
  };
});

vi.mock('../../src/services/deliverableService.js', () => ({
  getDeliverableById: vi.fn(),
}));

vi.mock('../../src/services/deliverableReviewService.js', () => ({
  setDeliverableReviewed: vi.fn(),
}));

describe('US3 deliverable reviewed toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists reviewed=true for authorized leader', async () => {
    const app = buildTeamDeliverablesTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerTeamDeliverablesTestRoutes(app);

    vi.mocked(deliverableService.getDeliverableById).mockResolvedValue({
      id: 'del-1',
      userId: 'report-1',
    } as Awaited<ReturnType<typeof deliverableService.getDeliverableById>>);
    vi.mocked(userService.assertUserInLeaderSubtree).mockResolvedValue(undefined);
    vi.mocked(deliverableReviewService.setDeliverableReviewed).mockResolvedValue({
      deliverableId: 'del-1',
      reviewed: true,
    });

    const response = await app.inject({
      method: 'PUT',
      url: '/deliverables/del-1/reviewed',
      payload: { reviewed: true },
    });

    expect(response.statusCode).toBe(200);
    expect(deliverableReviewService.setDeliverableReviewed).toHaveBeenCalledWith(
      'del-1',
      'leader-1',
      true,
    );

    await app.close();
  });

  it('clears reviewed state when reviewed=false', async () => {
    const app = buildTeamDeliverablesTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerTeamDeliverablesTestRoutes(app);

    vi.mocked(deliverableService.getDeliverableById).mockResolvedValue({
      id: 'del-1',
      userId: 'report-1',
    } as Awaited<ReturnType<typeof deliverableService.getDeliverableById>>);
    vi.mocked(userService.assertUserInLeaderSubtree).mockResolvedValue(undefined);
    vi.mocked(deliverableReviewService.setDeliverableReviewed).mockResolvedValue({
      deliverableId: 'del-1',
      reviewed: false,
    });

    const response = await app.inject({
      method: 'PUT',
      url: '/deliverables/del-1/reviewed',
      payload: { reviewed: false },
    });

    expect(response.statusCode).toBe(200);
    expect(deliverableReviewService.setDeliverableReviewed).toHaveBeenCalledWith(
      'del-1',
      'leader-1',
      false,
    );

    await app.close();
  });

  it('denies reviewed toggle for deliverable outside subtree', async () => {
    const app = buildTeamDeliverablesTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerTeamDeliverablesTestRoutes(app);

    vi.mocked(deliverableService.getDeliverableById).mockResolvedValue({
      id: 'del-1',
      userId: 'outsider-1',
    } as Awaited<ReturnType<typeof deliverableService.getDeliverableById>>);
    vi.mocked(userService.assertUserInLeaderSubtree).mockRejectedValue(
      Object.assign(new Error('forbidden'), { name: 'FORBIDDEN' }),
    );

    const response = await app.inject({
      method: 'PUT',
      url: '/deliverables/del-1/reviewed',
      payload: { reviewed: true },
    });

    expect(response.statusCode).toBe(403);

    await app.close();
  });
});
