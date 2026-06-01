import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as deliverableService from '../../src/services/deliverableService.js';
import {
  buildDeliverablesTestApp,
  registerDeliverablesTestRoutes,
} from './deliverables-test-app.js';
import { portfolioOwnerId, samplePortfolioSummary } from './deliverables-list-filters.setup.js';

vi.mock('../../src/services/deliverableService.js', () => ({
  createDeliverable: vi.fn(),
  listDeliverablesForOwner: vi.fn(),
  countDeliverablesForOwner: vi.fn(),
  getDeliverableById: vi.fn(),
  updateDeliverable: vi.fn(),
  deleteDeliverable: vi.fn(),
  mapDeliverableDetail: vi.fn(),
}));

describe('US4 GET /deliverables combined filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('combines date, impact, and tag filters in one request', async () => {
    const app = buildDeliverablesTestApp({ userId: portfolioOwnerId });
    await registerDeliverablesTestRoutes(app);

    vi.mocked(deliverableService.listDeliverablesForOwner).mockResolvedValue([samplePortfolioSummary]);
    vi.mocked(deliverableService.countDeliverablesForOwner).mockResolvedValue(1);

    const response = await app.inject({
      method: 'GET',
      url: '/deliverables?startDate=2026-04-01&endDate=2026-05-01&businessImpact=HIGH&systemTagIds=tag-1',
    });

    expect(response.statusCode).toBe(200);
    expect(deliverableService.listDeliverablesForOwner).toHaveBeenCalledWith(portfolioOwnerId, {
      startDate: '2026-04-01',
      endDate: '2026-05-01',
      businessImpacts: ['HIGH'],
      systemTagIds: ['tag-1'],
    });

    await app.close();
  });

  it('returns hasAnyDeliverables when filtered list is empty but portfolio has items', async () => {
    const app = buildDeliverablesTestApp({ userId: portfolioOwnerId });
    await registerDeliverablesTestRoutes(app);

    vi.mocked(deliverableService.listDeliverablesForOwner).mockResolvedValue([]);
    vi.mocked(deliverableService.countDeliverablesForOwner).mockResolvedValue(2);

    const response = await app.inject({
      method: 'GET',
      url: '/deliverables?startDate=2026-04-01&endDate=2026-05-01',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      deliverables: [],
      hasAnyDeliverables: true,
    });

    await app.close();
  });
});
