import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as deliverableService from '../services/deliverableService.js';
import {
  buildDeliverablesTestApp,
  registerDeliverablesTestRoutes,
} from './deliverables-test-app.js';

vi.mock('../services/deliverableService.js', () => ({
  createDeliverable: vi.fn(),
  listDeliverablesForOwner: vi.fn(),
  getDeliverableById: vi.fn(),
  updateDeliverable: vi.fn(),
  deleteDeliverable: vi.fn(),
  mapDeliverableDetail: vi.fn(),
}));

describe('US3 PATCH /deliverables/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates deliverable for owner with stable id', async () => {
    const app = buildDeliverablesTestApp({ userId: 'owner-1' });
    await registerDeliverablesTestRoutes(app);

    vi.mocked(deliverableService.getDeliverableById).mockResolvedValue({
      id: 'del-1',
      userId: 'owner-1',
    } as never);

    vi.mocked(deliverableService.updateDeliverable).mockResolvedValue({
      id: 'del-1',
      ownerUserId: 'owner-1',
      title: 'Updated',
      businessImpact: 'MEDIUM',
      systemTags: [],
      updatedAt: '2026-05-26T01:00:00.000Z',
      description: 'Desc',
      roleInDeliverable: 'Lead',
      improvementPoints: 'Docs',
      technicalDescription: null,
      userTags: [],
      links: [],
      createdAt: '2026-05-26T00:00:00.000Z',
    });

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

    expect(response.statusCode).toBe(200);
    expect(response.json().deliverable.id).toBe('del-1');
    await app.close();
  });
});
