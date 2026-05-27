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

describe('US2 GET /users/:userId/deliverables peer deny', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 when peer requests another user portfolio', async () => {
    const app = buildDeliverablesTestApp({ userId: 'user-report2' });
    await registerDeliverablesTestRoutes(app);

    const response = await app.inject({
      method: 'GET',
      url: '/users/user-report/deliverables',
    });

    expect(response.statusCode).toBe(403);
    expect(deliverableService.listDeliverablesForOwner).not.toHaveBeenCalled();
    await app.close();
  });
});
