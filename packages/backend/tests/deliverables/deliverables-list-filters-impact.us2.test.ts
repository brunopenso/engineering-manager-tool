import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as deliverableService from '../../src/services/deliverableService.js';
import {
  buildDeliverablesTestApp,
  registerDeliverablesTestRoutes,
} from './deliverables-test-app.js';
import { portfolioOwnerId } from './deliverables-list-filters.setup.js';

vi.mock('../../src/services/deliverableService.js', () => ({
  createDeliverable: vi.fn(),
  listDeliverablesForOwner: vi.fn(),
  countDeliverablesForOwner: vi.fn(),
  getDeliverableById: vi.fn(),
  updateDeliverable: vi.fn(),
  deleteDeliverable: vi.fn(),
  mapDeliverableDetail: vi.fn(),
}));

describe('US2 GET /deliverables impact filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes single and multiple businessImpact values', async () => {
    const app = buildDeliverablesTestApp({ userId: portfolioOwnerId });
    await registerDeliverablesTestRoutes(app);

    vi.mocked(deliverableService.listDeliverablesForOwner).mockResolvedValue([]);
    vi.mocked(deliverableService.countDeliverablesForOwner).mockResolvedValue(0);

    const response = await app.inject({
      method: 'GET',
      url: '/deliverables?startDate=2026-04-01&endDate=2026-05-01&businessImpact=MEDIUM&businessImpact=HIGH',
    });

    expect(response.statusCode).toBe(200);
    expect(deliverableService.listDeliverablesForOwner).toHaveBeenCalledWith(
      portfolioOwnerId,
      expect.objectContaining({
        businessImpacts: ['MEDIUM', 'HIGH'],
      }),
    );

    await app.close();
  });

  it('omits impact filter when businessImpact not provided', async () => {
    const app = buildDeliverablesTestApp({ userId: portfolioOwnerId });
    await registerDeliverablesTestRoutes(app);

    vi.mocked(deliverableService.listDeliverablesForOwner).mockResolvedValue([]);
    vi.mocked(deliverableService.countDeliverablesForOwner).mockResolvedValue(0);

    await app.inject({
      method: 'GET',
      url: '/deliverables?startDate=2026-04-01&endDate=2026-05-01',
    });

    expect(deliverableService.listDeliverablesForOwner).toHaveBeenCalledWith(
      portfolioOwnerId,
      expect.objectContaining({
        businessImpacts: undefined,
      }),
    );

    await app.close();
  });
});
