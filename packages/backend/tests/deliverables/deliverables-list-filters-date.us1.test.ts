import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as deliverableService from '../../src/services/deliverableService.js';
import { defaultLast30DayRange } from '../../src/services/deliverableListQuery.js';
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

describe('US1 GET /deliverables date filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('defaults to last-30-day range when dates omitted', async () => {
    const app = buildDeliverablesTestApp({ userId: portfolioOwnerId });
    await registerDeliverablesTestRoutes(app);
    const defaults = defaultLast30DayRange();

    vi.mocked(deliverableService.listDeliverablesForOwner).mockResolvedValue([
      samplePortfolioSummary,
    ]);
    vi.mocked(deliverableService.countDeliverablesForOwner).mockResolvedValue(1);

    const response = await app.inject({ method: 'GET', url: '/deliverables' });

    expect(response.statusCode).toBe(200);
    expect(deliverableService.listDeliverablesForOwner).toHaveBeenCalledWith(portfolioOwnerId, {
      startDate: defaults.startDate,
      endDate: defaults.endDate,
      businessImpacts: undefined,
      systemTagIds: undefined,
    });

    await app.close();
  });

  it('passes explicit date range to service', async () => {
    const app = buildDeliverablesTestApp({ userId: portfolioOwnerId });
    await registerDeliverablesTestRoutes(app);

    vi.mocked(deliverableService.listDeliverablesForOwner).mockResolvedValue([]);
    vi.mocked(deliverableService.countDeliverablesForOwner).mockResolvedValue(0);

    const response = await app.inject({
      method: 'GET',
      url: '/deliverables?startDate=2026-04-01&endDate=2026-05-01',
    });

    expect(response.statusCode).toBe(200);
    expect(deliverableService.listDeliverablesForOwner).toHaveBeenCalledWith(portfolioOwnerId, {
      startDate: '2026-04-01',
      endDate: '2026-05-01',
      businessImpacts: undefined,
      systemTagIds: undefined,
    });

    await app.close();
  });

  it('rejects invalid date range with 400', async () => {
    const app = buildDeliverablesTestApp({ userId: portfolioOwnerId });
    await registerDeliverablesTestRoutes(app);

    const response = await app.inject({
      method: 'GET',
      url: '/deliverables?startDate=2026-05-29&endDate=2026-05-01',
    });

    expect(response.statusCode).toBe(400);
    expect(deliverableService.listDeliverablesForOwner).not.toHaveBeenCalled();

    await app.close();
  });
});
