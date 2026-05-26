import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeliverableValidationError } from '../services/deliverableValidation.js';
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

describe('US1 POST /deliverables validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when validation fails', async () => {
    const app = buildDeliverablesTestApp({ userId: 'owner-1' });
    await registerDeliverablesTestRoutes(app);

    vi.mocked(deliverableService.createDeliverable).mockRejectedValue(
      new DeliverableValidationError('Title is required.'),
    );

    const response = await app.inject({
      method: 'POST',
      url: '/deliverables',
      payload: {
        title: '   ',
        description: 'Desc',
        roleInDeliverable: 'Lead',
        systemTagIds: ['tag-1'],
        businessImpact: 'HIGH',
        improvementPoints: 'Docs',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
    await app.close();
  });
});
