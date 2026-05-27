import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as deliverableService from '../src/services/deliverableService.js';
import {
  buildDeliverablesTestApp,
  registerDeliverablesTestRoutes,
} from './deliverables-test-app.js';

vi.mock('../src/services/deliverableService.js', () => ({
  createDeliverable: vi.fn(),
  listDeliverablesForOwner: vi.fn(),
  getDeliverableById: vi.fn(),
  updateDeliverable: vi.fn(),
  deleteDeliverable: vi.fn(),
  mapDeliverableDetail: vi.fn(),
}));

describe('US4 DELETE errors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 when deliverable is missing', async () => {
    const app = buildDeliverablesTestApp({ userId: 'owner-1' });
    await registerDeliverablesTestRoutes(app);

    vi.mocked(deliverableService.getDeliverableById).mockResolvedValue(null);

    const response = await app.inject({
      method: 'DELETE',
      url: '/deliverables/missing',
    });

    expect(response.statusCode).toBe(404);
    await app.close();
  });

  it('returns 403 when non-owner deletes', async () => {
    const app = buildDeliverablesTestApp({ userId: 'other-user' });
    await registerDeliverablesTestRoutes(app);

    vi.mocked(deliverableService.getDeliverableById).mockResolvedValue({
      id: 'del-1',
      userId: 'owner-1',
    } as never);

    const response = await app.inject({
      method: 'DELETE',
      url: '/deliverables/del-1',
    });

    expect(response.statusCode).toBe(403);
    expect(deliverableService.deleteDeliverable).not.toHaveBeenCalled();
    await app.close();
  });
});
