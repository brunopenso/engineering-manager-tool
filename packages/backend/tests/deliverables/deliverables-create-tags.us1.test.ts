import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InvalidSystemTagError } from '../../src/services/deliverableValidation.js';
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

describe('US1 POST /deliverables system tags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when system tag ids are invalid', async () => {
    const app = buildDeliverablesTestApp({ userId: 'owner-1' });
    await registerDeliverablesTestRoutes(app);

    vi.mocked(deliverableService.createDeliverable).mockRejectedValue(
      new InvalidSystemTagError('One or more system tags are invalid or no longer available.'),
    );

    const response = await app.inject({
      method: 'POST',
      url: '/deliverables',
      payload: {
        title: 'API redesign',
        description: 'Desc',
        roleInDeliverable: 'Lead',
        systemTagIds: ['missing-tag'],
        businessImpact: 'HIGH',
        improvementPoints: 'Docs',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'INVALID_SYSTEM_TAG' });
    await app.close();
  });
});
