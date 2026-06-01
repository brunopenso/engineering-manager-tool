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

describe('US1 POST /deliverables', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a deliverable for the authenticated owner', async () => {
    const app = buildDeliverablesTestApp({ userId: 'owner-1' });
    await registerDeliverablesTestRoutes(app);

    vi.mocked(deliverableService.createDeliverable).mockResolvedValue({
      id: 'del-1',
      ownerUserId: 'owner-1',
      title: 'API redesign',
      businessImpact: 'HIGH',
      systemTags: [{ id: 'tag-1', name: 'Platform', color: '#1976D2' }],
      updatedAt: '2026-05-26T00:00:00.000Z',
      description: 'Desc',
      roleInDeliverable: 'Lead',
      improvementPoints: 'Docs',
      technicalDescription: null,
      userTags: [],
      links: [],
      createdAt: '2026-05-26T00:00:00.000Z',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/deliverables',
      payload: {
        title: 'API redesign',
        description: 'Desc',
        roleInDeliverable: 'Lead',
        systemTagIds: ['tag-1'],
        businessImpact: 'HIGH',
        improvementPoints: 'Docs',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(deliverableService.createDeliverable).toHaveBeenCalledWith(
      'owner-1',
      expect.objectContaining({ title: 'API redesign' }),
    );
    await app.close();
  });

  it('creates a deliverable with no system tags', async () => {
    const app = buildDeliverablesTestApp({ userId: 'owner-1' });
    await registerDeliverablesTestRoutes(app);

    vi.mocked(deliverableService.createDeliverable).mockResolvedValue({
      id: 'del-2',
      ownerUserId: 'owner-1',
      title: 'Untagged deliverable',
      businessImpact: 'MEDIUM',
      systemTags: [],
      updatedAt: '2026-05-26T00:00:00.000Z',
      description: 'Desc',
      roleInDeliverable: 'Lead',
      improvementPoints: 'Docs',
      technicalDescription: null,
      userTags: [],
      links: [],
      createdAt: '2026-05-26T00:00:00.000Z',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/deliverables',
      payload: {
        title: 'Untagged deliverable',
        description: 'Desc',
        roleInDeliverable: 'Lead',
        systemTagIds: [],
        businessImpact: 'MEDIUM',
        improvementPoints: 'Docs',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(deliverableService.createDeliverable).toHaveBeenCalledWith(
      'owner-1',
      expect.objectContaining({ systemTagIds: [] }),
    );
    await app.close();
  });
});
