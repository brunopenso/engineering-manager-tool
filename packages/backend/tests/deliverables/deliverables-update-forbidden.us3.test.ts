import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as deliverableService from '../../src/services/deliverableService.js';
import {
  buildDeliverablesTestApp,
  registerDeliverablesTestRoutes,
} from './deliverables-test-app.js';

vi.mock('../../src/services/deliverableService.js', () => ({
  createDeliverable: vi.fn(),
  listDeliverablesForOwner: vi.fn(),
  getDeliverableById: vi.fn(),
  updateDeliverable: vi.fn(),
  deleteDeliverable: vi.fn(),
  mapDeliverableDetail: vi.fn(),
}));

describe('US3 PATCH forbidden', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 when non-owner updates', async () => {
    const app = buildDeliverablesTestApp({ userId: 'other-user' });
    await registerDeliverablesTestRoutes(app);

    vi.mocked(deliverableService.getDeliverableById).mockResolvedValue({
      id: 'del-1',
      userId: 'owner-1',
    } as never);

    const response = await app.inject({
      method: 'PATCH',
      url: '/deliverables/del-1',
      payload: {
        title: 'Updated',
        description: 'Desc',
        roleInDeliverable: 'Lead',
        systemTagIds: ['tag-1'],
        businessImpact: 'MEDIUM',
        improvementPoints: 'Docs',
        userTags: [],
        links: [],
      },
    });

    expect(response.statusCode).toBe(403);
    expect(deliverableService.updateDeliverable).not.toHaveBeenCalled();
    await app.close();
  });
});
