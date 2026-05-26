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

describe('US2 GET /deliverables', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns owner deliverable summaries', async () => {
    const app = buildDeliverablesTestApp({ userId: 'owner-1' });
    await registerDeliverablesTestRoutes(app);

    vi.mocked(deliverableService.listDeliverablesForOwner).mockResolvedValue([
      {
        id: 'del-1',
        ownerUserId: 'owner-1',
        title: 'API redesign',
        businessImpact: 'HIGH',
        systemTags: [{ id: 'tag-1', name: 'Platform', color: '#1976D2' }],
        updatedAt: '2026-05-26T00:00:00.000Z',
      },
    ]);

    const response = await app.inject({ method: 'GET', url: '/deliverables' });

    expect(response.statusCode).toBe(200);
    expect(deliverableService.listDeliverablesForOwner).toHaveBeenCalledWith('owner-1');
    expect(response.json().deliverables).toHaveLength(1);
    await app.close();
  });
});
