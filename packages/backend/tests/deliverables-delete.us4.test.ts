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

describe('US4 DELETE /deliverables/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes deliverable for owner', async () => {
    const app = buildDeliverablesTestApp({ userId: 'owner-1' });
    await registerDeliverablesTestRoutes(app);

    vi.mocked(deliverableService.getDeliverableById).mockResolvedValue({
      id: 'del-1',
      userId: 'owner-1',
    } as never);
    vi.mocked(deliverableService.deleteDeliverable).mockResolvedValue(true);

    const response = await app.inject({
      method: 'DELETE',
      url: '/deliverables/del-1',
    });

    expect(response.statusCode).toBe(204);
    await app.close();
  });
});
