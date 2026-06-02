import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InvalidSystemTagError } from '../../src/services/deliverableValidation.js';
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

describe('US3 GET /deliverables system tag filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes systemTagIds to service', async () => {
    const app = buildDeliverablesTestApp({ userId: portfolioOwnerId });
    await registerDeliverablesTestRoutes(app);

    vi.mocked(deliverableService.listDeliverablesForOwner).mockResolvedValue([]);
    vi.mocked(deliverableService.countDeliverablesForOwner).mockResolvedValue(0);

    const response = await app.inject({
      method: 'GET',
      url: '/deliverables?startDate=2026-04-01&endDate=2026-05-01&systemTagIds=tag-1&systemTagIds=tag-2',
    });

    expect(response.statusCode).toBe(200);
    expect(deliverableService.listDeliverablesForOwner).toHaveBeenCalledWith(
      portfolioOwnerId,
      expect.objectContaining({
        systemTagIds: ['tag-1', 'tag-2'],
      }),
    );

    await app.close();
  });

  it('returns 400 when service rejects invalid system tags', async () => {
    const app = buildDeliverablesTestApp({ userId: portfolioOwnerId });
    await registerDeliverablesTestRoutes(app);

    vi.mocked(deliverableService.listDeliverablesForOwner).mockRejectedValue(
      new InvalidSystemTagError('One or more system tags are invalid or no longer available.'),
    );

    const response = await app.inject({
      method: 'GET',
      url: '/deliverables?startDate=2026-04-01&endDate=2026-05-01&systemTagIds=missing-tag',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe('INVALID_SYSTEM_TAG');

    await app.close();
  });
});
